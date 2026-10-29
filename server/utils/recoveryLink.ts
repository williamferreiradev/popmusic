export function recoveryLink(redirectTo: string, tokenHash: string): string {
  const url = new URL(redirectTo)
  if (!['https:', 'http:'].includes(url.protocol) || !/^[a-zA-Z0-9_-]{32,256}$/.test(tokenHash)) throw new Error('Não foi possível gerar um link de recuperação válido.')
  url.search = '?mode=recovery'
  // O fragmento não é enviado ao servidor nem aparece nos logs HTTP.
  url.hash = new URLSearchParams({ token_hash: tokenHash, type: 'recovery' }).toString()
  return url.toString()
}
