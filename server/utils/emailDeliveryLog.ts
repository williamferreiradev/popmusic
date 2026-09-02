import { createHash } from 'node:crypto'
import { safeServerWarning } from './safeLog'

const maskEmail = (email: string) => {
  const [local, domain] = email.toLowerCase().split('@')
  return local && domain ? `${local.slice(0, 1)}***@${domain}` : 'inválido'
}

export async function startEmailDelivery(admin: any, type: string, email: string, referenceId?: string | null) {
  try {
    const normalized = email.trim().toLowerCase()
    const { data, error } = await admin.from('comunicacoes').insert({
      canal: 'email', tipo: type, destinatario_mascarado: maskEmail(normalized),
      destinatario_hash: createHash('sha256').update(normalized).digest('hex'),
      provedor: 'resend', status: 'processando', referencia_id: referenceId || null
    }).select('id').single()
    if (error) throw error
    return data.id as string
  } catch (error) {
    safeServerWarning('email:log-inicio', error)
    return null
  }
}

export async function finishEmailDelivery(admin: any, id: string | null, status: 'enviado' | 'falhou', details?: { providerId?: string; errorCode?: string }) {
  if (!id) return
  try {
    const { error } = await admin.from('comunicacoes').update({
      status, provedor_mensagem_id: details?.providerId?.slice(0, 200) || null,
      erro_codigo: details?.errorCode?.slice(0, 100) || null, atualizado_em: new Date().toISOString()
    }).eq('id', id)
    if (error) throw error
  } catch (error) {
    safeServerWarning('email:log-fim', error)
  }
}
