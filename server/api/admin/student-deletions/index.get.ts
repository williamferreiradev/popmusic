import {requireManagement} from '../../../utils/requireManagement'
export default defineEventHandler(async event=>{
 const{admin}=await requireManagement(event)
 const{count,error}=await admin.from('exclusoes_aluno').select('id',{count:'exact',head:true}).eq('status','pendente')
 if(error)throw createError({statusCode:503,statusMessage:'Não foi possível verificar limpezas pendentes.'})
 return{pending:count||0}
})
