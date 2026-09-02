import { serverSupabaseServiceRole } from '#supabase/server'
import { safeServerError } from '../utils/safeLog'
const escapeHtml = (value: unknown) => String(value ?? '').replace(/[&<>'"]/g, char => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[char]!))

export default defineEventHandler(async (event) => {
  try {
    const internalSecret = process.env.INTERNAL_EMAIL_SECRET
    if (!internalSecret || getHeader(event, 'x-internal-email-secret') !== internalSecret) throw createError({ statusCode: 401, statusMessage: 'Chamada não autorizada.' })
    const body = await readBody(event)
    const studentName=escapeHtml(body.studentName).slice(0,150), studentEmail=String(body.studentEmail||'').trim().toLowerCase()
    const courseName=escapeHtml(body.courseName).slice(0,300), guardianName=escapeHtml(body.guardianName).slice(0,150)
    const monthlyFee=Number(body.monthlyFee), dueDate=Number(body.dueDate)
    const parsedUrl=new URL(String(body.contractUrl||'')), appUrl=useRuntimeConfig(event).public?.appUrl||getRequestURL(event).origin
    if(parsedUrl.origin!==new URL(appUrl).origin||!parsedUrl.pathname.startsWith('/assinar/')) throw createError({statusCode:400,statusMessage:'Link de contrato inválido.'})
    const contractUrl=escapeHtml(parsedUrl.toString())
    const admin=serverSupabaseServiceRole(event) as any
    const {data:escolaRow}=await admin.from('configuracoes').select('valor').eq('chave','escola').maybeSingle()
    const escola:any=escolaRow?.valor||{}, pixKey=escapeHtml(escola.pix_chave), escolaNome=escapeHtml(escola.nome||'Pop Music')
    const escolaRodape=[escola.cnpj,escola.endereco,escola.telefone,escola.email].filter(Boolean).map(escapeHtml).join(' • ')
    if(!escola.email_remetente) throw createError({statusCode:503,statusMessage:'E-mail remetente não configurado.'})

    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(studentEmail)||!studentName) throw createError({statusCode:400,statusMessage:'Destinatário inválido.'})

    const greetingName = guardianName ? `${guardianName} (Responsável por ${studentName})` : studentName

    const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Matrícula Confirmada - Academia de Música Pop Music</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #0d0d0d; color: #f0f0f0; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background-color: #171717; border-radius: 12px; border: 1px solid #2a2a2a; overflow: hidden; }
    .header { background: linear-gradient(135deg, #0f2e21, #1e1e1e); padding: 30px 20px; text-align: center; border-bottom: 2px solid #00E096; }
    .badge { display: inline-block; background-color: rgba(0, 224, 150, 0.15); color: #00E096; border: 1px solid #00E096; font-size: 11px; font-weight: bold; padding: 4px 12px; border-radius: 20px; text-transform: uppercase; margin-bottom: 10px; }
    .logo-title { font-size: 22px; font-weight: bold; color: #ffffff; letter-spacing: 1px; margin: 0; }
    .content { padding: 30px 25px; line-height: 1.6; }
    .greeting { font-size: 18px; font-weight: bold; color: #ffffff; margin-bottom: 15px; }
    .card { background-color: #212121; border-radius: 8px; border: 1px solid #333333; padding: 18px 20px; margin: 20px 0; }
    .card-title { font-size: 15px; font-weight: bold; color: #00E096; margin-bottom: 12px; border-bottom: 1px solid #333333; padding-bottom: 6px; }
    .card-item { margin: 8px 0; font-size: 14px; color: #cccccc; }
    .card-item strong { color: #ffffff; }
    .pix-box { background-color: #13241b; border: 1px dashed #00E096; border-radius: 8px; padding: 15px; text-align: center; margin: 20px 0; }
    .pix-title { font-size: 13px; font-weight: bold; color: #00E096; margin-bottom: 6px; text-transform: uppercase; }
    .pix-key { font-size: 16px; font-weight: bold; color: #ffffff; background-color: #0b140f; padding: 8px 12px; border-radius: 6px; display: inline-block; font-family: monospace; }
    .button-container { text-align: center; margin: 25px 0; }
    .button { background-color: #00E096; color: #000000 !important; font-weight: bold; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 14px; display: inline-block; }
    .footer { background-color: #111111; padding: 20px; text-align: center; font-size: 11px; color: #666666; border-top: 1px solid #222222; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="badge">✓ Matrícula Confirmada & Contrato Assinado</div>
      <h1 class="logo-title">${escolaNome}</h1>
    </div>
    <div class="content">
      <div class="greeting">Parabéns, ${greetingName}! 🎉</div>
      <p>O seu contrato de prestação de serviços musicais foi <strong>assinado eletronicamente com comprovação facial</strong> com sucesso. O aluno já está incluído na turma e na agenda de aulas do professor!</p>
      
      <!-- Dados do Curso -->
      <div class="card">
        <div class="card-title">Resumo da Matrícula</div>
        <div class="card-item"><strong>Aluno:</strong> ${studentName}</div>
        ${courseName ? `<div class="card-item"><strong>Curso:</strong> ${courseName}</div>` : ''}
        ${monthlyFee ? `<div class="card-item"><strong>Valor da Mensalidade:</strong> R$ ${Number(monthlyFee).toFixed(2).replace('.', ',')}</div>` : ''}
        ${dueDate ? `<div class="card-item"><strong>Dia de Vencimento:</strong> Todo dia ${dueDate} de cada mês</div>` : ''}
        <div class="card-item"><strong>Status:</strong> Ativo na grade de aulas</div>
      </div>

      <!-- Informações de Pagamento via PIX -->
      ${pixKey ? `<div class="pix-box">
        <div class="pix-title">Chave PIX Oficial para Mensalidades:</div>
        <div class="pix-key">${pixKey}</div>
        <p style="font-size: 12px; color: #aaaaaa; margin-top: 8px; margin-bottom: 0;">
          Após realizar o pagamento, envie o comprovante para nosso contato oficial: <strong>${escapeHtml(escola.telefone)}</strong>.
        </p>
      </div>` : ''}

      <!-- Acesso ao Contrato Assinado -->
      <div class="button-container">
        <a href="${contractUrl}" class="button" target="_blank">
          Visualizar / Baixar Via em PDF do Contrato
        </a>
      </div>

      <p style="font-size: 12px; color: #888888; text-align: center;">
        Desejamos uma jornada musical incrível! Seja muito bem-vindo(a) à família Pop Music! 🎸🥁🎹🎤
      </p>
    </div>
    <div class="footer">
      <div>${escolaRodape}</div>
    </div>
  </div>
</body>
</html>
`

    // Enviar via Resend se houver API Key configurada
    const resendApiKey = process.env.RESEND_API_KEY
    if (!resendApiKey) throw createError({ statusCode: 503, statusMessage: 'Provedor de e-mail não configurado.' })
    {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: escola.email_remetente,
          to: [studentEmail],
          subject: `🎉 Matrícula Confirmada e Cópia do Contrato - Pop Music (${studentName})`,
          html: htmlContent
        })
      })

      const resData = await res.json().catch(() => ({}))
      if (!res.ok) throw createError({ statusCode: 502, statusMessage: `Falha no provedor de e-mail (${res.status}).` })
      return { success: true, provider: 'resend', data: resData }
    }
  } catch (error: any) {
    safeServerError('email:confirmacao', error)
    throw error
  }
})
