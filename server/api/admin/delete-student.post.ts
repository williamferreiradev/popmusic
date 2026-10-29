import { requireManagement } from '../../utils/requireManagement'
import { safeServerError } from '../../utils/safeLog'
import { processStudentDeletion } from '../../utils/processStudentDeletion'

export default defineEventHandler(async (event) => {
  try {
    const { admin, authUser } = await requireManagement(event)
    const body = await readBody<{ alunoId?: unknown }>(event)
    const alunoId = String(body?.alunoId || '')
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(alunoId)) {
      throw createError({ statusCode: 400, statusMessage: 'Aluno inválido.' })
    }
    return await processStudentDeletion(admin, authUser.id, alunoId)
  } catch (error: unknown) {
    safeServerError('student:delete', error)
    throw error
  }
})
