export const brazilianStates = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'] as const
export interface StudentAddress { logradouro: string; numero: string; complemento: string; bairro: string; cidade: string; uf: string; cep: string }
export const emptyStudentAddress = (): StudentAddress => ({ logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', uf: '', cep: '' })
export function normalizeStudentAddress(input: StudentAddress): StudentAddress {
  const result = Object.fromEntries(Object.entries(input).map(([key, value]) => [key, value.trim()])) as unknown as StudentAddress
  result.uf = result.uf.toUpperCase()
  result.cep = result.cep.replace(/[\s.-]/g, '')
  if (result.logradouro.length < 3 || result.logradouro.length > 160) throw new Error('Informe rua/quadra e logradouro com 3 a 160 caracteres.')
  if (!result.numero || result.numero.length > 20) throw new Error('Informe o número do endereço ou S/N.')
  if (result.complemento.length > 100) throw new Error('O complemento deve ter até 100 caracteres.')
  if (result.bairro.length < 2 || result.bairro.length > 100) throw new Error('Informe o bairro.')
  if (result.cidade.length < 2 || result.cidade.length > 100) throw new Error('Informe a cidade.')
  if (!(brazilianStates as readonly string[]).includes(result.uf)) throw new Error('Selecione uma UF válida.')
  if (!/^\d{8}$/.test(result.cep)) throw new Error('Informe um CEP com 8 dígitos.')
  return result
}
export const addressLine = (address: StudentAddress) => [address.logradouro, address.numero, address.complemento].filter(Boolean).join(', ')
