import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

export async function requireManagement(event: any) {
  const authUser = await serverSupabaseUser(event)
  if (!authUser) throw createError({ statusCode: 401, statusMessage: 'Autenticação obrigatória.' })

  const admin = serverSupabaseServiceRole(event) as any
  const { data: profile, error } = await admin
    .from('usuarios')
    .select('papel, ativo')
    .eq('id', authUser.id)
    .maybeSingle()

  if (error || !profile?.ativo || profile.papel !== 'gestao') {
    throw createError({ statusCode: 403, statusMessage: 'Apenas a gestão pode executar esta operação.' })
  }

  return { admin, authUser }
}
