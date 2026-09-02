import { requireManagement } from '../../utils/requireManagement'
import { safeServerError } from '../../utils/safeLog'

type InviteBody = { nome?: unknown; email?: unknown; papel?: unknown; professorId?: unknown }

export default defineEventHandler(async (event) => {
  let createdUserId: string | null = null
  try {
    const { admin } = await requireManagement(event)
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
    const { data: invitation, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${appUrl}/confirm?mode=invite`,
      data: { nome }
    })
    if (inviteError || !invitation?.user) {
      throw createError({ statusCode: 409, statusMessage: 'Este e-mail já possui acesso. Use a opção de reenvio/recuperação.' })
    }
    createdUserId = invitation.user.id

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

    return { success: true }
  } catch (error: any) {
    if (createdUserId) {
      try {
        const { admin } = await requireManagement(event)
        await admin.auth.admin.deleteUser(createdUserId)
      } catch { /* compensação best effort */ }
    }
    safeServerError('auth:invite', error)
    throw error
  }
})
