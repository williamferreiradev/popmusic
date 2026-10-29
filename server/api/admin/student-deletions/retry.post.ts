import {requireManagement} from '../../../utils/requireManagement'
import {processStudentDeletion} from '../../../utils/processStudentDeletion'
export default defineEventHandler(async event=>{
 const{admin,authUser}=await requireManagement(event)
 const{data,error}=await admin.from('exclusoes_aluno').select('aluno_id').eq('status','pendente').limit(20)
 if(error)throw createError({statusCode:503,statusMessage:'Não foi possível carregar a fila de limpeza.'})
 let completed=0,failed=0
 for(const job of data||[]){try{const r=await processStudentDeletion(admin,authUser.id,job.aluno_id);if(r.cleanupPending)failed++;else completed++}catch{failed++}}
 return{completed,failed}
})
