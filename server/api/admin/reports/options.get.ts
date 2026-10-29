import { requireManagement } from '../../../utils/requireManagement'
export default defineEventHandler(async event=>{
  const {admin,authUser}=await requireManagement(event)
  const [modalities,teachers,classes,saved]=await Promise.all([
    admin.from('modalidades').select('id,nome').order('nome'),admin.from('professores').select('id,nome').order('nome'),
    admin.from('turmas').select('id,dia_semana,horario_inicio,modalidades(nome),professores(nome)').order('dia_semana'),
    admin.from('relatorios_salvos').select('id,nome,origem_dados,filtros').eq('usuario_id',authUser.id).order('nome')
  ])
  if(modalities.error||teachers.error||classes.error||saved.error) throw createError({statusCode:503,statusMessage:'Não foi possível carregar os filtros e relatórios salvos.'})
  return {modalities:modalities.data,teachers:teachers.data,classes:classes.data,saved:saved.data}
})
