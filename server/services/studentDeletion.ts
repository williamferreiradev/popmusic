export interface DeletionJob {
  id: string
  usuario_id: string | null
  fotos: string[]
  status: 'pendente' | 'concluida'
}
export interface StudentDeletionDependencies {
  deleteTransaction(actorId: string, studentId: string): Promise<DeletionJob>
  disableAuth(userId: string): Promise<void>
  removePhotos(paths: string[]): Promise<void>
  finishJob(id: string, errorCode: string | null): Promise<void>
}
export async function deleteStudent(deps: StudentDeletionDependencies, actorId: string, studentId: string) {
  const job = await deps.deleteTransaction(actorId, studentId)
  if (job.status === 'concluida') return { success: true, cleanupPending: false }
  let errorCode: string | null = null
  try {
    if (job.usuario_id) await deps.disableAuth(job.usuario_id)
    if (job.fotos.length) await deps.removePhotos(job.fotos)
  } catch { errorCode = 'EXTERNAL_CLEANUP_FAILED' }
  try { await deps.finishJob(job.id, errorCode) } catch { errorCode = 'CLEANUP_STATUS_UNCONFIRMED' }
  return { success: true, cleanupPending: errorCode !== null }
}
