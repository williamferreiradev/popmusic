import type { SupabaseClient } from '@supabase/supabase-js'
import { deleteStudent, type DeletionJob } from '../services/studentDeletion'

export async function processStudentDeletion(admin: SupabaseClient, actorId: string, alunoId: string) {
  return await deleteStudent({
      async deleteTransaction(actorId, studentId) {
        const { data, error } = await admin.rpc('excluir_aluno_transacional', { p_actor_id: actorId, p_aluno_id: studentId })
        if (error) {
          const messages: Record<string, string> = {
            ALUNO_COM_HISTORICO_FINANCEIRO: 'Este aluno tem histórico financeiro. Use o cancelamento para preservar pagamentos, recibos e repasses.',
            ALUNO_COM_CONTRATO_ASSINADO: 'Este aluno tem contrato assinado. Use o cancelamento para preservar o documento.',
            ACESSO_ALUNO_COMPARTILHADO: 'O acesso está vinculado a outro cadastro. Corrija o vínculo antes da exclusão.',
            ALUNO_NAO_ENCONTRADO: 'Aluno não encontrado.'
          }
          if (messages[error.message]) throw createError({ statusCode: error.message === 'ALUNO_NAO_ENCONTRADO' ? 404 : 409, statusMessage: messages[error.message] })
          if (['PGRST202', '42883'].includes(error.code)) throw createError({ statusCode: 503, statusMessage: 'A atualização de exclusão transacional ainda não foi aplicada ao banco.' })
          throw error
        }
        return data as DeletionJob
      },
      async disableAuth(userId) {
        const { error } = await admin.auth.admin.updateUserById(userId, { ban_duration: '876000h' })
        if (error && error.code !== 'user_not_found') throw error
      },
      async removePhotos(paths) {
        const localPaths = paths.filter(path => !/^https?:\/\//i.test(path) && !path.includes('..'))
        if (localPaths.length !== paths.length) throw new Error('UNSUPPORTED_STORAGE_PATH')
        const { error } = await admin.storage.from('fotos_alunos').remove(localPaths)
        if (error) throw error
      },
      async finishJob(id, errorCode) {
        const { error } = await admin.from('exclusoes_aluno').update({
          status: errorCode ? 'pendente' : 'concluida', ultimo_erro: errorCode,
          concluida_em: errorCode ? null : new Date().toISOString()
        }).eq('id', id)
        if (error) throw error
      }
    }, actorId, alunoId)
}
