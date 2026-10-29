type SignPhoto = (path: string) => Promise<{ data: { signedUrl: string } | null; error: unknown }>

export async function resolveContractPhoto(source: string, sign: SignPhoto): Promise<string> {
  if (/^data:image\/(jpeg|png);base64,/i.test(source)) return source
  if (/^https?:\/\//i.test(source)) return source
  if (!source || source.includes('..') || source.startsWith('/') || source.includes(':')) throw new Error('Referência da foto inválida.')
  const { data, error } = await sign(source)
  if (error || !data?.signedUrl) throw new Error('Não foi possível carregar a foto privada do contrato.')
  return data.signedUrl
}
