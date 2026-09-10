import { requireManagement } from '../../utils/requireManagement'
import { safeServerError } from '../../utils/safeLog'

type InviteBody = { nome?: unknown; email?: unknown; papel?: unknown; professorId?: unknown }

export default defineEventHandler(async (event) => {
  let createdUserId: string | null = null
  let shouldDeleteCreatedUser = false
  try {
    const { admin, authUser } = await requireManagement(event)
    const body = await readBody<InviteBody>(event)
    const nome = String(body?.nome || '').trim()
    const email = String(body?.email || '').trim().toLowerCase()
    const papel = String(body?.papel || '')
    const professorId = body?.professorId ? String(body.professorId) : null

    if (nome.length < 3 || nome.length > 150) throw createError({ statusCode: 400, statusMessage: 'Nome inválido.' })
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) throw createError({ statusCode: 400, statusMessage: 'E-mail inválido.' })
    if (!['gestao', 'professor'].includes(papel)) throw createError({ statusCode: 400, statusMessage: 'Papel inválido.' })
    if ((papel === 'professor') !== Boolean(professorId)) throw createError({ statusCode: 400, statusMessage: 'Vínculo de professor inválido.' })

    if (professorId) {
      const { data: professor } = await admin.from('professores').select('id,email,usuario_id,ativo').eq('id', professorId).maybeSingle()
      if (!professor?.ativo || professor.usuario_id) throw createError({ statusCode: 409, statusMessage: 'Professor inexistente, inativo ou já vinculado.' })
      if (String(professor.email || '').trim().toLowerCase() !== email) throw createError({ statusCode: 400, statusMessage: 'O e-mail não corresponde ao cadastro do professor.' })
    }

    const appUrl = String(useRuntimeConfig(event).public.appUrl || getRequestURL(event).origin).replace(/\/$/, '')
    const temporaryPassword = 'PopMusic1234@'
    const { data: created, error: createUserError } = await admin.auth.admin.createUser({
      email,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: { nome, must_change_password: true }
    })

    let accessUser = created?.user || null
    let activationLink = `${appUrl}/login`
    let existingAccount = false
    if (createUserError || !accessUser) {
      const code = String(createUserError?.code || '')
      const message = String(createUserError?.message || '').toLowerCase()
      if (code === 'email_exists' || code === 'user_already_exists' || message.includes('already')) {
        const { data: recovery, error: recoveryError } = await admin.auth.admin.generateLink({
          type: 'recovery', email, options: { redirectTo: `${appUrl}/confirm?mode=recovery` }
        })
        if (recoveryError || !recovery?.user || !recovery.properties?.action_link) {
          throw createError({ statusCode: 409, statusMessage: 'Este e-mail já possui acesso, mas não foi possível gerar um novo link.' })
        }
        accessUser = recovery.user
        activationLink = recovery.properties.action_link
        existingAccount = true
      } else if (Number(createUserError?.status) === 401 || Number(createUserError?.status) === 403) {
        throw createError({ statusCode: 503, statusMessage: 'O Supabase recusou a criação administrativa. Confira SUPABASE_SECRET_KEY na Vercel e faça um novo deploy.' })
      } else {
        throw createError({ statusCode: 502, statusMessage: 'O Supabase não conseguiu criar a conta de acesso.' })
      }
    }

    createdUserId = accessUser.id
    shouldDeleteCreatedUser = !existingAccount
    if (existingAccount) {
      const { data: existingProfile } = await admin.from('usuarios').select('papel').eq('id', createdUserId).maybeSingle()
      if (existingProfile && existingProfile.papel !== papel) {
        throw createError({ statusCode: 409, statusMessage: 'Este e-mail já pertence a outro tipo de acesso.' })
      }
      if (professorId) {
        const { data: otherLink } = await admin.from('professores').select('id').eq('usuario_id', createdUserId).neq('id', professorId).maybeSingle()
        if (otherLink) throw createError({ statusCode: 409, statusMessage: 'Este e-mail já está vinculado a outro professor.' })
      }
    }
    const { error: profileError } = await admin.from('usuarios').upsert({ id: createdUserId, nome, papel, ativo: true }, { onConflict: 'id' })
    if (profileError) throw profileError

    if (professorId) {
      const { data: linked, error: linkError } = await admin
        .from('professores')
        .update({ usuario_id: createdUserId })
        .eq('id', professorId)
        .is('usuario_id', null)
        .select('id')
        .maybeSingle()
      if (linkError || !linked) throw new Error('Não foi possível vincular a conta ao professor.')
    }

    const { error: auditError } = await admin.from('auditoria').insert({
      tabela: 'usuarios', registro_id: createdUserId, acao: 'acesso_criado', usuario_id: authUser.id,
      dados_depois: { papel, professor_id: professorId, senha_temporaria: !existingAccount }
    })
    if (auditError) throw new Error('Não foi possível registrar a auditoria do acesso.')

    return { success: true, activationLink, temporaryPassword: existingAccount ? null : temporaryPassword, existingAccount }
  } catch (error: any) {
    if (createdUserId && shouldDeleteCreatedUser) {
      try {
        const { admin } = await requireManagement(event)
        await admin.auth.admin.deleteUser(createdUserId)
      } catch { /* compensação best effort */ }
    }
    safeServerError('auth:invite', error)
    throw error
  }
})
