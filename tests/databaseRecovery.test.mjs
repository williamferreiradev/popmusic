import assert from 'node:assert/strict'
import {before,after,describe,it} from 'node:test'
import {randomUUID} from 'node:crypto'
import {restoredDatabase} from './helpers/restoredDatabase.mjs'
let db
const actor=randomUUID(),teacherUser=randomUUID(),teacherId=randomUUID(),modality=randomUUID(),room=randomUUID(),classId=randomUUID()
const uuid=()=>randomUUID()
async function student({paid=false,signed=false,userId=null}={}){
 const id=uuid(),charge=uuid(),contract=uuid()
 await db.query("insert into public.alunos(id,nome,data_nascimento,status,usuario_id,data_matricula) values($1,'Aluno de teste','2000-01-01','ativo',$2,current_date)",[id,userId])
 await db.query('insert into public.matriculas_turma(aluno_id,turma_id,data_inicio) values($1,$2,current_date)',[id,classId])
 await db.query("insert into public.cobrancas(id,aluno_id,descricao,valor,vencimento,status,data_pagamento) values($1,$2,'Mensalidade',180,current_date,$3,case when $4 then current_date else null end)",[charge,id,paid?'paga':'pendente',paid])
 await db.query("insert into public.contratos(id,aluno_id,texto_gerado,status,token,token_expira_em,valor_mensalidade,dia_vencimento,data_aceite) values($1,$2,'Contrato teste',$3,$4,now()+interval '7 days',180,10,case when $5 then now() else null end)",[contract,id,signed?'aceito':'aguardando_assinatura',uuid(),signed])
 return{id,charge,contract}
}
async function report(origin,filters={},limit=50,offset=0,actorId=actor){return(await db.query('select public.gerar_relatorio_gestao($1,$2,$3,$4,$5) as result',[actorId,origin,JSON.stringify(filters),limit,offset])).rows[0].result}
async function remove(id){return(await db.query('select public.excluir_aluno_transacional($1,$2) as result',[actor,id])).rows[0].result}
before(async()=>{
 db=await restoredDatabase()
 await db.query("insert into auth.users(id,email,raw_app_meta_data,raw_user_meta_data) values($1,'gestor@example.invalid','{\"papel\":\"gestao\"}','{\"nome\":\"Gestor teste\"}'),($2,'professor@example.invalid','{\"papel\":\"professor\"}','{\"nome\":\"Professor teste\"}')",[actor,teacherUser])
 await db.query("update public.usuarios set ativo=true,onboarding_concluido=true where id=any($1::uuid[])",[[actor,teacherUser]])
 await db.query("insert into public.professores(id,usuario_id,nome,email,comissao_padrao_tipo,comissao_padrao_valor) values($1,$2,'Professor teste','professor@example.invalid','valor_fixo',50)",[teacherId,teacherUser])
 await db.query("insert into public.modalidades(id,nome,valor_padrao_mensalidade) values($1,'Teclado teste',180)",[modality])
 await db.query("insert into public.salas(id,nome,capacidade_padrao) values($1,'Sala teste',20)",[room])
 await db.query("insert into public.turmas(id,modalidade_id,professor_id,sala_id,dia_semana,horario_inicio,horario_fim,capacidade_maxima) values($1,$2,$3,$4,4,'14:00','15:00',20)",[classId,modality,teacherId,room])
})
after(async()=>{if(db)await db.close()})
describe('recuperação da estrutura em PostgreSQL descartável',()=>{
 it('recria as tabelas, views, funções, constraints e políticas partindo do zero',async()=>{
  assert.equal((await db.query("select count(*)::int as n from pg_tables where schemaname='public'")).rows[0].n,27)
  assert.equal((await db.query("select count(*)::int as n from pg_views where schemaname='public'")).rows[0].n,8)
  assert.equal((await db.query("select relrowsecurity from pg_class where oid='public.alunos'::regclass")).rows[0].relrowsecurity,true)
  assert.ok((await db.query("select count(*)::int as n from pg_policies where schemaname='public'")).rows[0].n>20)
  assert.equal((await db.query("select public.cpf_valido('98765432100') as valid")).rows[0].valid,true)
 })
 it('não incorpora dados da escola na baseline',async()=>{
  assert.equal((await db.query('select count(*)::int as n from public.cobrancas')).rows[0].n,0)
 })
})

describe('vínculo automático e troca de professor',()=>{
 it('cria o aluno na turma escolhida e transfere o acesso preservando o histórico',async()=>{
  await db.exec('begin')
  try {
   const otherUser=uuid(),otherTeacher=uuid(),otherClass=uuid()
   await db.query("insert into auth.users(id,email,raw_app_meta_data,raw_user_meta_data) values($1,'destino@example.invalid','{\"papel\":\"professor\"}','{\"nome\":\"Professor destino\"}')",[otherUser])
   await db.query("update public.usuarios set ativo=true where id=$1",[otherUser])
   await db.query("insert into public.professores(id,usuario_id,nome,email,comissao_padrao_tipo,comissao_padrao_valor) values($1,$2,'Professor destino','destino@example.invalid','valor_fixo',50)",[otherTeacher,otherUser])
   await db.query("insert into public.turmas(id,modalidade_id,professor_id,sala_id,dia_semana,horario_inicio,horario_fim,capacidade_maxima) values($1,$2,$3,$4,5,'15:00','16:00',20)",[otherClass,modality,otherTeacher,room])
   await db.query("select set_config('request.jwt.claim.sub',$1,true)",[actor])
   const created=(await db.query("select public.criar_matricula_com_contrato('Aluno vínculo teste','98765432100','2000-01-01','11999990000','vinculo@example.invalid',$1::uuid[],null,null,null,'Contrato original',10) as result",[[classId]])).rows[0].result
   const id=created.aluno_id
   assert.equal((await db.query('select status from public.alunos where id=$1',[id])).rows[0].status,'ativo')
   await db.query("insert into public.presencas(aluno_id,turma_id,data_aula,status,tipo_aula,origem) values($1,$2,current_date,'presente','normal','manual')",[id,classId])
   await db.query("update public.contratos set status='aceito',data_aceite=now() where id=$1",[created.contrato_id])
   const visible=async(userId)=>{
    await db.query("select set_config('request.jwt.claim.sub',$1,true)",[userId]);await db.exec('set local role authenticated')
    try{return(await db.query('select count(*)::int as n from public.alunos where id=$1',[id])).rows[0].n}finally{await db.exec('reset role')}
   }
   assert.equal(await visible(teacherUser),1)
   assert.equal(await visible(otherUser),0)
   await db.query("select set_config('request.jwt.claim.sub',$1,true)",[actor])
   await db.query("select public.salvar_aluno_com_turmas($1,'Aluno vínculo teste','98765432100','2000-01-01','11999990000','vinculo@example.invalid',$2::uuid[])",[id,[otherClass]])
   assert.equal(await visible(teacherUser),0)
   assert.equal(await visible(otherUser),1)
   assert.equal((await db.query('select count(*)::int as n from public.presencas where aluno_id=$1 and turma_id=$2',[id,classId])).rows[0].n,1)
   assert.equal((await db.query('select texto_gerado,status from public.contratos where id=$1',[created.contrato_id])).rows[0].status,'aceito')
   assert.equal((await db.query('select texto_gerado from public.contratos where id=$1',[created.contrato_id])).rows[0].texto_gerado,'Contrato original')
  } finally {await db.exec('rollback')}
 })
})
describe('exclusão transacional real',()=>{
 it('desfaz todas as remoções quando uma dependência não prevista falha no final',async()=>{
  const s=await student()
  await db.exec('create table public.qa_bloqueio(aluno_id uuid references public.alunos(id) on delete restrict)')
  await db.query('insert into public.qa_bloqueio values($1)',[s.id])
  await assert.rejects(remove(s.id),e=>['23503','23001'].includes(e.code) && e.message.includes('qa_bloqueio'))
  for(const [table,key,id] of [['alunos','id',s.id],['cobrancas','id',s.charge],['contratos','id',s.contract],['matriculas_turma','aluno_id',s.id]]){
   assert.equal((await db.query(`select count(*)::int as n from public.${table} where ${key}=$1`,[id])).rows[0].n,1)
  }
  assert.equal((await db.query('select count(*)::int as n from public.exclusoes_aluno where aluno_id=$1',[s.id])).rows[0].n,0)
  await db.exec('drop table public.qa_bloqueio')
  await remove(s.id)
 })
 it('bloqueia exclusão de aluno com mensalidade paga sem alterar os dados',async()=>{
  const s=await student({paid:true})
  await assert.rejects(remove(s.id),/ALUNO_COM_HISTORICO_FINANCEIRO/)
  assert.equal((await db.query('select status from public.cobrancas where id=$1',[s.charge])).rows[0].status,'paga')
 })
 it('preserva contratos assinados',async()=>{
  const s=await student({signed:true})
  await assert.rejects(remove(s.id),/ALUNO_COM_CONTRATO_ASSINADO/)
  assert.equal((await db.query('select count(*)::int as n from public.alunos where id=$1',[s.id])).rows[0].n,1)
 })
 it('remove somente o grafo permitido e devolve o mesmo trabalho em uma repetição',async()=>{
  const s=await student(),first=await remove(s.id),second=await remove(s.id)
  assert.equal(first.id,second.id)
  assert.equal((await db.query('select count(*)::int as n from public.alunos where id=$1',[s.id])).rows[0].n,0)
  assert.ok((await db.query("select count(*)::int as n from public.auditoria where registro_id=$1 and acao='exclusao_definitiva'",[s.id])).rows[0].n>=1)
 })
 it('nega gestor inativo, professor e chamada direta sem privilégio',async()=>{
  const s=await student()
  await assert.rejects(db.query('select public.excluir_aluno_transacional($1,$2)',[teacherUser,s.id]),/ATOR_GESTAO_INVALIDO/)
  await db.exec('set role authenticated')
  try{await assert.rejects(db.query('select public.excluir_aluno_transacional($1,$2)',[actor,s.id]),e=>e.code==='42501')}finally{await db.exec('reset role')}
  await remove(s.id)
 })
})
describe('relatórios gerados pelo PostgreSQL',()=>{
 it('filtra modalidade/professor e pagina sem inventar alunos',async()=>{
  const result=await report('alunos',{modality,teacher:teacherId},1)
  assert.ok(result.total>=2);assert.equal(result.rows.length,1)
  const page2=await report('alunos',{modality,teacher:teacherId},1,1)
  assert.notEqual(page2.rows[0].id,result.rows[0].id)
  assert.equal((await report('alunos',{teacher:uuid()})).total,0)
 })
 it('calcula frequência a partir das marcações reais, inclusive zero presenças',async()=>{
  const s=await student()
  await db.query("insert into public.presencas(aluno_id,turma_id,data_aula,status,tipo_aula,origem) values($1,$2,current_date,'falta','normal','manual')",[s.id,classId])
  const result=await report('frequencia',{class:classId,percentage:'<50'})
  assert.ok(result.rows.some(r=>r.id.startsWith(s.id)&&r.percentage===0&&r.absences===1))
  await remove(s.id)
 })
 it('reconhece pendente vencida como atrasada e aplica período',async()=>{
  const s=await student()
  await db.query("update public.cobrancas set vencimento=current_date-10 where id=$1",[s.charge])
  const result=await report('financeiro',{status:'atrasada'})
  assert.ok(result.rows.some(r=>r.id===s.charge))
  assert.equal((await report('financeiro',{startDate:'2100-01-01'})).total,0)
  await remove(s.id)
 })
 it('classifica token expirado e retorna apenas os contratos filtrados',async()=>{
  const s=await student()
  await db.query("update public.contratos set token_expira_em=now()-interval '1 day' where id=$1",[s.contract])
  const result=await report('contratos',{status:'expirado'})
  assert.ok(result.rows.some(r=>r.id===s.contract))
  await remove(s.id)
 })
 it('não concede relatório administrativo a professor e rejeita origem inválida',async()=>{
  await assert.rejects(report('alunos',{},50,0,teacherUser),/ATOR_GESTAO_INVALIDO/)
  await assert.rejects(report('alunos; drop table alunos'),/ORIGEM_INVALIDA/)
 })
 it('salva filtros privados e impede leitura por outro usuário autenticado',async()=>{
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[actor]);await db.exec('set role authenticated')
  let saved
  try{saved=(await db.query("insert into public.relatorios_salvos(usuario_id,nome,origem_dados,filtros) values($1,'Teste salvo','alunos','{\"status\":\"ativo\"}') returning id",[actor])).rows[0].id}finally{await db.exec('reset role')}
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[teacherUser]);await db.exec('set role authenticated')
  try{assert.equal((await db.query('select count(*)::int as n from public.relatorios_salvos where id=$1',[saved])).rows[0].n,0)}finally{await db.exec('reset role');await db.exec("select set_config('request.jwt.claim.sub','',false)")}
 })
})
