import assert from 'node:assert/strict'
import{describe,it}from'node:test'
import{deleteStudent,type StudentDeletionDependencies}from'../server/services/studentDeletion.ts'
import{validateReport}from'../shared/utils/reportRules.ts'
import{escapeCsvCell}from'../app/utils/csv.ts'
const fixture=(overrides:Partial<StudentDeletionDependencies>={})=>{
 const events:string[]=[]
 const deps:StudentDeletionDependencies={
  async deleteTransaction(){events.push('transaction');return{id:'job',usuario_id:'user',fotos:['aluno/foto.jpg'],status:'pendente'}},
  async disableAuth(){events.push('auth')},async removePhotos(){events.push('photos')},async finishJob(_id,error){events.push(error?'pending':'done')},...overrides
 }
 return{deps,events}
}
describe('coordenação de exclusão e limpeza externa',()=>{
 it('não toca no Auth nem Storage quando a transação falha',async()=>{
  const f=fixture({async deleteTransaction(){throw new Error('rollback')}})
  await assert.rejects(deleteStudent(f.deps,'actor','student'),/rollback/);assert.deepEqual(f.events,[])
 })
 it('persiste a pendência quando o Auth falha após o commit',async()=>{
  const f=fixture({async disableAuth(){throw new Error('provider down')}})
  assert.deepEqual(await deleteStudent(f.deps,'actor','student'),{success:true,cleanupPending:true});assert.deepEqual(f.events,['transaction','pending'])
 })
 it('repete a limpeza sem refazer a exclusão já confirmada no banco',async()=>{
  let attempts=0
  const f=fixture({async removePhotos(){if(attempts++===0)throw new Error('storage down')}})
  assert.equal((await deleteStudent(f.deps,'actor','student')).cleanupPending,true)
  assert.equal((await deleteStudent(f.deps,'actor','student')).cleanupPending,false)
  assert.equal(attempts,2)
 })
 it('não repete ações externas de um trabalho concluído',async()=>{
  const f=fixture({async deleteTransaction(){return{id:'job',usuario_id:'user',fotos:[],status:'concluida'}}})
  assert.equal((await deleteStudent(f.deps,'actor','student')).cleanupPending,false);assert.deepEqual(f.events,[])
 })
 it('não confirma a conclusão se o registro do resultado falhar',async()=>{
  const f=fixture({async finishJob(){throw new Error('response lost')}})
  assert.equal((await deleteStudent(f.deps,'actor','student')).cleanupPending,true)
 })
})
describe('validação dos filtros do relatório',()=>{
 it('rejeita origem, status, coluna e identificador arbitrários',()=>{
  assert.throws(()=>validateReport('sql',{}));assert.throws(()=>validateReport('alunos',{status:'inadimplente'}))
  assert.throws(()=>validateReport('alunos',{table:'auth.users'}));assert.throws(()=>validateReport('alunos',{teacher:'1 or 1=1'}))
 })
 it('valida datas reais e ordem do período',()=>{
  assert.throws(()=>validateReport('financeiro',{startDate:'2026-02-30'}))
  assert.throws(()=>validateReport('financeiro',{startDate:'2026-10-29',endDate:'2026-10-01'}))
  assert.deepEqual(validateReport('financeiro',{startDate:'2026-10-01',status:'paga'}),{origin:'financeiro',filters:{startDate:'2026-10-01',status:'paga'}})
 })
 it('remove opções vazias sem transformar filtros em consultas de outra origem',()=>{
  assert.deepEqual(validateReport('alunos',{status:'',teacher:''}).filters,{})
  assert.throws(()=>validateReport('contratos',{paymentMethod:'pix'}))
 })
})
describe('CSV de relatório',()=>{
 it('preserva aspas e quebras de linha e neutraliza fórmulas em texto',()=>{
  assert.equal(escapeCsvCell('João; "teste"\nlinha'),'"João; ""teste""\nlinha"')
  assert.equal(escapeCsvCell('=HYPERLINK("https://x")'),'"\'=HYPERLINK(""https://x"")"')
  assert.equal(escapeCsvCell(-50),'"-50"')
 })
})
