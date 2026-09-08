import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

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

  const { data: profile, error } = await admin
    .from('usuarios')
    .select('papel, ativo')
    .eq('id', authUserId)
    .maybeSingle()

  if (error) {
    throw createError({ statusCode: 503, statusMessage: 'O servidor não conseguiu validar a gestão no Supabase. Confira NUXT_SUPABASE_SECRET_KEY na Vercel e faça um novo deploy.' })
  }

  if (!profile?.ativo || profile.papel !== 'gestao') {
    throw createError({ statusCode: 403, statusMessage: 'Apenas a gestão pode executar esta operação.' })
  }

  return { admin, authUser: { ...authUser, id: authUserId } }
}
