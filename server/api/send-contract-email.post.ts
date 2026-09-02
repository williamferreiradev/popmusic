import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import { safeServerError } from '../utils/safeLog'

const escapeHtml = (value: unknown) => String(value ?? '').replace(/[&<>'"]/g, char => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[char]!))

export default defineEventHandler(async (event) => {
  try {
    const authUser = await serverSupabaseUser(event)
    if (!authUser) throw createError({ statusCode: 401, statusMessage: 'Autenticação obrigatória.' })
    const admin = serverSupabaseServiceRole(event) as any
    const { data: requester } = await admin.from('usuarios').select('papel,ativo').eq('id', authUser.id).maybeSingle()
    if (!requester?.ativo || requester.papel !== 'gestao') throw createError({ statusCode: 403, statusMessage: 'Apenas a gestão pode enviar contratos.' })
    const body = await readBody(event)
    const studentName = escapeHtml(body.studentName).slice(0,150)
    const studentEmail = String(body.studentEmail || '').trim().toLowerCase()
    const courseName = escapeHtml(body.courseName).slice(0,300)
    const guardianName = escapeHtml(body.guardianName).slice(0,150)
    const monthlyFee = Number(body.monthlyFee)
    const parsedUrl = new URL(String(body.signUrl || ''))
    const appUrl = useRuntimeConfig(event).public?.appUrl || getRequestURL(event).origin
    if (parsedUrl.origin !== new URL(appUrl).origin || !parsedUrl.pathname.startsWith('/assinar/')) throw createError({ statusCode: 400, statusMessage: 'Link de assinatura inválido.' })
    const signUrl = escapeHtml(parsedUrl.toString())

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(studentEmail) || !studentName) throw createError({ statusCode: 400, statusMessage: 'Dados do destinatário inválidos.' })
    const { data: escolaRow } = await admin.from('configuracoes').select('valor').eq('chave','escola').maybeSingle()
    const escola:any = escolaRow?.valor || {}
    const escolaNome = escapeHtml(escola.nome || 'Pop Music')
    const escolaRodape = [escola.cnpj, escola.endereco, escola.telefone, escola.email].filter(Boolean).map(escapeHtml).join(' • ')
    if (!escola.email_remetente) throw createError({ statusCode: 503, statusMessage: 'E-mail remetente não configurado.' })

    const greetingName = guardianName ? `${guardianName} (Responsável por ${studentName})` : studentName

    const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Contrato de Matrícula - Academia de Música Pop Music</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #0d0d0d; color: #f0f0f0; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background-color: #171717; border-radius: 12px; border: 1px solid #2a2a2a; overflow: hidden; }
    .header { background: linear-gradient(135deg, #111111, #1e1e1e); padding: 30px 20px; text-align: center; border-bottom: 2px solid #00E096; }
    .logo-title { font-size: 22px; font-weight: bold; color: #ffffff; letter-spacing: 1px; margin: 0; }
    .subtitle { color: #00E096; font-size: 13px; margin-top: 5px; text-transform: uppercase; letter-spacing: 2px; }
    .content { padding: 30px 25px; line-height: 1.6; }
    .greeting { font-size: 18px; font-weight: bold; color: #ffffff; margin-bottom: 15px; }
    .card { background-color: #212121; border-radius: 8px; border: 1px solid #333333; padding: 15px 20px; margin: 20px 0; }
    .card-item { margin: 8px 0; font-size: 14px; color: #cccccc; }
    .card-item strong { color: #ffffff; }
    .button-container { text-align: center; margin: 30px 0; }
    .button { background-color: #00E096; color: #000000 !important; font-weight: bold; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 15px; display: inline-block; box-shadow: 0 4px 15px rgba(0, 224, 150, 0.3); }
    .instruction { font-size: 13px; color: #999999; text-align: center; margin-top: 15px; }
    .footer { background-color: #111111; padding: 20px; text-align: center; font-size: 11px; color: #666666; border-top: 1px solid #222222; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="logo-title">${escolaNome}</h1>
      <div class="subtitle">Ensino & Formação Musical</div>
    </div>
    <div class="content">
      <div class="greeting">Olá, ${greetingName}! 🎶</div>
      <p>Sua matrícula na <strong>Academia de Música Pop Music</strong> foi gerada com sucesso! Para concluir o processo, é necessário assinar o contrato de prestação de serviços educacionais de forma online.</p>
      
      <div class="card">
        <div class="card-item"><strong>Aluno:</strong> ${studentName}</div>
        ${courseName ? `<div class="card-item"><strong>Curso / Modalidade:</strong> ${courseName}</div>` : ''}
        ${monthlyFee ? `<div class="card-item"><strong>Mensalidade:</strong> R$ ${Number(monthlyFee).toFixed(2).replace('.', ',')}</div>` : ''}
        <div class="card-item"><strong>Requisito:</strong> Aceite dos termos e foto facial de identificação</div>
      </div>

      <div class="button-container">
        <a href="${signUrl}" class="button" target="_blank">
          Assinar Contrato Online com Foto
        </a>
        <div class="instruction">
          Você só precisará do seu aparelho celular ou computador com câmera para tirar uma selfie rápida de identificação.
        </div>
      </div>

      <p style="font-size: 12px; color: #888888; word-break: break-all; margin-top: 25px;">
        Caso o botão não funcione, copie e cole o link abaixo em seu navegador:<br>
        <a href="${signUrl}" style="color: #00E096;">${signUrl}</a>
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
          subject: `🎶 Contrato de Matrícula - Academia de Música Pop Music (${studentName})`,
          html: htmlContent
        })
      })

      const resData = await res.json().catch(() => ({}))
      if (!res.ok) throw createError({ statusCode: 502, statusMessage: `Falha no provedor de e-mail (${res.status}).` })
      return { success: true, provider: 'resend', data: resData }
    }
  } catch (error: any) {
    safeServerError('email:contrato', error)
    throw error
  }
})
