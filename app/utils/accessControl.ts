export type UserRole = 'gestao' | 'professor' | 'aluno'

export const roleDestination: Record<UserRole, string> = {
  gestao: '/dashboard',
  professor: '/professor',
  aluno: '/aluno'
}

export const isUserRole = (role: unknown): role is UserRole => (
  typeof role === 'string' && Object.prototype.hasOwnProperty.call(roleDestination, role)
)

export const isPublicPath = (path: string): boolean => (
  path === '/login' || path === '/confirm' || path.startsWith('/assinar/')
)

export const canRoleAccessPath = (role: UserRole, path: string): boolean => {
  if (isPublicPath(path) || path === '/') return true
  if (path === '/dashboard' || path.startsWith('/dashboard/')) return role === 'gestao'
  if (path === '/professor' || path.startsWith('/professor/')) return role === 'professor'
  if (path === '/aluno' || path.startsWith('/aluno/')) return role === 'aluno'
  return false
}
