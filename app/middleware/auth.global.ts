type UserRole = 'gestao' | 'professor' | 'aluno'

const roleDestination: Record<UserRole, string> = {
  gestao: '/dashboard',
  professor: '/professor',
  aluno: '/aluno'
}

export default defineNuxtRouteMiddleware(async (to) => {
  const user = useSupabaseUser()
  const supabase = useSupabaseClient()
  const publicRoutes = ['/login', '/confirm']
  const isSigningRoute = to.path.startsWith('/assinar/')
  const isPublicRoute = publicRoutes.includes(to.path) || isSigningRoute
  const userId = user.value?.id || (user.value as any)?.sub

  if (!userId) {
    if (isPublicRoute) return
    return navigateTo('/login')
  }

  if (isSigningRoute) return
  // Convites e recuperação autenticam temporariamente antes da definição da senha.
  if (to.path === '/confirm') return

  const { data: profile, error } = await supabase
    .from('usuarios')
    .select('papel, ativo')
    .eq('id', userId)
    .maybeSingle()

  const role = profile?.papel as UserRole | undefined
  const hasValidRole = role && Object.prototype.hasOwnProperty.call(roleDestination, role)

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

  if (publicRoutes.includes(to.path) || to.path === '/') {
    return navigateTo(destination)
  }

  if (to.path.startsWith('/dashboard') && role !== 'gestao') {
    return navigateTo(destination)
  }

  if (to.path.startsWith('/professor') && role !== 'professor') {
    return navigateTo(destination)
  }

  if (to.path.startsWith('/aluno') && role !== 'aluno') {
    return navigateTo(destination)
  }
})
