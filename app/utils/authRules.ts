export const isStrongPassword = (password: string): boolean => (
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password)
)

export const normalizeAuthEmail = (email: string): string => email.trim().toLowerCase()

export const isValidAuthEmail = (email: string): boolean => (
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeAuthEmail(email))
)
