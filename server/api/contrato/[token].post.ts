import { serverSupabaseServiceRole } from '#supabase/server'
import { createHash } from 'node:crypto'
import { safeServerError, safeServerWarning } from '../../utils/safeLog'
import { validateEvidenceImage } from '../../utils/imageMetadata'

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')
  const contentLength = Number(getHeader(event, 'content-length') || 0)
  if (contentLength > 8_100_000) {
    throw createError({ statusCode: 413, statusMessage: 'A requisição ultrapassa o limite permitido.' })
  }
  const body = await readBody(event)
  const { photo, photoConsent } = body

  if (!token || !photo || photoConsent !== true) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Token, foto facial e consentimento explícito são obrigatórios para assinar.'
    })
  }

  try {
    const client: any = serverSupabaseServiceRole(event)
    const requestIp = getRequestIP(event, { xForwardedFor: true }) || 'indisponivel'
    const digest = (value: string) => createHash('sha256').update(value).digest('hex')
    const tokenHash = digest(token)
    const ipHash = digest(requestIp)
    const since = new Date(Date.now() - 15 * 60 * 1000).toISOString()
    const [tokenLimit, ipLimit] = await Promise.all([
      client.from('tentativas_assinatura').select('id', { count: 'exact', head: true }).eq('token_hash', tokenHash).gte('criada_em', since),
      client.from('tentativas_assinatura').select('id', { count: 'exact', head: true }).eq('ip_hash', ipHash).gte('criada_em', since)
    ])
    if (tokenLimit.error || ipLimit.error) {
      throw createError({ statusCode: 503, statusMessage: 'Controle de segurança temporariamente indisponível.' })
    }
    const tokenAttempts = tokenLimit.count || 0
    const ipAttempts = ipLimit.count || 0
    if (tokenAttempts >= 10 || ipAttempts >= 30) {
      throw createError({ statusCode: 429, statusMessage: 'Muitas tentativas. Aguarde 15 minutos e tente novamente.' })
    }
    const { data: attempt, error: attemptError } = await client.from('tentativas_assinatura')
      .insert({ token_hash: tokenHash, ip_hash: ipHash }).select('id').single()
    if (attemptError) throw createError({ statusCode: 503, statusMessage: 'Controle de segurança temporariamente indisponível.' })

    // 1. Buscar contrato
    const { data: contract, error: findError } = await client
      .from('contratos')
      .select(`
        *,
        alunos (
          *,
          matriculas_turma (
            *,
            turmas (
              *,
              modalidades (*)
            )
          )
        )
      `)
      .eq('token', token)
      .maybeSingle()

    if (findError || !contract) {
      return { success: false, message: 'Contrato não encontrado.' }
    }

    if (contract.status === 'aceito') {
      throw createError({ statusCode: 409, statusMessage: 'Este contrato já foi assinado.' })
    }
    if (contract.status === 'renovado') {
      throw createError({ statusCode: 409, statusMessage: 'Este contrato já foi substituído por uma renovação.' })
    }
    if (contract.status === 'cancelado') {
      throw createError({ statusCode: 410, statusMessage: 'Este contrato foi cancelado.' })
    }
    if (contract.status === 'expirado' || new Date(contract.token_expira_em).getTime() < Date.now()) {
      throw createError({ statusCode: 410, statusMessage: 'O link de assinatura expirou.' })
    }

    const alunoId = contract.aluno_id
    const aluno = contract.alunos || {}
    let finalPhotoUrl = ''

    // 2. Upload da foto para o bucket fotos_alunos se for base64
    try {
      if (photo.startsWith('data:image/jpeg;base64,') || photo.startsWith('data:image/png;base64,')) {
        if (photo.length > 8_000_000) throw createError({ statusCode: 413, statusMessage: 'A foto ultrapassa o limite permitido.' })
        const base64Data = photo.replace(/^data:image\/(?:jpeg|png);base64,/, '')
        if (!base64Data || base64Data.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(base64Data)) {
          throw createError({ statusCode: 400, statusMessage: 'Os dados da foto estão corrompidos.' })
        }
        const buffer = Buffer.from(base64Data, 'base64')
        if (buffer.length < 5_000 || buffer.length > 5_500_000) throw createError({ statusCode: 400, statusMessage: 'O tamanho da foto é inválido.' })
        const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[buffer.length - 2] === 0xff && buffer[buffer.length - 1] === 0xd9
        const isPng = buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
        if (!isJpeg && !isPng) throw createError({ statusCode: 400, statusMessage: 'O conteúdo enviado não é uma imagem JPEG ou PNG válida.' })
        const evidenceValidation = validateEvidenceImage(buffer)
        if (!evidenceValidation.valid) throw createError({ statusCode: 400, statusMessage: evidenceValidation.message })
        const extension = isPng ? 'png' : 'jpg'
        const contentType = isPng ? 'image/png' : 'image/jpeg'
        const fileName = `${alunoId}/contrato_${contract.id}_${Date.now()}.${extension}`

        const { data: uploadData, error: uploadErr } = await client.storage
          .from('fotos_alunos')
          .upload(fileName, buffer, { contentType, upsert: false })

        if (!uploadErr && uploadData) {
          finalPhotoUrl = uploadData.path
        }
        if (uploadErr) throw uploadErr
      } else {
        throw createError({ statusCode: 400, statusMessage: 'Formato da foto inválido.' })
      }
    } catch (storageErr) {
      throw storageErr
    }

    // Aceite e mensalidades são confirmados atomicamente no banco.
    const requestUserAgent = getHeader(event, 'user-agent') || null
    const { data: assinatura, error: assinaturaError } = await client.rpc('assinar_contrato_com_consentimento', {
      p_token: token, p_foto_path: finalPhotoUrl, p_ip: requestIp, p_user_agent: requestUserAgent
    })
    if (assinaturaError) {
      await client.storage.from('fotos_alunos').remove([finalPhotoUrl])
      throw assinaturaError
    }

    // A foto do perfil é uma referência secundária; a evidência principal fica no contrato.
    const { error: alunoUpdateError } = await client.from('alunos').update({
      foto_url: finalPhotoUrl,
      status: 'ativo'
    }).eq('id', alunoId)
    if (alunoUpdateError) safeServerWarning('assinatura:fotoperfil', alunoUpdateError)

    const diaVenc = contract.dia_vencimento || 10
    const valor = Number(contract.valor_mensalidade) || 180

    // 6. Inserir agendamento das aulas na agenda do professor
    try {
      if (aluno.matriculas_turma && Array.isArray(aluno.matriculas_turma)) {
        const presencasParaInserir: any[] = []
        for (const mat of aluno.matriculas_turma) {
          if (mat.data_fim) continue
          const turma = mat.turmas
          if (turma && turma.dia_semana !== undefined) {
            const targetDay = Number(turma.dia_semana)
            const d = new Date()
            for (let week = 0; week < 4; week++) {
              const aulaDate = new Date(d)
              const currentDay = aulaDate.getDay()
              let diff = (targetDay - currentDay + 7) % 7
              if (diff === 0 && week === 0) diff = 7
              aulaDate.setDate(aulaDate.getDate() + diff + (week * 7))
              
              presencasParaInserir.push({
                aluno_id: alunoId,
                turma_id: turma.id,
                data_aula: aulaDate.toISOString().split('T')[0],
                horario_previsto: turma.horario_inicio || '14:00',
                status: 'agendado',
                tipo_aula: 'regular',
                origem: 'presencial'
              })
            }
          }
        }
        if (presencasParaInserir.length > 0) {
          await client.from('presencas').insert(presencasParaInserir)
        }
      }
    } catch (agendaErr) {
      safeServerWarning('assinatura:agenda', agendaErr)
    }

    // 7. Enviar e-mail de confirmação
    if (aluno.email) {
      try {
        const host = getRequestHost(event)
        const protocol = host.includes('localhost') ? 'http' : 'https'
        const contractUrl = `${protocol}://${host}/assinar/${token}`
        const isMenor = !!(aluno.responsavel_nome || aluno.nome_responsavel)

        await $fetch('/api/send-signed-confirmation-email', {
          method: 'POST',
          headers: { 'x-internal-email-secret': process.env.INTERNAL_EMAIL_SECRET || '' },
          body: {
            contractId: contract.id,
            studentName: aluno.nome,
            studentEmail: aluno.email,
            guardianName: isMenor ? (aluno.responsavel_nome || aluno.nome_responsavel) : undefined,
            contractUrl,
            monthlyFee: valor,
            dueDate: diaVenc,
            pixKey: ''
          }
        })
      } catch (emailErr) {
        safeServerWarning('assinatura:email', emailErr)
      }
    }

    const { data: signedPhoto } = await client.storage.from('fotos_alunos').createSignedUrl(finalPhotoUrl, 300)
    await client.from('tentativas_assinatura').update({ sucesso: true }).eq('id', attempt.id)

    return { 
      success: true, 
      contract: {
        ...contract,
        status: 'aceito',
        foto_assinatura_url: signedPhoto?.signedUrl || null,
        aceite_hash: assinatura.aceite_hash,
        data_aceite: assinatura.data_aceite
      } 
    }
  } catch (err: any) {
    safeServerError('assinatura', err)
    if (err?.statusCode) throw err
    throw createError({ statusCode: 500, statusMessage: err?.message || 'Nao foi possivel assinar o contrato.' })
  }
})
