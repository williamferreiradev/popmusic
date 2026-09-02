import { requireManagement } from '../../utils/requireManagement'

export default defineEventHandler(async (event) => {
  const { admin } = await requireManagement(event)
  const { data: profiles, error } = await admin.from('usuarios').select('id,nome,papel,ativo').eq('papel', 'gestao').order('nome')
  if (error) throw createError({ statusCode: 500, statusMessage: 'Não foi possível carregar a equipe.' })

  const members = await Promise.all((profiles || []).map(async (profile: any) => {
    const { data } = await admin.auth.admin.getUserById(profile.id)
    return { id: profile.id, name: profile.nome, email: data?.user?.email || '', role: 'Gestão', status: profile.ativo ? 'Ativo' : 'Inativo' }
  }))
  return members
})
