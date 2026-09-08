import { requireManagement } from '../../utils/requireManagement'
import { safeServerError } from '../../utils/safeLog'

export default defineEventHandler(async (event) => {
  try {
    const { admin, authUser } = await requireManagement(event)
    const body = await readBody<{ userId?: unknown; professorId?: unknown }>(event)
    const userId = String(body?.userId || '')
    const professorId = body?.professorId ? String(body.professorId) : null
    if (!/^[0-9a-f-]{36}$/i.test(userId)) throw createError({ statusCode: 400, statusMessage: 'Usuário inválido.' })

    const { data: profile } = await admin.from('usuarios').select('papel,ativo').eq('id', userId).maybeSingle()
    if (!profile?.ativo || !['gestao', 'professor'].includes(profile.papel)) throw createError({ statusCode: 404, statusMessage: 'Acesso ativo não encontrado.' })
    if (profile.papel === 'professor') {
      const { data: professor } = await admin.from('professores').select('id').eq('id', professorId).eq('usuario_id', userId).eq('ativo', true).maybeSingle()
      if (!professor) throw createError({ statusCode: 403, statusMessage: 'Vínculo do professor inválido.' })
    }

    const { data, error: userError } = await admin.auth.admin.getUserById(userId)
    const email = data?.user?.email
    if (userError || !email) throw createError({ statusCode: 404, statusMessage: 'E-mail de acesso não encontrado.' })
    const appUrl = String(useRuntimeConfig(event).public.appUrl || getRequestURL(event).origin).replace(/\/$/, '')
    const { error } = await admin.auth.resetPasswordForEmail(email, { redirectTo: `${appUrl}/confirm?mode=recovery` })
    if (error) {
      const code = String(error.code || '')
      const message = String(error.message || '').toLowerCase()
      if (code === 'email_address_not_authorized' || message.includes('not authorized')) {
        throw createError({ statusCode: 503, statusMessage: 'O Supabase bloqueou o destinatário. Configure um SMTP próprio em Authentication > Emails > SMTP Settings.' })
      }
      if (code === 'over_email_send_rate_limit' || message.includes('rate limit')) {
        throw createError({ statusCode: 429, statusMessage: 'O limite de envio de e-mails foi atingido. Configure um SMTP próprio ou tente mais tarde.' })
      }
      throw createError({ statusCode: 502, statusMessage: 'Não foi possível enviar o e-mail. Consulte Authentication > Logs e verifique o SMTP.' })
    }
    const { error: auditError } = await admin.from('auditoria').insert({
      tabela: 'usuarios', registro_id: userId, acao: 'acesso_reenviado', usuario_id: authUser.id,
      dados_depois: { papel: profile.papel, professor_id: professorId }
    })
    if (auditError) throw createError({ statusCode: 500, statusMessage: 'O acesso foi enviado, mas a auditoria falhou.' })
    return { success: true }
  } catch (error: any) {
    safeServerError('auth:resend', error)
    throw error
  }
})
