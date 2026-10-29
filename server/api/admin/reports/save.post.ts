import { requireManagement } from '../../../utils/requireManagement'
import { validateReport } from '#shared/utils/reportRules'
export default defineEventHandler(async event=>{
  const {admin,authUser}=await requireManagement(event)
  const body=await readBody(event)
  const name=String(body?.name||'').trim()
  if(name.length<3||name.length>100)throw createError({statusCode:400,statusMessage:'Use um nome entre 3 e 100 caracteres.'})
  let report
  try {report=validateReport(body?.origin,body?.filters||{})} catch(error) {throw createError({statusCode:400,statusMessage:(error as Error).message})}
  const {data,error}=await admin.from('relatorios_salvos').insert({usuario_id:authUser.id,nome:name,origem_dados:report.origin,filtros:report.filters,visibilidade:'privado'}).select('id,nome,origem_dados,filtros').single()
  if(error)throw createError({statusCode:503,statusMessage:'Não foi possível salvar o relatório. Nenhum sucesso foi confirmado.'})
  return data
})
