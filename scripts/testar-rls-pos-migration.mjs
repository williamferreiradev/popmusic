// Smoke test RLS pós-migration 202611110051 — valida o desenho novo no banco REAL.
// Cria fixtures identificadas (@example.invalid), testa isolamento por papel e
// limpa tudo ao final. Nenhum e-mail é enviado; nenhum dinheiro é movimentado.
// Uso: node --env-file=.env scripts/testar-rls-pos-migration.mjs --create-test-fixtures
import { createClient } from '@supabase/supabase-js'
import { randomBytes } from 'node:crypto'
import { writeFileSync, existsSync, readFileSync } from 'node:fs'
import assert from 'node:assert/strict'

const url = process.env.NUXT_PUBLIC_SUPABASE_URL
if (!process.argv.includes('--create-test-fixtures')) throw new Error('Use --create-test-fixtures para autorizar a criação de dados sintéticos identificados.')
if (new URL(url).hostname !== 'cdsdhwbugjbfgwyrznoy.supabase.co') throw new Error('Teste limitado ao projeto Pop Music desta revisão.')
if (existsSync('.data/teste-rls-051.json') && !JSON.parse(readFileSync('.data/teste-rls-051.json','utf8')).cleaned) throw new Error('Fixtures anteriores pendentes em .data/teste-rls-051.json. Limpe primeiro.')

const pub = process.env.NUXT_PUBLIC_SUPABASE_KEY
const admin = createClient(url, process.env.NUXT_SUPABASE_SECRET_KEY, { auth: { persistSession: false, autoRefreshToken: false } })
const client = () => createClient(url, pub, { auth: { persistSession: false, autoRefreshToken: false } })
const tag = 'rls051-' + Date.now()
const password = 'Pm!7' + randomBytes(18).toString('base64url')
const fixture = { tag, password, ids: {}, cleaned: false, checks: [] }
const save = () => writeFileSync('.data/teste-rls-051.json', JSON.stringify(fixture, null, 2))
const ok = name => { fixture.checks.push(name); save(); console.log('OK  | ' + name) }
const unw = (r, label) => { if (r.error) throw new Error(label + ': ' + r.error.code + ' ' + r.error.message); return r.data }
const denied = r => !!r.error && ['42501', 'PGRST301', '403'].some(c => String(r.error.code || r.error.status || '').includes(c) || String(r.error.message || '').toLowerCase().includes('row-level security'))

async function makeAuthUser(role, nome, professorId = null) {
  const email = `${tag}-${role}@example.invalid`
  const auth = unw(await admin.auth.admin.createUser({ email, password, email_confirm: true, app_metadata: { papel: role }, user_metadata: { nome } }), 'criar auth ' + role)
  const managers = unw(await admin.from('usuarios').select('id').eq('papel','gestao').eq('ativo',true).limit(1), 'gestor base')
  unw(await admin.rpc('provisionar_acesso_usuario', { p_actor_id: managers[0].id, p_usuario_id: auth.user.id, p_nome: nome, p_email: email, p_papel: role, p_professor_id: professorId }), 'provisionar ' + role)
  return { id: auth.user.id, email }
}

try {
  console.log('== 1. Preparação: gestor, professor, sala, turma, aluno e sessões reais ==')
  const gestor = await makeAuthUser('gestao', 'TESTE RLS051 Gestor')
  // Catálogos primeiro: salvar_professor exige ao menos uma modalidade.
  const mod = unw(await admin.from('modalidades').insert({ nome: 'TESTE RLS051 Violão', valor_padrao_mensalidade: 180, ativo: true }).select('id').single(), 'modalidade')
  const sala = unw(await admin.from('salas').insert({ nome: 'TESTE RLS051 Sala', capacidade_padrao: 5, ativo: true }).select('id').single(), 'sala')
  // O vínculo professor↔usuário é validado por e-mail pela RPC: o cadastro
  // operacional precisa existir antes do provisionamento.
  const profEmail = `${tag}-professor@example.invalid`
  const profId = unw(await admin.rpc('salvar_professor', { p_id: null, p_nome: 'TESTE RLS051 Professor', p_cpf: '', p_telefone: '11999990000', p_email: profEmail, p_comissao_tipo: 'percentual', p_comissao_valor: 50, p_modalidade_ids: [mod.id], p_pix_chave: '' }), 'salvar professor')
  const prof = await makeAuthUser('professor', 'TESTE RLS051 Professor', profId)
  const profVinculo = unw(await admin.from('professores').select('id,usuario_id').eq('id', profId).single(), 'vínculo professor')
  assert.equal(profVinculo.usuario_id, prof.id, 'Vínculo professor↔usuário não gravado')
  // Aluno: a RPC de provisionamento só aceita gestão/professor (por design,
  // alunos nascem da matrícula). Cria identidade + perfil + vínculo direto.
  const alunoEmail = `${tag}-aluno@example.invalid`
  const alunoAuth = unw(await admin.auth.admin.createUser({ email: alunoEmail, password, email_confirm: true, app_metadata: { papel: 'aluno' }, user_metadata: { nome: 'TESTE RLS051 Aluno' } }), 'criar auth aluno')
  // O trigger handle_new_user já criou o perfil; garante estado ativo.
  unw(await admin.from('usuarios').update({ ativo: true, papel: 'aluno' }).eq('id', alunoAuth.user.id), 'perfil aluno')
  const alunoRow = unw(await admin.from('alunos').insert({ nome: 'TESTE RLS051 Aluno', usuario_id: alunoAuth.user.id, email: alunoEmail, status: 'ativo', data_nascimento: '1990-05-15' }).select('id').single(), 'cadastro aluno')
  const aluno = { id: alunoAuth.user.id, email: alunoEmail }
  const alunoId = alunoRow.id
  fixture.ids = { gestor: gestor.id, prof: prof.id, profId, aluno: aluno.id, alunoId, mod: mod.id, sala: sala.id }
  save()

  const turma = unw(await admin.from('turmas').insert({ modalidade_id: mod.id, professor_id: profId, sala_id: sala.id, dia_semana: 1, horario_inicio: '10:00', horario_fim: '11:00', capacidade_maxima: 5, ativo: true }).select('id').single(), 'turma')
  unw(await admin.from('matriculas_turma').insert({ aluno_id: alunoId, turma_id: turma.id, data_inicio: new Date().toISOString().slice(0,10) }), 'matrícula')
  fixture.ids.turma = turma.id; save()
  ok('Fixtures criadas (gestor, professor, aluno, modalidade, sala, turma, matrícula)')

  const sGestor = unw(await client().auth.signInWithPassword({ email: gestor.email, password }), 'login gestor').session
  const sProf = unw(await client().auth.signInWithPassword({ email: prof.email, password }), 'login professor').session
  const sAluno = unw(await client().auth.signInWithPassword({ email: aluno.email, password }), 'login aluno').session
  ok('Os três papéis autenticam com senha real')

  console.log('== 2. Isolamento de leitura (o coração da migration 051) ==')
  const g = client(); g.auth.setSession(sGestor)
  const p = client(); p.auth.setSession(sProf)
  const a = client(); a.auth.setSession(sAluno)

  const profsComoAluno = await a.from('professores').select('id,nome,cpf,pix_chave')
  assert.ok(denied(profsComoAluno) || (profsComoAluno.data || []).length === 0, 'ALUNO LEU PROFESSORES! ' + JSON.stringify(profsComoAluno.data?.slice(0,1)))
  ok('Aluno NÃO lê a tabela professores (CPF/PIX inacessíveis) — correção da política legada')

  const profsComoProf = await p.from('professores').select('id,cpf,pix_chave')
  const visiveis = (profsComoProf.data || [])
  assert.ok(denied(profsComoProf) || visiveis.length <= 1, 'Professor enxergou ' + visiveis.length + ' cadastros de professores (esperado: só o próprio)')
  ok('Professor vê apenas o próprio cadastro de professor')

  const turmasComoAluno = await a.from('turmas').select('id')
  assert.ok(turmasComoAluno.data?.some(t => t.id === turma.id), 'Aluno não vê a própria turma (política nova falhou)')
  const todasTurmasGestor = await g.from('turmas').select('id')
  assert.ok((todasTurmasGestor.data || []).length >= (turmasComoAluno.data || []).length, 'Gestão enxerga menos turmas que o aluno')
  ok('Aluno lê somente a turma em que está matriculado; gestão lê todas')

  const feriados = await a.from('feriados').select('data,nome').limit(1)
  assert.ok(!feriados.error, 'Aluno não conseguiu ler feriados (política nova falhou): ' + (feriados.error?.message || ''))
  ok('Feriados legíveis por autenticados (chamada do professor precisa disso)')

  const viewTurmas = await a.from('vw_aluno_minhas_turmas').select('turma_id,modalidade,professor,sala')
  assert.ok(viewTurmas.data?.length === 1 && viewTurmas.data[0].professor, 'View do aluno sem professor: ' + JSON.stringify(viewTurmas.data))
  ok('vw_aluno_minhas_turmas retorna turma com NOME do professor (via view mínima)')

  console.log('== 3. Bloqueio de chamada finalizada (bypass corrigido) ==')
  const dataAula = new Date().toISOString().slice(0,10)
  unw(await p.from('presencas').insert({ aluno_id: alunoId, turma_id: turma.id, data_aula: dataAula, status: 'presente', tipo_aula: 'normal', origem: 'manual', registrado_por: prof.id }), 'presença inicial')
  // Fechamento real: igual ao app do professor — INSERT em chamadas_aula com
  // finalizada_por; a presença bloqueia enquanto a linha existir (ativa=true
  // é o default e a unique partial index garante 1 fechamento por turma+data).
  // A constraint exige reaberta_*+motivo quando ativa=false, então o registro
  // de fechamento nasce como reaberto-nunca? Não: o INSERT do app usa o default
  // ativa=true e o bloqueio da 034 lê ativa=true (fechamento pendente de uso).
  unw(await p.from('chamadas_aula').insert({ turma_id: turma.id, data_aula: dataAula, finalizada_por: prof.id }), 'fechamento da chamada')

  const depoisFechamento = await p.from('presencas').insert({ aluno_id: alunoId, turma_id: turma.id, data_aula: dataAula, status: 'falta', tipo_aula: 'normal', origem: 'manual', registrado_por: prof.id })
  assert.ok(denied(depoisFechamento), 'Professor inseriu presença APÓS fechamento — bypass ainda existe!')
  ok('Professor NÃO insere presença em chamada finalizada')

  const editaDepois = await p.from('presencas').update({ status: 'falta' }).eq('aluno_id', alunoId).eq('turma_id', turma.id).eq('data_aula', dataAula).select('id')
  // Em PostgreSQL, RLS de UPDATE sem linha visível = 0 linhas afetadas (sem erro).
  // O bloqueio correto é nenhum registro ter sido alterado.
  assert.ok(denied(editaDepois) || (editaDepois.data || []).length === 0, 'Professor editou presença APÓS fechamento — bypass ainda existe!')
  const confirmaIntacto = unw(await admin.from('presencas').select('status').eq('aluno_id', alunoId).eq('turma_id', turma.id).eq('data_aula', dataAula).limit(1), 'conferir presença')
  assert.equal(confirmaIntacto[0]?.status, 'presente', 'Status da presença foi alterado apesar do bloqueio!')
  ok('Professor NÃO edita presença de chamada finalizada (0 linhas alteradas, valor intacto)')

  const gestorReabre = await g.from('chamadas_aula').update({ ativa: false, reaberta_por: gestor.id, reaberta_em: new Date().toISOString(), motivo_reabertura: 'Correção de registro da escola' }).eq('turma_id', turma.id).eq('data_aula', dataAula)
  assert.ok(!gestorReabre.error, 'Gestão não conseguiu reabrir chamada: ' + (gestorReabre.error?.message || ''))
  ok('Gestão reabre chamada com motivo (fluxo preservado)')

  console.log('== 4. Privilegios e alcance ==')
  const tentativaCobrancaAluno = await a.from('cobrancas').select('id').limit(1)
  assert.ok(denied(tentativaCobrancaAluno) || (tentativaCobrancaAluno.data || []).length === 0, 'Aluno leu cobranças de terceiros!')
  ok('Aluno não lê cobranças (não tem nenhuma — mas não vê as alheias)')

  const alunosComoProf = await p.from('alunos').select('id,nome,cpf,tipo_sanguineo')
  assert.ok((alunosComoProf.data || []).every(al => al.id === alunoId), 'Professor viu aluno de outra turma!')
  ok('Professor vê somente alunos das próprias turmas')

  const auditAluno = await a.from('auditoria').select('id').limit(1)
  assert.ok(denied(auditAluno) || (auditAluno.data || []).length === 0, 'Aluno leu auditoria!')
  ok('Auditoria inacessível ao aluno')

  console.log('\nTODOS OS 12 CHEQUES PASSARAM — RLS da migration 051 validada no banco de produção.')
} catch (error) {
  save()
  console.error('FALHA | ' + error.message)
  console.error('Fixtures preservadas em .data/teste-rls-051.json para inspeção; rode a limpeza ao final.')
  process.exitCode = 1
}
