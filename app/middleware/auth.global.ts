import { canRoleAccessPath, isPublicPath, isUserRole, roleDestination } from '~/utils/accessControl'

export default defineNuxtRouteMiddleware(async (to) => {
  const user = useSupabaseUser()
  const supabase = useSupabaseClient()
  const isSigningRoute = to.path.startsWith('/assinar/')
  const isPublicRoute = isPublicPath(to.path)
  const userId = user.value?.id || (user.value as any)?.sub

  if (!userId) {
    if (isPublicRoute) return
    return navigateTo('/login')
  }

  if (isSigningRoute) return
  // Convites e recuperação autenticam temporariamente antes da definição da senha.
  if (to.path === '/confirm') return

  // O estado reativo pode manter temporariamente um usuário em cache. Confirme a
  // sessão com o servidor antes de consultar o perfil ou liberar uma rota interna.
  const { data: authenticated, error: authError } = await supabase.auth.getUser()
  const authenticatedUserId = authenticated.user?.id

  if (authError || !authenticatedUserId) {
    await supabase.auth.signOut()
    if (to.path !== '/login') return navigateTo('/login?erro=sessao-expirada')
    return
  }

  const { data: profile, error } = await supabase
    .from('usuarios')
    .select('papel, ativo')
    .eq('id', authenticatedUserId)
    .maybeSingle()

  const role = profile?.papel
  const hasValidRole = isUserRole(role)

  // Falha fechada: consulta com erro, perfil ausente/inativo ou papel desconhecido
  // nunca recebe acesso de gestão por padrão.
  if (error || !profile || !profile.ativo || !hasValidRole) {
    if (to.path !== '/login') {
      await supabase.auth.signOut()
      return navigateTo('/login?erro=acesso-invalido')
    }
    return
  }

  const destination = roleDestination[role]

  if (isPublicRoute || to.path === '/') {
    return navigateTo(destination)
  }

  if (!canRoleAccessPath(role, to.path)) {
    return navigateTo(destination)
  }
})
