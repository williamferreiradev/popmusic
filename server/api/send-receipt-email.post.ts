import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import { finishEmailDelivery, startEmailDelivery } from '../utils/emailDeliveryLog'
import { safeServerError } from '../utils/safeLog'

const escapeHtml = (value: unknown) => String(value ?? '').replace(/[&<>'"]/g, char => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[char]!))

export default defineEventHandler(async (event) => {
  let admin: any = null
  let deliveryId: string | null = null
  try {
    const authUser = await serverSupabaseUser(event)
    if (!authUser) throw createError({ statusCode: 401, statusMessage: 'Autenticação obrigatória.' })
    admin = serverSupabaseServiceRole(event) as any
    const { data: requester } = await admin.from('usuarios').select('papel,ativo').eq('id',authUser.id).maybeSingle()
    if (!requester?.ativo || requester.papel !== 'gestao') throw createError({ statusCode: 403, statusMessage: 'Apenas a gestão pode enviar recibos.' })

    const { chargeId } = await readBody<{ chargeId?: unknown }>(event)
    if (!/^[0-9a-f-]{36}$/i.test(String(chargeId || ''))) throw createError({ statusCode: 400, statusMessage: 'Cobrança inválida.' })
    const { data: receipt, error: receiptError } = await admin.from('recibos').select(`
      id,cobranca_id,cobrancas(id,valor,data_pagamento,forma_pagamento,descricao,status,
      alunos(nome,cpf,email,responsavel_email,responsavel_nome))
    `).eq('cobranca_id',chargeId).maybeSingle()
    const charge:any=receipt?.cobrancas, student:any=charge?.alunos
    if (receiptError || !receipt || !charge || !['paga','pago'].includes(charge.status)) throw createError({ statusCode:404,statusMessage:'Recibo pago não encontrado.' })
    const email=String(student?.responsavel_email||student?.email||'').trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw createError({ statusCode:422,statusMessage:'Aluno ou responsável sem e-mail válido.' })
    deliveryId=await startEmailDelivery(admin,'recibo',email,receipt.id)

    const {data:schoolRow}=await admin.from('configuracoes').select('valor').eq('chave','escola').maybeSingle()
    const school:any=schoolRow?.valor||{}
    if(!school.email_remetente) throw createError({statusCode:503,statusMessage:'E-mail remetente não configurado.'})
    const resendApiKey=process.env.RESEND_API_KEY
    if(!resendApiKey) throw createError({statusCode:503,statusMessage:'Provedor de e-mail não configurado.'})
    const amount=Number(charge.valor).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})
    const paidAt=new Date(`${charge.data_pagamento}T12:00:00`).toLocaleDateString('pt-BR')
    const number=`REC-${String(charge.id).slice(0,8).toUpperCase()}`
    const html=`<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#222">
      <h1 style="color:#7A1F1F">${escapeHtml(school.nome||'Pop Music')}</h1>
      <h2>Recibo de pagamento</h2><p>Olá, <strong>${escapeHtml(student.responsavel_nome||student.nome)}</strong>.</p>
      <p>Confirmamos o recebimento referente a <strong>${escapeHtml(charge.descricao||'Mensalidade')}</strong>.</p>
      <div style="border:1px solid #ddd;border-radius:8px;padding:16px">
        <p><strong>Recibo:</strong> ${number}</p><p><strong>Aluno:</strong> ${escapeHtml(student.nome)}</p>
        <p><strong>Valor:</strong> ${amount}</p><p><strong>Data:</strong> ${paidAt}</p>
        <p><strong>Forma:</strong> ${escapeHtml(String(charge.forma_pagamento||'Não informada').toUpperCase())}</p>
        <p style="color:#15803d"><strong>Status: PAGO</strong></p>
      </div><p style="font-size:12px;color:#666">${[school.cnpj,school.endereco,school.telefone].filter(Boolean).map(escapeHtml).join(' • ')}</p></div>`
    const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${resendApiKey}`,'Content-Type':'application/json'},body:JSON.stringify({from:school.email_remetente,to:[email],subject:`Recibo de pagamento ${number} - Pop Music`,html})})
    const result:any=await response.json().catch(()=>({}))
    if(!response.ok) throw createError({statusCode:502,statusMessage:`Falha no provedor de e-mail (${response.status}).`,data:{providerStatus:response.status}})
    await admin.from('recibos').update({enviado_em:new Date().toISOString()}).eq('id',receipt.id)
    await finishEmailDelivery(admin,deliveryId,'enviado',{providerId:String(result.id||'')})
    return {success:true}
  } catch(error:any) {
    await finishEmailDelivery(admin,deliveryId,'falhou',{errorCode:String(error?.data?.providerStatus||error?.statusCode||error?.code||'UNEXPECTED')})
    safeServerError('email:recibo',error)
    throw error
  }
})
