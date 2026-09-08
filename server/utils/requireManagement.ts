import { serverSupabaseClient, serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

export async function requireManagement(event: any) {
  const admin = serverSupabaseServiceRole(event) as any
  const authorization = String(getHeader(event, 'authorization') || '')
  const accessToken = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : ''
  let authUser: any

  if (accessToken) {
    const { data, error } = await admin.auth.getUser(accessToken)
    if (error || !data.user) throw createError({ statusCode: 401, statusMessage: 'Sessão inválida ou expirada. Entre novamente.' })
    authUser = data.user
  } else {
    authUser = await serverSupabaseUser(event)
  }
  if (!authUser) throw createError({ statusCode: 401, statusMessage: 'Autenticação obrigatória.' })
  const authUserId = String(authUser.id || authUser.sub || '')
  if (!/^[0-9a-f-]{36}$/i.test(authUserId)) throw createError({ statusCode: 401, statusMessage: 'Identificador da sessão inválido. Entre novamente.' })

  // Verifica o papel no contexto da sessão, usando as mesmas políticas RLS
  // que já autorizam o usuário a acessar o dashboard.
  const sessionClient = await serverSupabaseClient(event) as any
  const { data: profile, error } = await sessionClient
    .from('usuarios')
    .select('papel, ativo')
    .eq('id', authUserId)
    .maybeSingle()

  if (error) {
    throw createError({ statusCode: 503, statusMessage: 'O servidor não conseguiu consultar seu perfil de gestão. Saia, entre novamente e tente outra vez.' })
  }

  if (!profile) throw createError({ statusCode: 403, statusMessage: 'A sessão atual não está vinculada a um perfil na tabela usuarios.' })
  if (!profile.ativo) throw createError({ statusCode: 403, statusMessage: 'O perfil da sessão atual está inativo.' })
  if (profile.papel !== 'gestao') throw createError({ statusCode: 403, statusMessage: `O papel identificado na sessão foi ${String(profile.papel)}, não gestao.` })

  return { admin, authUser: { ...authUser, id: authUserId } }
}
