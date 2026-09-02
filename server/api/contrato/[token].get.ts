import { serverSupabaseServiceRole } from '#supabase/server'
import { safeServerError } from '../../utils/safeLog'

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')

  if (!token) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Token do contrato não fornecido.'
    })
  }

  try {
    // Tenta usar o client do servidor (ou service role se disponível)
    const client: any = serverSupabaseServiceRole(event)

    const { data: contract, error } = await client
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

    if (error) {
      safeServerError('contrato:consulta', error)
      return { contract: null, error: error.message }
    }

    if (!contract) {
      return { contract: null, notFound: true }
    }

    if (contract.status === 'cancelado') {
      throw createError({ statusCode: 410, statusMessage: 'Este contrato foi cancelado.' })
    }
    if (!['aceito', 'renovado'].includes(contract.status) && new Date(contract.token_expira_em).getTime() < Date.now()) {
      throw createError({ statusCode: 410, statusMessage: 'O link de assinatura expirou.' })
    }

    const photoPath = contract.foto_assinatura_url || contract.alunos?.foto_url
    if (photoPath && !String(photoPath).startsWith('data:')) {
      const { data: signedPhoto } = await client.storage.from('fotos_alunos').createSignedUrl(photoPath, 300)
      if (signedPhoto?.signedUrl) {
        contract.foto_assinatura_url = signedPhoto.signedUrl
        if (contract.alunos) contract.alunos.foto_url = signedPhoto.signedUrl
      }
    }

    const { data: escolaRow } = await client.from('configuracoes').select('valor').eq('chave', 'escola').maybeSingle()
    return { contract: { ...contract, escola: escolaRow?.valor || {} }, success: true }
  } catch (err: any) {
    safeServerError('contrato:consulta', err)
    if (err?.statusCode) throw err
    throw createError({ statusCode: 500, statusMessage: 'Nao foi possivel carregar o contrato.' })
  }
})
