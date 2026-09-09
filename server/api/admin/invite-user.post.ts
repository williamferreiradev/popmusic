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
    let { data: invitation, error: inviteError } = await admin.auth.admin.generateLink({
      type: 'invite',
      email,
      options: { redirectTo: `${appUrl}/confirm?mode=invite`, data: { nome } }
    })
    let existingAccount = false
    if (inviteError || !invitation?.user) {
      const code = String(inviteError?.code || '')
      const message = String(inviteError?.message || '').toLowerCase()
      if (code === 'email_exists' || code === 'user_already_exists' || message.includes('already')) {
        const { data: recovery, error: recoveryError } = await admin.auth.admin.generateLink({
          type: 'recovery', email, options: { redirectTo: `${appUrl}/confirm?mode=recovery` }
        })
        if (recoveryError || !recovery?.user || !recovery.properties?.action_link) {
          throw createError({ statusCode: 409, statusMessage: 'Este e-mail já possui acesso, mas não foi possível gerar um novo link.' })
        }
        invitation = recovery
        inviteError = null
        existingAccount = true
      }
      if (Number(inviteError?.status) === 401 || Number(inviteError?.status) === 403) {
        throw createError({ statusCode: 503, statusMessage: 'O Supabase recusou a criação administrativa. Confira SUPABASE_SECRET_KEY na Vercel e faça um novo deploy.' })
      }
      throw createError({ statusCode: 502, statusMessage: 'O Supabase não conseguiu gerar o link de acesso.' })
    }
    createdUserId = invitation.user.id
    shouldDeleteCreatedUser = !existingAccount

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
      tabela: 'usuarios', registro_id: createdUserId, acao: 'link_acesso_gerado', usuario_id: authUser.id,
      dados_depois: { papel, professor_id: professorId }
    })
    if (auditError) throw new Error('Não foi possível registrar a auditoria do convite.')

    const activationLink = invitation.properties?.action_link
    if (!activationLink) throw new Error('Link de ativação não retornado pelo Supabase.')
    return { success: true, activationLink, existingAccount }
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
