import { randomBytes } from 'node:crypto'
import { requireManagement } from '../../utils/requireManagement'
import { safeServerError } from '../../utils/safeLog'
import { recoveryLink } from '../../utils/recoveryLink'
import {
  AccessProvisioningError,
  provisionAccess,
  type AccessProvisioningDependencies,
  type AccessRole,
  type ProviderError
} from '../../services/accessProvisioning'

type InviteBody = { nome?: unknown; email?: unknown; papel?: unknown; professorId?: unknown }

const isMissingAuthUser = (error: ProviderError | null | undefined) => {
  const code = String(error?.code || '').toLowerCase()
  const message = String(error?.message || '').toLowerCase()
  return code === 'user_not_found'
    || message.includes('user not found')
}

const isMissingAccessMigration = (error: ProviderError | null | undefined) => {
  const code = String(error?.code || '').toUpperCase()
  const message = String(error?.message || '').toLowerCase()
  return code === 'PGRST202'
    || code === '42883'
    || message.includes('provisionar_acesso_usuario')
    || message.includes('reparar_vinculo_professor_orfao')
    || message.includes('obter_usuario_auth_por_email')
}

const databaseFailure = (error: ProviderError | null | undefined, fallback: string): never => {
  if (isMissingAccessMigration(error)) {
    throw new AccessProvisioningError(
      503,
      'A correção de acesso ainda não foi aplicada no banco. Execute a migration 202609160045_acesso_usuarios_transacional.sql no Supabase.',
      'ACCESS_MIGRATION_MISSING'
    )
  }
  throw new AccessProvisioningError(502, fallback, String(error?.code || 'DATABASE_ERROR'))
}

export default defineEventHandler(async (event) => {
  try {
    const { admin, authUser } = await requireManagement(event)
    const body = await readBody<InviteBody>(event)
    const papel = String(body?.papel || '') as AccessRole
    const professorId = body?.professorId ? String(body.professorId) : null
    const appUrl = String(useRuntimeConfig(event).public.appUrl || '').replace(/\/$/, '')

    const dependencies: AccessProvisioningDependencies = {
      async assertDatabaseReady() {
        const [profile, lookup] = await Promise.all([
          admin.from('usuarios').select('id,onboarding_concluido').limit(0),
          admin.rpc('obter_usuario_auth_por_email', { p_email: '' })
        ])
        if (lookup.error) databaseFailure(lookup.error, 'Não foi possível verificar o schema de acessos.')
        if (profile.error) {
          if (['42703', 'PGRST204'].includes(String(profile.error.code))) {
            throw new AccessProvisioningError(503, 'A atualização de onboarding ainda não foi aplicada no banco. Execute a migration 202609070041_onboarding_gestao.sql.', 'ONBOARDING_SCHEMA_UNAVAILABLE')
          }
          databaseFailure(profile.error, 'Não foi possível verificar o schema de onboarding. Tente novamente.')
        }
      },
      async getProfessor(id) {
        const { data, error } = await admin
          .from('professores')
          .select('id,email,usuario_id,ativo')
          .eq('id', id)
          .maybeSingle()
        if (error) databaseFailure(error, 'Não foi possível consultar o cadastro do professor.')
        return data ? {
          id: data.id,
          email: data.email,
          usuarioId: data.usuario_id,
          ativo: Boolean(data.ativo)
        } : null
      },

      async lookupAuthUser(id) {
        const { data, error } = await admin.auth.admin.getUserById(id)
        if (error) {
          if (isMissingAuthUser(error)) return null
          throw new AccessProvisioningError(
            502,
            'Não foi possível confirmar o vínculo existente no Supabase Auth.',
            String(error.code || 'AUTH_LOOKUP_FAILED')
          )
        }
        return data?.user ? {
          id: data.user.id,
          email: data.user.email,
          appRole: String(data.user.app_metadata?.papel || '') || null
        } : null
      },

      async findAuthUserByEmail(email) {
        const { data, error } = await admin
          .rpc('obter_usuario_auth_por_email', { p_email: email })
          .maybeSingle()
        if (error) databaseFailure(error, 'Não foi possível localizar a identidade existente no Supabase Auth.')
        return data ? {
          id: data.usuario_id,
          email: data.email,
          appRole: data.papel || null
        } : null
      },

      async repairOrphanProfessor(targetProfessorId, userId) {
        const { data, error } = await admin.rpc('reparar_vinculo_professor_orfao', {
          p_actor_id: authUser.id,
          p_professor_id: targetProfessorId,
          p_usuario_id: userId
        })
        if (error) databaseFailure(error, 'O vínculo antigo do professor está inconsistente e não pôde ser reparado.')
        return data === true
      },

      async createAuthUser(input) {
        const { data, error } = await admin.auth.admin.createUser({
          email: input.email,
          password: input.password,
          email_confirm: input.emailConfirm,
          user_metadata: input.userMetadata,
          app_metadata: input.appMetadata
        })
        return {
          user: data?.user ? {
            id: data.user.id,
            email: data.user.email,
            appRole: String(data.user.app_metadata?.papel || '') || null
          } : null,
          error
        }
      },

      async generateRecoveryLink(email, redirectTo) {
        const { data, error } = await admin.auth.admin.generateLink({
          type: 'recovery',
          email,
          options: { redirectTo }
        })
        return {
          user: data?.user ? {
            id: data.user.id,
            email: data.user.email,
            appRole: String(data.user.app_metadata?.papel || '') || null
          } : null,
          actionLink: data?.properties?.hashed_token ? recoveryLink(redirectTo, data.properties.hashed_token) : null,
          error
        }
      },

      async getAccountState(userId, currentProfessorId) {
        let professorQuery = admin.from('professores').select('id').eq('usuario_id', userId)
        if (currentProfessorId) professorQuery = professorQuery.neq('id', currentProfessorId)

        const [profileResult, studentResult, professorResult] = await Promise.all([
          admin.from('usuarios').select('papel').eq('id', userId).maybeSingle(),
          admin.from('alunos').select('id').eq('usuario_id', userId).limit(1).maybeSingle(),
          professorQuery.limit(1).maybeSingle()
        ])
        const stateError = profileResult.error || studentResult.error || professorResult.error
        if (stateError) databaseFailure(stateError, 'Não foi possível validar se a conta existente pode ser reutilizada.')

        return {
          profileRole: profileResult.data?.papel || null,
          hasStudentLink: Boolean(studentResult.data?.id),
          otherProfessorId: professorResult.data?.id || null
        }
      },

      async isDatabaseProvisioned(userId, role, currentProfessorId) {
        const profilePromise = admin
          .from('usuarios')
          .select('papel,ativo,onboarding_concluido')
          .eq('id', userId)
          .maybeSingle()
        const professorPromise = currentProfessorId
          ? admin
              .from('professores')
              .select('id')
              .eq('id', currentProfessorId)
              .eq('usuario_id', userId)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null })
        const [profileResult, professorResult] = await Promise.all([profilePromise, professorPromise])
        const stateError = profileResult.error || professorResult.error
        if (stateError) databaseFailure(stateError, 'Não foi possível confirmar o resultado do provisionamento.')

        const roleSpecificState = role === 'gestao'
          ? profileResult.data?.onboarding_concluido === true
          : Boolean(currentProfessorId && professorResult.data?.id)
        return profileResult.data?.papel === role
          && profileResult.data?.ativo === true
          && roleSpecificState
      },

      async updateAuthMetadata(userId, nome, role) {
        const { data: current, error: readError } = await admin.auth.admin.getUserById(userId)
        if (readError || !current?.user) {
          throw new AccessProvisioningError(502, 'Não foi possível ler os metadados da conta existente.', String(readError?.code || 'AUTH_METADATA_READ_FAILED'))
        }

        const snapshot = {
          appMetadata: { ...(current.user.app_metadata || {}) },
          userMetadata: { ...(current.user.user_metadata || {}) },
          rollbackToken: randomBytes(16).toString('hex')
        }

        const { error } = await admin.auth.admin.updateUserById(userId, {
          app_metadata: {
            ...(current.user.app_metadata || {}),
            papel: role,
            popmusic_provisioning_token: snapshot.rollbackToken
          },
          user_metadata: { ...(current.user.user_metadata || {}), nome }
        })
        if (error) {
          throw new AccessProvisioningError(502, 'Não foi possível atualizar o papel seguro da conta.', String(error.code || 'AUTH_METADATA_UPDATE_FAILED'))
        }
        return snapshot
      },

      async restoreAuthMetadata(userId, snapshot) {
        const { data: current, error: readError } = await admin.auth.admin.getUserById(userId)
        if (readError || !current?.user) {
          throw new AccessProvisioningError(502, 'Não foi possível conferir os metadados antes da restauração.', String(readError?.code || 'AUTH_METADATA_RESTORE_READ_FAILED'))
        }
        if (current.user.app_metadata?.popmusic_provisioning_token !== snapshot.rollbackToken) {
          throw new AccessProvisioningError(409, 'Os metadados foram alterados por outra operação concorrente.', 'AUTH_METADATA_CHANGED_CONCURRENTLY')
        }
        const { error } = await admin.auth.admin.updateUserById(userId, {
          app_metadata: snapshot.appMetadata,
          user_metadata: snapshot.userMetadata
        })
        if (error) {
          throw new AccessProvisioningError(502, 'Não foi possível restaurar os metadados anteriores da conta.', String(error.code || 'AUTH_METADATA_RESTORE_FAILED'))
        }
      },

      async finalizeAuthMetadata(userId, snapshot) {
        const { data: current, error: readError } = await admin.auth.admin.getUserById(userId)
        if (readError || !current?.user) throw readError || new Error('Auth user ausente')
        if (current.user.app_metadata?.popmusic_provisioning_token !== snapshot.rollbackToken) return

        const appMetadata = { ...(current.user.app_metadata || {}) }
        delete appMetadata.popmusic_provisioning_token
        const { error } = await admin.auth.admin.updateUserById(userId, { app_metadata: appMetadata })
        if (error) throw error
      },

      async provisionDatabase(input) {
        const { error } = await admin.rpc('provisionar_acesso_usuario', {
          p_actor_id: input.actorId,
          p_usuario_id: input.userId,
          p_nome: input.nome,
          p_email: input.email,
          p_papel: input.papel,
          p_professor_id: input.professorId
        })
        if (error) databaseFailure(error, 'O Auth foi validado, mas o perfil e o vínculo não puderam ser salvos.')
      }
    }

    return await provisionAccess(dependencies, {
      actorId: authUser.id,
      nome: String(body?.nome || ''),
      email: String(body?.email || ''),
      papel,
      professorId,
      appUrl,
      temporaryPassword: `Pm!7${randomBytes(18).toString('base64url')}`
    })
  } catch (error: any) {
    safeServerError('auth:invite', error)
    if (error instanceof AccessProvisioningError) {
      throw createError({
        statusCode: error.statusCode,
        statusMessage: error.message,
        data: { code: error.code }
      })
    }
    if (Number(error?.statusCode) >= 400 && Number(error?.statusCode) < 600) throw error

    const message = String(error?.message || '').toLowerCase()
    if (message.includes('fetch failed') || message.includes('enotfound') || message.includes('dns')) {
      throw createError({
        statusCode: 503,
        statusMessage: 'O projeto Supabase está indisponível. Confirme no Studio se ele está ativo e se NUXT_PUBLIC_SUPABASE_URL aponta para o projeto correto.'
      })
    }
    throw createError({ statusCode: 500, statusMessage: 'Não foi possível criar o acesso.' })
  }
})
