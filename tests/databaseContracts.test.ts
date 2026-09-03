import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const normalize = (text: string) => text.replace(/\s+/g, ' ').toLowerCase()

describe('contrato de integração da matrícula', () => {
  const migration = normalize(read('supabase/migrations/202608310008_matricula_transacional.sql'))
  const form = read('app/components/modals/StudentCreateModal.vue')

  it('mantém o RPC usado pela tela e todos os seus parâmetros', () => {
    assert.match(form, /rpc\('criar_matricula_com_contrato'/)
    for (const parameter of [
      'p_nome', 'p_cpf', 'p_data_nascimento', 'p_telefone', 'p_email', 'p_turma_ids',
      'p_responsavel_nome', 'p_responsavel_cpf', 'p_responsavel_telefone',
      'p_texto_contrato', 'p_dia_vencimento'
    ]) {
      assert.match(form, new RegExp(`${parameter}:`))
      assert.ok(migration.includes(parameter), `Parâmetro ${parameter} ausente na função SQL`)
    }
  })

  it('cria aluno, vínculos e contrato dentro da mesma função SQL', () => {
    assert.ok(migration.includes('insert into public.alunos'))
    assert.ok(migration.includes('insert into public.matriculas_turma'))
    assert.ok(migration.includes('insert into public.contratos'))
    assert.ok(migration.includes("'aguardando_assinatura'"))
    assert.ok(migration.includes('for update'))
  })

  it('protege o cadastro contra turma repetida, lotada e CPF duplicado', () => {
    assert.ok(migration.includes("raise exception 'turma repetida'"))
    assert.ok(migration.includes("raise exception 'uma turma selecionada esta lotada'"))
    assert.ok(migration.includes("raise exception 'ja existe aluno com este cpf'"))
    assert.ok(migration.includes('pg_advisory_xact_lock'))
  })
})

describe('contrato de integração da assinatura e cobrança', () => {
  const signature = normalize(read('supabase/migrations/202608310009_assinatura_transacional.sql'))
  const immutableSnapshot = normalize(read('supabase/migrations/202609020017_contrato_imutavel.sql'))
  const endpoint = read('server/api/contrato/[token].post.ts')

  it('faz o endpoint chamar a função transacional com consentimento', () => {
    assert.match(endpoint, /rpc\('assinar_contrato_com_consentimento'/)
    for (const parameter of ['p_token', 'p_foto_path', 'p_ip', 'p_user_agent']) {
      assert.ok(immutableSnapshot.includes(parameter))
    }
  })

  it('aceita o contrato e cria exatamente doze mensalidades de forma idempotente', () => {
    assert.ok(signature.includes("status='aceito'"))
    assert.ok(signature.includes('insert into public.cobrancas'))
    assert.ok(signature.includes('from generate_series(1,12)'))
    assert.ok(signature.includes('on conflict (contrato_id,vencimento)'))
    assert.ok(signature.includes("<> 12 then raise exception"))
  })

  it('congela uma cópia verificável do documento assinado', () => {
    assert.ok(immutableSnapshot.includes('documento_assinado_snapshot'))
    assert.ok(immutableSnapshot.includes("digest(convert_to(v_snapshot::text, 'utf8'), 'sha256')"))
    assert.ok(immutableSnapshot.includes("raise exception 'a via assinada do contrato e imutavel'"))
  })
})

describe('contrato de integração da presença', () => {
  const attendance = normalize(read('supabase/migrations/202608310004_chamadas_aula.sql'))
  const professorPage = read('app/pages/professor/chamada.vue')

  it('impede finalizar duas chamadas para a mesma turma e data', () => {
    assert.ok(attendance.includes('unique (turma_id, data_aula)'))
    assert.match(professorPage, /from\('chamadas_aula'\)/)
  })

  it('restringe o professor às próprias turmas', () => {
    assert.ok(attendance.includes('public.turma_do_professor(turma_id)'))
    assert.ok(attendance.includes('finalizada_por = auth.uid()'))
    assert.match(professorPage, /from\('presencas'\)/)
  })
})
