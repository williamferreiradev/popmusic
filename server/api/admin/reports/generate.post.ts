import { requireManagement } from '../../../utils/requireManagement'
import { validateReport } from '#shared/utils/reportRules'
export default defineEventHandler(async event=>{
  const {admin,authUser}=await requireManagement(event)
  const body=await readBody(event)
  let report
  try {report=validateReport(body?.origin,body?.filters || {})} catch(error) {throw createError({statusCode:400,statusMessage:(error as Error).message})}
  const page=Number(body?.page ?? 1)
  const pageSize=Number(body?.pageSize ?? 50)
  if(!Number.isInteger(page)||page<1||!Number.isInteger(pageSize)||pageSize<1||pageSize>200||page>100000) throw createError({statusCode:400,statusMessage:'Página inválida.'})
  const {data,error}=await admin.rpc('gerar_relatorio_gestao',{p_actor_id:authUser.id,p_origem:report.origin,p_filtros:report.filters,p_limite:pageSize,p_offset:(page-1)*pageSize})
  if(error) throw createError({statusCode:503,statusMessage:'Não foi possível gerar o relatório. Verifique a conexão e a atualização do banco.'})
  return {...data,page,pageSize}
})
