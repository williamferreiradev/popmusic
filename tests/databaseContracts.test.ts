import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const normalize = (text: string) => text.replace(/\s+/g, ' ').toLowerCase()

const finalAudit = normalize(read('docs/sql/auditoria_final_supabase.sql'))

describe('auditoria final do Supabase', () => {
  it('é somente leitura e cobre integridade, RLS, anon, views, índices e storage', () => {
    assert.doesNotMatch(finalAudit, /\b(insert|update|delete|drop|alter|create|truncate)\b/)
    for (const check of [
      'matrículas ativas duplicadas', 'presenças duplicadas',
      'contratos aceitos sem data ou hash', 'tabelas sensíveis sem rls',
      'privilégios anon em tabelas sensíveis',
      'views de portal ausentes ou sem security_invoker',
      'índices obrigatórios ausentes', 'bucket fotos_alunos ausente ou público'
    ]) assert.ok(finalAudit.includes(check), `Verificação ausente: ${check}`)
  })
})

describe('paginação da lista de alunos', () => {
  const page = normalize(read('app/pages/dashboard/alunos.vue'))
  const table = normalize(read('app/components/students/StudentsTable.vue'))

  it('consulta somente a página atual e solicita a contagem total ao Supabase', () => {
    assert.ok(page.includes("{ count: 'exact' }"))
    assert.ok(page.includes('.range(from, from + itemsperpage - 1)'))
    assert.ok(page.includes('watch: [searchquery, statusfilter, classfilter, currentpage]'))
  })

  it('delega a mudança de página ao servidor sem recortar os dados localmente', () => {
    assert.ok(table.includes("emit('page-change'"))
    assert.doesNotMatch(table, /students\.slice\(/)
  })
})

describe('resumo escalável de contratos', () => {
  const summary = normalize(read('supabase/migrations/202609030029_resumo_contratos.sql'))
  const composable = normalize(read('app/composables/useContratos.ts'))
  const overview = normalize(read('app/components/contratos/ContratosOverview.vue'))

  it('calcula os indicadores no banco e restringe o acesso à gestão', () => {
    assert.ok(summary.includes('create or replace function public.resumo_contratos()'))
    assert.ok(summary.includes("public.meu_papel() <> 'gestao'"))
    assert.ok(summary.includes("count(*) filter"))
    assert.ok(summary.includes("date_trunc('month', current_date)"))
    assert.ok(summary.includes('grant execute on function public.resumo_contratos() to authenticated'))
  })

  it('alimenta os cards pelo RPC e mantém fallback durante a implantação', () => {
    assert.ok(composable.includes("supabase.rpc('resumo_contratos')"))
    assert.ok(composable.includes('servermetrics.value || localmetrics.value'))
    assert.ok(overview.includes('fetchcontractmetrics()'))
  })
})

describe('histórico paginado de contratos', () => {
  const composable = normalize(read('app/composables/useContratos.ts'))
  const history = normalize(read('app/components/contratos/ContratosHistory.vue'))

  it('aplica filtros, contagem e intervalo no Supabase', () => {
    assert.ok(composable.includes('fetchcontracthistory'))
    assert.ok(composable.includes("{ count: 'exact' }"))
    assert.ok(composable.includes('.range(from, from + pagesize - 1)'))
    assert.ok(composable.includes(".ilike('alunos.nome'"))
  })

  it('navega pelas páginas sem recortar a lista no navegador', () => {
    assert.ok(history.includes('contracthistorytotal'))
    assert.ok(history.includes('watch(currentpage'))
    assert.doesNotMatch(history, /contracthistory\.value\.slice\(/)
  })
})

describe('resumo escalável de cobranças', () => {
  const summary = normalize(read('supabase/migrations/202609030030_resumo_cobrancas.sql'))
  const composable = normalize(read('app/composables/useFinanceiro.ts'))
  const charges = normalize(read('app/components/financeiro/FinanceiroCharges.vue'))

  it('calcula recebíveis, recebimentos e atrasos no banco somente para gestão', () => {
    assert.ok(summary.includes('create or replace function public.resumo_cobrancas()'))
    assert.ok(summary.includes("public.meu_papel() <> 'gestao'"))
    assert.ok(summary.includes("c.vencimento < current_date"))
    assert.ok(summary.includes("date_trunc('month', current_date)"))
    assert.ok(summary.includes('grant execute on function public.resumo_cobrancas() to authenticated'))
  })

  it('alimenta e atualiza os cards pelo RPC após operações financeiras', () => {
    assert.ok(composable.includes("supabase.rpc('resumo_cobrancas')"))
    assert.ok(composable.includes('fetchchargesummary()'))
    assert.ok(charges.includes('chargesummary'))
    assert.ok(charges.includes('fetchchargesummary()'))
  })
})

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

describe('contrato de integração entre mensalidade e repasse', () => {
  const transfer = normalize(read('supabase/migrations/202609030028_repasse_por_mensalidade_paga.sql'))
  const financeComposable = normalize(read('app/composables/useFinanceiro.ts'))

  it('considera somente cobranças pagas na competência do recebimento', () => {
    assert.ok(transfer.includes("c.status = 'paga'::public.status_cobranca"))
    assert.ok(transfer.includes('c.data_pagamento >= pe.inicio'))
    assert.ok(transfer.includes('c.data_pagamento < pe.fim'))
  })

  it('vincula cada item de repasse à cobrança e à turma de origem', () => {
    assert.ok(transfer.includes('add column if not exists cobranca_id'))
    assert.ok(transfer.includes('on public.repasse_itens (cobranca_id, turma_id)'))
    assert.ok(transfer.includes('ri.cobranca_id = c.id and ri.turma_id = t.id'))
  })

  it('prioriza comissão específica do aluno e aceita a comissão padrão como fallback', () => {
    assert.ok(transfer.includes('coalesce(cpa.tipo, p.comissao_padrao_tipo)'))
    assert.ok(transfer.includes('coalesce(cpa.valor, p.comissao_padrao_valor)'))
  })

  it('permite repasse complementar sem pagar duas vezes o mesmo item', () => {
    assert.ok(transfer.includes('not exists ( select 1 from public.repasse_itens'))
    assert.doesNotMatch(transfer, /repasse deste professor já foi pago nesta competência/i)
  })

  it('atualiza cobrança, recibo, caixa, resumo e professor após a baixa', () => {
    assert.match(
      financeComposable,
      /fetchcharges\(\), fetchchargesummary\(\), fetchreceipts\(\), fetchcashflow\(\), fetchfinancialsummary\(\), fetchteachers\(\)/
    )
  })

  it('atualiza caixa e resumo financeiro depois de pagar o professor', () => {
    assert.match(financeComposable, /fetchteachers\(\), fetchcashflow\(\), fetchfinancialsummary\(\)/)
  })
})
