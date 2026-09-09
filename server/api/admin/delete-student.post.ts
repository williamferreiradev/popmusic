import { requireManagement } from '../../utils/requireManagement'
import { safeServerError, safeServerWarning } from '../../utils/safeLog'

type DeleteStudentBody = { alunoId?: unknown }

export default defineEventHandler(async (event) => {
  try {
    const { admin, authUser } = await requireManagement(event)
    const body = await readBody<DeleteStudentBody>(event)
    const alunoId = String(body?.alunoId || '')
    if (!/^[0-9a-f-]{36}$/i.test(alunoId)) throw createError({ statusCode: 400, statusMessage: 'Aluno inválido.' })

    const { data: student, error: studentError } = await admin
      .from('alunos')
      .select('id,nome,usuario_id')
      .eq('id', alunoId)
      .maybeSingle()
    if (studentError) throw studentError
    if (!student) throw createError({ statusCode: 404, statusMessage: 'Aluno não encontrado.' })

    const { data: charges, error: chargesError } = await admin
      .from('cobrancas')
      .select('id')
      .eq('aluno_id', alunoId)
    if (chargesError) throw chargesError
    const chargeIds = (charges || []).map((charge: { id: string }) => charge.id)

    const remove = async (table: string, column = 'aluno_id', value = alunoId) => {
      const { error } = await admin.from(table).delete().eq(column, value)
      if (error) throw error
    }

    await remove('repasse_itens')
    await remove('comissoes_professor_aluno')
    await remove('presencas')
    if (chargeIds.length) {
      const { error: receiptsError } = await admin.from('recibos').delete().in('cobranca_id', chargeIds)
      if (receiptsError) throw receiptsError
      const { error: cashError } = await admin.from('fluxo_caixa').delete().in('origem_id', chargeIds)
      if (cashError) throw cashError
    }
    await remove('cobrancas')
    await remove('contratos')
    await remove('matriculas_turma')

    const { error: auditError } = await admin.from('auditoria').insert({
      tabela: 'alunos', registro_id: alunoId, acao: 'exclusao_definitiva', usuario_id: authUser.id,
      dados_antes: { nome: student.nome, usuario_id: student.usuario_id }
    })
    if (auditError) throw auditError

    const { error: deleteError } = await admin.from('alunos').delete().eq('id', alunoId)
    if (deleteError) throw deleteError

    let accessRemoved = true
    if (student.usuario_id) {
      const { error: profileError } = await admin.from('usuarios').delete().eq('id', student.usuario_id)
      if (profileError) safeServerWarning('student:delete-profile', profileError)
      const { error: authError } = await admin.auth.admin.deleteUser(student.usuario_id)
      if (authError) {
        accessRemoved = false
        safeServerWarning('student:delete-auth', authError)
      }
    }

    return { success: true, accessRemoved }
  } catch (error: unknown) {
    safeServerError('student:delete', error)
    throw error
  }
})
