export function safeServerError(context: string, error?: unknown) {
  const statusCode = Number((error as any)?.statusCode || (error as any)?.status || 500)
  const code = String((error as any)?.code || 'UNEXPECTED').slice(0, 50)
  console.error(`[${context}]`, { statusCode, code })
}

export function safeServerWarning(context: string, error?: unknown) {
  const code = String((error as any)?.code || 'WARNING').slice(0, 50)
  console.warn(`[${context}]`, { code })
}
