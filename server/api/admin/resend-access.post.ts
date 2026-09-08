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
    const { data: generated, error } = await admin.auth.admin.generateLink({
      type: 'recovery', email, options: { redirectTo: `${appUrl}/confirm?mode=recovery` }
    })
    if (error || !generated.properties?.action_link) throw createError({ statusCode: 502, statusMessage: 'Não foi possível gerar um novo link de acesso.' })
    const { error: auditError } = await admin.from('auditoria').insert({
      tabela: 'usuarios', registro_id: userId, acao: 'link_acesso_regenerado', usuario_id: authUser.id,
      dados_depois: { papel: profile.papel, professor_id: professorId }
    })
    if (auditError) throw createError({ statusCode: 500, statusMessage: 'O link foi gerado, mas a auditoria falhou.' })
    return { success: true, activationLink: generated.properties.action_link }
  } catch (error: any) {
    safeServerError('auth:resend', error)
    throw error
  }
})
