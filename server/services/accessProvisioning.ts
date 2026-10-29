export type AccessRole = 'gestao' | 'professor'

export type ProviderError = {
  code?: string
  message?: string
  status?: number
}

export type AccessAuthUser = {
  id: string
  email?: string | null
  appRole?: string | null
}

export type AccessProfessor = {
  id: string
  email: string | null
  usuarioId: string | null
  ativo: boolean
}

export type AccessAccountState = {
  profileRole: string | null
  hasStudentLink: boolean
  otherProfessorId: string | null
}

export type AuthMetadataSnapshot = {
  appMetadata: Record<string, unknown>
  userMetadata: Record<string, unknown>
  rollbackToken: string
}

export type CreateAuthUserInput = {
  email: string
  password: string
  emailConfirm: true
  userMetadata: { nome: string; must_change_password: true }
  appMetadata: { papel: AccessRole }
}

export type ProvisionDatabaseInput = {
  actorId: string
  userId: string
  nome: string
  email: string
  papel: AccessRole
  professorId: string | null
}

export interface AccessProvisioningDependencies {
  assertDatabaseReady: () => Promise<void>
  getProfessor: (id: string) => Promise<AccessProfessor | null>
  lookupAuthUser: (id: string) => Promise<AccessAuthUser | null>
  findAuthUserByEmail: (email: string) => Promise<AccessAuthUser | null>
  repairOrphanProfessor: (professorId: string, userId: string) => Promise<boolean>
  createAuthUser: (input: CreateAuthUserInput) => Promise<{ user: AccessAuthUser | null; error: ProviderError | null }>
  generateRecoveryLink: (email: string, redirectTo: string) => Promise<{ user: AccessAuthUser | null; actionLink: string | null; error: ProviderError | null }>
  getAccountState: (userId: string, professorId: string | null) => Promise<AccessAccountState>
  isDatabaseProvisioned: (userId: string, papel: AccessRole, professorId: string | null) => Promise<boolean>
  updateAuthMetadata: (userId: string, nome: string, papel: AccessRole) => Promise<AuthMetadataSnapshot>
  restoreAuthMetadata: (userId: string, snapshot: AuthMetadataSnapshot) => Promise<void>
  finalizeAuthMetadata: (userId: string, snapshot: AuthMetadataSnapshot) => Promise<void>
  provisionDatabase: (input: ProvisionDatabaseInput) => Promise<void>
}

export type ProvisionAccessInput = {
  actorId: string
  nome: string
  email: string
  papel: AccessRole
  professorId: string | null
  appUrl: string
  temporaryPassword: string
}

export type ProvisionAccessResult = {
  success: true
  activationLink: string
  temporaryPassword: string | null
  existingAccount: boolean
  repairedOrphan: boolean
}

export class AccessProvisioningError extends Error {
  statusCode: number
  code: string

  constructor(statusCode: number, message: string, code: string) {
    super(message)
    this.name = 'AccessProvisioningError'
    this.statusCode = statusCode
    this.code = code
  }
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function fail(statusCode: number, message: string, code: string): never {
  throw new AccessProvisioningError(statusCode, message, code)
}

export const isExistingEmailError = (error: ProviderError | null | undefined) => {
  const code = String(error?.code || '').toLowerCase()
  const message = String(error?.message || '').toLowerCase()
  return code === 'email_exists'
    || code === 'user_already_exists'
    || message.includes('already been registered')
    || message.includes('email address is already registered')
    || message.includes('email address already in use')
}

export const isUserCreationTriggerError = (error: ProviderError | null | undefined) => {
  const message = String(error?.message || '').toLowerCase()
  return message.includes('database error creating new user')
    || message.includes('error saving new user')
}

const normalizedEmail = (value: string | null | undefined) => String(value || '').trim().toLowerCase()

const assertReusableAccount = async (
  deps: AccessProvisioningDependencies,
  user: AccessAuthUser,
  email: string,
  papel: AccessRole,
  professorId: string | null
) => {
  if (normalizedEmail(user.email) !== email) {
    fail(409, 'A conta encontrada possui um e-mail diferente do cadastro.', 'AUTH_EMAIL_MISMATCH')
  }

  const state = await deps.getAccountState(user.id, professorId)
  if (state.hasStudentLink) {
    fail(409, 'Este e-mail ja pertence ao acesso de um aluno.', 'ACCOUNT_USED_BY_STUDENT')
  }
  if (state.otherProfessorId) {
    fail(409, 'Este e-mail ja esta vinculado a outro professor.', 'ACCOUNT_USED_BY_OTHER_TEACHER')
  }

  if (user.appRole && user.appRole !== papel) {
    const repairableAuthRole = user.appRole === 'aluno'
      && (!state.profileRole || state.profileRole === 'aluno')
      && !state.hasStudentLink
      && !state.otherProfessorId
    if (!repairableAuthRole) {
      fail(409, 'O papel seguro desta conta pertence a outro tipo de acesso.', 'AUTH_ROLE_CONFLICT')
    }
  }

  if (state.profileRole && state.profileRole !== papel) {
    const repairableDefaultProfile = state.profileRole === 'aluno'
      && !state.hasStudentLink
      && !state.otherProfessorId
    if (!repairableDefaultProfile) {
      fail(409, 'Este e-mail ja pertence a outro tipo de acesso.', 'ACCOUNT_ROLE_CONFLICT')
    }
  }
}

const recoverExistingAccount = async (
  deps: AccessProvisioningDependencies,
  user: AccessAuthUser,
  input: ProvisionAccessInput,
  repairedOrphan: boolean
): Promise<ProvisionAccessResult> => {
  await assertReusableAccount(deps, user, input.email, input.papel, input.professorId)

  const recovery = await deps.generateRecoveryLink(
    input.email,
    `${input.appUrl}/confirm?mode=recovery`
  )
  if (recovery.error || !recovery.user || !recovery.actionLink) {
    fail(502, 'A conta existe, mas o Supabase nao conseguiu gerar o link de recuperacao.', 'RECOVERY_LINK_FAILED')
  }
  if (recovery.user.id !== user.id) {
    fail(409, 'O e-mail retornou uma identidade diferente da conta vinculada.', 'RECOVERY_IDENTITY_MISMATCH')
  }

  // A RPC valida o papel diretamente em auth.users, entao a metadata precisa
  // ser atualizada antes. Se o banco rejeitar e confirmar que nao houve commit,
  // restauramos exatamente os metadados anteriores.
  const metadataBefore = await deps.updateAuthMetadata(user.id, input.nome, input.papel)
  try {
    await deps.provisionDatabase({
      actorId: input.actorId,
      userId: user.id,
      nome: input.nome,
      email: input.email,
      papel: input.papel,
      professorId: input.professorId
    })
  } catch (error) {
    let commitState: 'committed' | 'not_committed' | 'unknown' = 'unknown'
    try {
      commitState = await deps.isDatabaseProvisioned(user.id, input.papel, input.professorId)
        ? 'committed'
        : 'not_committed'
    } catch {
      // Sem conseguir confirmar o estado, preservar a identidade e deixar a
      // operacao idempotente para uma nova tentativa e mais seguro que apagar.
    }

    if (commitState === 'not_committed') {
      try {
        await deps.restoreAuthMetadata(user.id, metadataBefore)
      } catch {
        fail(
          503,
          'O banco recusou o vinculo e os metadados anteriores nao puderam ser restaurados. Tente novamente antes de compartilhar o acesso.',
          'AUTH_METADATA_ROLLBACK_FAILED'
        )
      }
      throw error
    }
    if (commitState === 'unknown') {
      fail(
        503,
        'Nao foi possivel confirmar se o vinculo foi concluido. Nenhum acesso foi apagado; tente novamente para reconciliar o estado.',
        'PROVISION_STATE_UNKNOWN'
      )
    }
  }

  try {
    await deps.finalizeAuthMetadata(user.id, metadataBefore)
  } catch {
    // O marcador nao concede acesso. Uma proxima operacao pode substitui-lo.
  }

  return {
    success: true,
    activationLink: recovery.actionLink,
    temporaryPassword: null,
    existingAccount: true,
    repairedOrphan
  }
}

export async function provisionAccess(
  deps: AccessProvisioningDependencies,
  rawInput: ProvisionAccessInput
): Promise<ProvisionAccessResult> {
  const input: ProvisionAccessInput = {
    ...rawInput,
    nome: String(rawInput.nome || '').trim(),
    email: normalizedEmail(rawInput.email),
    appUrl: String(rawInput.appUrl || '').replace(/\/$/, '')
  }

  if (!uuidPattern.test(input.actorId)) {
    fail(401, 'A sessao da gestao e invalida.', 'INVALID_ACTOR_ID')
  }
  if (input.nome.length < 3 || input.nome.length > 150) {
    fail(400, 'Nome invalido.', 'INVALID_NAME')
  }
  if (!emailPattern.test(input.email) || input.email.length > 254) {
    fail(400, 'E-mail invalido.', 'INVALID_EMAIL')
  }
  if (String(input.temporaryPassword || '').length < 12
    || !/[A-Z]/.test(input.temporaryPassword)
    || !/[a-z]/.test(input.temporaryPassword)
    || !/\d/.test(input.temporaryPassword)) {
    fail(500, 'A senha temporaria segura nao foi gerada.', 'INVALID_TEMPORARY_PASSWORD')
  }
  if (!['gestao', 'professor'].includes(input.papel)) {
    fail(400, 'Papel invalido.', 'INVALID_ROLE')
  }
  if ((input.papel === 'professor') !== Boolean(input.professorId)) {
    fail(400, 'Vinculo de professor invalido.', 'INVALID_TEACHER_LINK')
  }
  if (input.professorId && !uuidPattern.test(input.professorId)) {
    fail(400, 'Professor invalido.', 'INVALID_TEACHER_ID')
  }
  let parsedAppUrl: URL
  try {
    parsedAppUrl = new URL(input.appUrl)
  } catch {
    fail(500, 'A URL oficial da aplicacao nao esta configurada.', 'INVALID_APP_URL')
  }
  if (!['http:', 'https:'].includes(parsedAppUrl.protocol)
    || parsedAppUrl.username
    || parsedAppUrl.password
    || parsedAppUrl.search
    || parsedAppUrl.hash) {
    fail(500, 'A URL oficial da aplicacao nao esta configurada.', 'INVALID_APP_URL')
  }
  const localHosts = new Set(['localhost', '127.0.0.1', '[::1]'])
  if (parsedAppUrl.protocol !== 'https:' && !localHosts.has(parsedAppUrl.hostname)) {
    fail(500, 'A URL oficial deve usar HTTPS fora do ambiente local.', 'INSECURE_APP_URL')
  }

  // Não criar uma identidade Auth quando o schema necessário ainda está ausente.
  await deps.assertDatabaseReady()
  let repairedOrphan = false
  if (input.professorId) {
    const professor = await deps.getProfessor(input.professorId)
    if (!professor?.ativo) {
      fail(404, 'Professor inexistente ou inativo.', 'TEACHER_NOT_AVAILABLE')
    }
    if (normalizedEmail(professor.email) !== input.email) {
      fail(400, 'O e-mail nao corresponde ao cadastro do professor.', 'TEACHER_EMAIL_MISMATCH')
    }

    if (professor.usuarioId) {
      const linkedAuthUser = await deps.lookupAuthUser(professor.usuarioId)
      if (linkedAuthUser) {
        return recoverExistingAccount(deps, linkedAuthUser, input, false)
      }

      const repaired = await deps.repairOrphanProfessor(professor.id, professor.usuarioId)
      if (!repaired) {
        fail(
          409,
          'O vinculo do professor mudou durante o reparo. Atualize a lista e tente novamente.',
          'ORPHAN_LINK_CHANGED'
        )
      }
      repairedOrphan = true
    }
  }

  const created = await deps.createAuthUser({
    email: input.email,
    password: input.temporaryPassword,
    emailConfirm: true,
    userMetadata: { nome: input.nome, must_change_password: true },
    appMetadata: { papel: input.papel }
  })

  if (created.error || !created.user) {
    if (isExistingEmailError(created.error)) {
      const existingUser = await deps.findAuthUserByEmail(input.email)
      if (!existingUser) {
        fail(409, 'Este e-mail ja possui acesso, mas a identidade nao foi localizada.', 'EXISTING_ACCOUNT_NOT_FOUND')
      }
      return recoverExistingAccount(deps, existingUser, input, repairedOrphan)
    }
    if (isUserCreationTriggerError(created.error)) {
      fail(
        503,
        'O trigger de usuarios do Supabase falhou. Execute a migration 202609160045_acesso_usuarios_transacional.sql.',
        'AUTH_DATABASE_TRIGGER_FAILED'
      )
    }
    if (Number(created.error?.status) === 401 || Number(created.error?.status) === 403) {
      fail(
        503,
        'O Supabase recusou a chave administrativa. Confira NUXT_SUPABASE_SECRET_KEY na Vercel e faca um novo deploy.',
        'SUPABASE_ADMIN_KEY_REJECTED'
      )
    }
    fail(
      502,
      'O Supabase nao conseguiu criar a conta. Confirme se o projeto esta ativo e se a URL configurada esta correta.',
      'AUTH_CREATE_FAILED'
    )
  }

  try {
    await deps.provisionDatabase({
      actorId: input.actorId,
      userId: created.user.id,
      nome: input.nome,
      email: input.email,
      papel: input.papel,
      professorId: input.professorId
    })
  } catch (error) {
    // Auth e Postgres nao compartilham a mesma transacao. Antes de reportar a
    // falha, verificamos se a RPC confirmou e apenas a resposta se perdeu. Uma
    // identidade nova jamais e apagada automaticamente: a proxima tentativa
    // reutiliza a conta com seguranca e conclui o vinculo.
    try {
      const committed = await deps.isDatabaseProvisioned(
        created.user.id,
        input.papel,
        input.professorId
      )
      if (committed) {
        return {
          success: true,
          activationLink: `${input.appUrl}/login`,
          temporaryPassword: input.temporaryPassword,
          existingAccount: false,
          repairedOrphan
        }
      }
    } catch {
      // Mantem o erro original e o Auth recuperavel para uma nova tentativa.
    }
    throw error
  }

  return {
    success: true,
    activationLink: `${input.appUrl}/login`,
    temporaryPassword: input.temporaryPassword,
    existingAccount: false,
    repairedOrphan
  }
}
