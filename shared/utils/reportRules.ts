export const reportOrigins = ['alunos','frequencia','financeiro','contratos','repasses'] as const
export type ReportOrigin = typeof reportOrigins[number]
export type ReportFilters = Partial<Record<'status'|'modality'|'teacher'|'class'|'percentage'|'paymentMethod'|'startDate'|'endDate',string>>
const allowed: Record<ReportOrigin,string[]> = {
  alunos:['status','modality','teacher','startDate','endDate'], frequencia:['class','teacher','percentage','startDate','endDate'],
  financeiro:['status','paymentMethod','startDate','endDate'], contratos:['status','startDate','endDate'], repasses:['teacher','status','startDate','endDate']
}
const statuses: Partial<Record<ReportOrigin,string[]>> = {
  alunos:['ativo','pendente','trancado','cancelado'], financeiro:['paga','atrasada','pendente','cancelada'],
  contratos:['aguardando_assinatura','aceito','expirado','cancelado','renovado','vencendo','vencido'], repasses:['pago','pendente']
}
export function validateReport(origin: unknown, rawFilters: unknown): { origin: ReportOrigin; filters: ReportFilters } {
  if (!reportOrigins.includes(origin as ReportOrigin)) throw new Error('Origem de relatório inválida.')
  if (!rawFilters || typeof rawFilters!=='object' || Array.isArray(rawFilters)) throw new Error('Filtros inválidos.')
  const selected=origin as ReportOrigin
  const filters: ReportFilters={}
  for(const [key,value] of Object.entries(rawFilters)) {
    if (!allowed[selected].includes(key)) throw new Error('Filtro não permitido para esta origem.')
    if (value==='' || value===null || value===undefined) continue
    if (typeof value!=='string' || value.length>100) throw new Error('Valor de filtro inválido.')
    if (['teacher','modality','class'].includes(key) && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) throw new Error('Selecione um cadastro válido.')
    if (['startDate','endDate'].includes(key) && (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value)) || new Date(value).toISOString().slice(0,10)!==value)) throw new Error('Data inválida.')
    if (key==='status' && !statuses[selected]?.includes(value)) throw new Error('Status inválido.')
    if (key==='percentage' && !['<50','50-75','>75'].includes(value)) throw new Error('Faixa de presença inválida.')
    if (key==='paymentMethod' && !['pix','dinheiro','cartao','transferencia','boleto'].includes(value)) throw new Error('Forma de pagamento inválida.')
    filters[key as keyof ReportFilters]=value
  }
  if (filters.startDate && filters.endDate && filters.startDate>filters.endDate) throw new Error('A data inicial deve ser anterior à final.')
  return {origin:selected,filters}
}
export const reportColumns = {
  alunos:[{key:'name',label:'Nome'},{key:'status',label:'Status',type:'badge'},{key:'modality',label:'Modalidades'},{key:'date',label:'Matrícula'},{key:'age',label:'Idade'}],
  frequencia:[{key:'name',label:'Aluno'},{key:'class',label:'Turma'},{key:'teacher',label:'Professor'},{key:'percentage',label:'Presença (%)'},{key:'absences',label:'Faltas'},{key:'justified',label:'Justificadas'}],
  financeiro:[{key:'name',label:'Aluno'},{key:'description',label:'Descrição'},{key:'amount',label:'Valor (R$)'},{key:'dueDate',label:'Vencimento'},{key:'status',label:'Status',type:'badge'},{key:'method',label:'Pagamento'}],
  contratos:[{key:'name',label:'Aluno'},{key:'status',label:'Status',type:'badge'},{key:'sent',label:'Envio'},{key:'accepted',label:'Aceite'}],
  repasses:[{key:'teacher',label:'Professor'},{key:'name',label:'Aluno'},{key:'month',label:'Competência'},{key:'classes',label:'Aulas finalizadas'},{key:'amount',label:'Repasse (R$)'},{key:'status',label:'Status',type:'badge'}]
} as const
