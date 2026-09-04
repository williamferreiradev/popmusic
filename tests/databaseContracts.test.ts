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
    assert.ok(page.includes('watch: [debouncedsearch, statusfilter, classfilter, currentpage]'))
  })

  it('delega a mudança de página ao servidor sem recortar os dados localmente', () => {
    assert.ok(table.includes("emit('page-change'"))
    assert.doesNotMatch(table, /students\.slice\(/)
  })

  it('diferencia erro de lista vazia e corrige pagina fora do total', () => {
    assert.ok(page.includes('error: studentserror'))
    assert.ok(page.includes(':load-error="boolean(studentserror)"'))
    assert.ok(table.includes('v-else-if="!pending && loaderror"'))
    assert.ok(page.includes('if (currentpage.value > lastpage) currentpage.value = lastpage'))
  })

  it('reduz consultas durante a digitacao e identifica corretamente o filtro', () => {
    assert.ok(page.includes('settimeout(() => { debouncedsearch.value = value }, 350)'))
    assert.ok(page.includes('todas as modalidades'))
    assert.ok(page.includes('error: modalitieserror'))
  })

  it('atualiza a lista depois de trancar ou destrancar somente quando o banco aceita', () => {
    assert.match(table, /trancar_aluno[\s\S]+if\(error\) throw error[\s\S]+emit\('refresh'\)[\s\S]+catch/)
    assert.match(table, /destrancar_aluno[\s\S]+if\(error\) throw error[\s\S]+emit\('refresh'\)[\s\S]+catch/)
  })
})

describe('detalhes reais da agenda', () => {
  const agenda = normalize(read('app/pages/dashboard/agenda.vue'))
  const modal = normalize(read('app/components/modals/AgendaDetailModal.vue'))

  it('carrega foto contratual e situação financeira dos alunos matriculados', () => {
    assert.ok(agenda.includes('contratos (foto_assinatura_url, status, criado_em)'))
    assert.ok(agenda.includes('cobrancas (status, vencimento)'))
    assert.ok(agenda.includes("financialstatus: pendingpayments > 0 ? 'pendente' : 'em_dia'"))
  })

  it('exibe modalidade, professor, sala, quantidade, foto e situação no popup', () => {
    for (const value of ['modalidade', 'teachername', 'roomname', 'student.photo', 'em dia', 'com pendência']) {
      assert.ok(modal.includes(value), `Detalhe ausente no popup: ${value}`)
    }
  })

  it('oferece visualizações funcionais de dia, semana e mês', () => {
    assert.ok(agenda.includes("view === 'dia'"))
    assert.ok(agenda.includes("view === 'semana'"))
    assert.ok(agenda.includes('dayappointments'))
    assert.ok(agenda.includes('monthcells'))
    assert.doesNotMatch(agenda, /em desenvolvimento/)
  })

  it('mantem os identificadores necessarios ao editar uma turma', () => {
    const form = normalize(read('app/components/modals/ClassFormModal.vue'))
    for (const field of ['modalidade_id', 'professor_id', 'sala_id']) assert.ok(agenda.includes(field))
    assert.ok(form.includes('modalidadeid: source.modalidade_id'))
  })

  it('mostra falhas reais e nao transforma erro do banco em agenda vazia', () => {
    assert.ok(agenda.includes('error: catalogserror'))
    assert.ok(agenda.includes('error: turmaserror'))
    assert.ok(agenda.includes('if (error) throw error'))
    assert.doesNotMatch(agenda, /erro ao buscar turmas na agenda:[^}]+return \[\]/)
  })

  it('valida a capacidade selecionada contra a capacidade da sala', () => {
    const form = normalize(read('app/components/modals/ClassFormModal.vue'))
    assert.ok(agenda.includes('capacidade_padrao'))
    assert.ok(form.includes('capacitymessage'))
    assert.ok(form.includes('number.isinteger(number(form.capacidade))'))
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

describe('resumo escalável do fluxo de caixa', () => {
  const summary = normalize(read('supabase/migrations/202609030031_resumo_fluxo_caixa.sql'))

  it('considera saldo inicial, entradas e saídas e permite filtrar uma conta', () => {
    assert.ok(summary.includes('public.resumo_fluxo_caixa(p_conta_id uuid default null)'))
    assert.ok(summary.includes("public.meu_papel() <> 'gestao'"))
    assert.ok(summary.includes('i.valor + m.entradas - m.saidas'))
    assert.ok(summary.includes('p_conta_id is null or f.conta_id = p_conta_id'))
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

  it('envia o dia de vencimento escolhido para o contrato', () => {
    assert.match(form, /v-model="formData\.dueDay"/)
    assert.match(form, /p_dia_vencimento:\s*dueDay/)
    assert.match(form, /dia_vencimento:\s*dueDay/)
    assert.doesNotMatch(form, /p_dia_vencimento:\s*10/)
  })

  it('diferencia matrícula criada de e-mail efetivamente enviado', () => {
    assert.match(form, /let emailSent = false/)
    assert.match(form, /emailSent = true/)
    assert.match(form, /createdContractData\.emailSent/)
    assert.match(form, /contractId:\s*resultado\.contrato_id/)
    assert.match(form, /o e-mail não foi enviado/i)
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

describe('cancelamento sem fidelidade', () => {
  const cancellation = normalize(read('supabase/migrations/202609040033_cancelamento_sem_fidelidade.sql'))

  it('preserva pagamentos, vencidos e o mes em que o aluno compareceu', () => {
    assert.ok(cancellation.includes("status in ('pendente','atrasada')"))
    assert.ok(cancellation.includes('vencimento>current_date'))
    assert.ok(cancellation.includes("p.status='presente'"))
    assert.ok(cancellation.includes('not v_fez_aula_no_mes'))
    assert.doesNotMatch(cancellation, /status\s*=\s*'paga'/)
  })

  it('encerra matricula e contrato sem apagar o historico', () => {
    assert.ok(cancellation.includes("status='cancelado'"))
    assert.ok(cancellation.includes("motivo_fim='cancelamento: '"))
    assert.doesNotMatch(cancellation, /delete\s+from/)
  })
})

describe('pre-visualizacao do contrato do aluno', () => {
  const table = normalize(read('app/components/students/StudentsTable.vue'))
  const profile = normalize(read('app/components/modals/StudentProfileModal.vue'))

  it('usa valor e vencimento do contrato salvo em vez de valores fixos', () => {
    assert.ok(table.includes('selectedcontract.value = contract'))
    assert.ok(table.includes('buildpopmusiccontractdata(raw, selectedcontract.value || {}, turmaslist)'))
    assert.ok(profile.includes('studentcontract.value = contract'))
    assert.ok(profile.includes('buildpopmusiccontractdata(raw, studentcontract.value || {}, turmaslist)'))
    assert.doesNotMatch(table, /valor_mensalidade:\s*180/)
    assert.doesNotMatch(profile, /valor_mensalidade:\s*180/)
  })
})

describe('acoes de comunicacao dos relatorios', () => {
  const reports = normalize(read('app/components/relatorios/RelatoriosProntos.vue'))

  it('nao simula envio de WhatsApp ou reenvio de contrato', () => {
    assert.doesNotMatch(reports, /lembrete reenviado[^;]+sucesso via whatsapp/)
    assert.doesNotMatch(reports, /link do contrato reenviado para/)
    assert.ok(reports.includes('o envio automático por whatsapp ainda não está configurado'))
    assert.ok(reports.includes("navigateto('/dashboard/contratos')"))
  })
})

describe('erros nas operacoes financeiras manuais', () => {
  const finance = normalize(read('app/composables/useFinanceiro.ts'))
  const charges = normalize(read('app/components/financeiro/FinanceiroCharges.vue'))
  const cashflow = normalize(read('app/components/financeiro/FinanceiroCashflow.vue'))

  it('nao confirma cobranca ou caixa quando o Supabase recusa a gravacao', () => {
    assert.ok((finance.match(/if \(error\) throw error/g) || []).length >= 2)
    assert.ok(finance.includes('await promise.all([fetchcashflow(), fetchfinancialsummary()])'))
    assert.ok(finance.includes('fetchcharges(), fetchchargesummary(), fetchfinancialsummary()'))
    assert.ok(charges.includes('não foi possível criar a cobrança'))
    assert.ok(charges.includes('não foi possível cancelar a cobrança'))
    assert.ok(cashflow.includes('não foi possível adicionar o lançamento'))
  })

  it('nao simula lembrete automatico de WhatsApp', () => {
    assert.ok(charges.includes('whatsapp automático ainda não está configurado'))
    assert.doesNotMatch(charges, /lembrete reenviado[^;]+via whatsapp/)
  })
})

describe('estados reais do portal do aluno', () => {
  const pages = [
    read('app/pages/aluno/aulas.vue'),
    read('app/pages/aluno/financeiro.vue'),
    read('app/pages/aluno/frequencia.vue'),
    read('app/pages/aluno/contrato.vue')
  ].map(normalize)

  it('nao apresenta falha do Supabase como lista vazia', () => {
    for (const page of pages) {
      assert.ok(page.includes('error: loaderror'))
      assert.ok(page.includes('if (error) throw error'))
      assert.ok(page.includes('v-else-if="loaderror"'))
    }
  })

  it('mantem espacamento utilizavel no celular e rolagem nas tabelas', () => {
    for (const page of pages) assert.ok(page.includes('p-4 sm:p-8'))

    const finance = normalize(read('app/pages/aluno/financeiro.vue'))
    const attendance = normalize(read('app/pages/aluno/frequencia.vue'))
    assert.ok(finance.includes('overflow-x-auto'))
    assert.ok(attendance.includes('overflow-x-auto'))
  })
})

describe('crud seguro de modalidades e salas', () => {
  const modalities = normalize(read('app/components/configuracoes/ConfigModalidades.vue'))
  const rooms = normalize(read('app/components/configuracoes/ConfigSalas.vue'))
  const catalogMigration = normalize(read('supabase/migrations/202609020021_catalogos_seguros.sql'))

  it('diferencia falha de carregamento de catalogo vazio', () => {
    for (const component of [modalities, rooms]) {
      assert.ok(component.includes('error: loaderror'))
      assert.ok(component.includes('if (error) throw error'))
      assert.ok(component.includes('v-else-if="loaderror"'))
    }
    assert.ok(rooms.includes('error: modalitieserror'))
    assert.ok(rooms.includes('v-if="modalitieserror"'))
  })

  it('valida valores e evita operacoes de status repetidas', () => {
    assert.ok(modalities.includes('number.isfinite(price) && price >= 0'))
    assert.ok(rooms.includes('number.isinteger(capacity) && capacity > 0'))
    assert.ok(modalities.includes(':disabled="statusloadingid === mod.id"'))
    assert.ok(rooms.includes(':disabled="statusloadingid === room.id"'))
  })

  it('mantem criacao, edicao, inativacao e reativacao protegidas no banco', () => {
    for (const operation of ['salvar_modalidade', 'alterar_status_modalidade', 'salvar_sala', 'alterar_status_sala']) {
      assert.ok(catalogMigration.includes(`function public.${operation}`))
    }
    assert.ok(catalogMigration.includes('a modalidade possui turma ativa'))
    assert.ok(catalogMigration.includes('a sala possui turma ativa'))
  })
})
