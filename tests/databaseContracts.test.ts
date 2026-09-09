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
  const classes = normalize(read('app/components/configuracoes/ConfigTurmas.vue'))
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
    assert.ok(agenda.includes('error: turmaserror'))
    assert.ok(agenda.includes('if (error) throw error'))
    assert.doesNotMatch(agenda, /erro ao buscar turmas na agenda:[^}]+return \[\]/)
  })

  it('valida a capacidade selecionada contra a capacidade da sala', () => {
    const form = normalize(read('app/components/modals/ClassFormModal.vue'))
    assert.ok(classes.includes('capacidade_padrao'))
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

  it('distingue link indisponivel de falha temporaria ao carregar', () => {
    const endpoint = normalize(read('server/api/contrato/[token].get.ts'))
    const page = normalize(read('app/pages/assinar/[token].vue'))
    assert.ok(endpoint.includes("const signedstatuses = ['aceito', 'renovado', 'vencendo', 'vencido']"))
    assert.ok(endpoint.includes("statuscode: 503"))
    assert.ok(page.includes('error: loaderror'))
    assert.ok(page.includes('loaderror.statuscode === 410'))
  })

  it('impede nova assinatura em todos os estados ja assinados', () => {
    const endpoint = normalize(read('server/api/contrato/[token].post.ts'))
    assert.ok(endpoint.includes("['aceito', 'vencendo', 'vencido'].includes(contract.status)"))
    assert.ok(endpoint.includes('!number.isfinite(expiresat)'))
  })

  it('nao cria presenca futura artificial e informa o resultado real do email', () => {
    const endpoint = normalize(read('server/api/contrato/[token].post.ts'))
    const page = normalize(read('app/pages/assinar/[token].vue'))
    assert.doesNotMatch(endpoint, /from\('presencas'\)\.insert/)
    assert.ok(endpoint.includes('emailsent = emailresult?.success === true'))
    assert.ok(page.includes("emaildeliverystatus.value = res.emailsent === true ? 'sent' : 'failed'"))
    assert.ok(page.includes("emaildeliverystatus === 'failed'"))
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

describe('operacoes reais no financeiro dos professores', () => {
  const teachers = normalize(read('app/components/financeiro/FinanceiroTeachers.vue'))
  const statement = normalize(read('app/components/modals/TeacherStatementModal.vue'))
  const payment = normalize(read('app/components/modals/PayTeacherModal.vue'))

  it('nao confirma whatsapp ou ajuste de comissao somente no navegador', () => {
    assert.doesNotMatch(teachers, /demonstrativo enviado via whatsapp/)
    assert.doesNotMatch(teachers, /comiss[aã]o ajustada para este m[eê]s/)
    assert.doesNotMatch(teachers, /adjustcommissionmodal/)
    assert.doesNotMatch(statement, /enviar por whatsapp/)
  })

  it('bloqueia pagamento repetido e mostra falha sem fechar o fluxo', () => {
    assert.ok(teachers.includes('ispayingteacher.value = true'))
    assert.ok(teachers.includes('operationerror.value = `não foi possível pagar o repasse.'))
    assert.ok(payment.includes(':disabled="saving"'))
    assert.ok(payment.includes("saving ? 'registrando...'"))
  })

  it('usa a competencia atual no demonstrativo', () => {
    assert.ok(statement.includes("month: 'long', year: 'numeric'"))
    assert.doesNotMatch(statement, /julho 2026/)
  })
})

describe('relatorios sem operacoes simuladas', () => {
  const page = normalize(read('app/pages/dashboard/relatorios.vue'))
  const ready = normalize(read('app/components/relatorios/RelatoriosProntos.vue'))
  const result = normalize(read('app/components/relatorios/RelatoriosResultTable.vue'))

  it('nao publica o construtor que ainda utiliza dados de demonstracao', () => {
    assert.doesNotMatch(page, /relatoriosconstrutor/)
    assert.doesNotMatch(page, /construtor personalizado/)
  })

  it('nao mostra relatorios salvos ou sugestoes inventadas', () => {
    assert.doesNotMatch(ready, /sugest[aã]o de aluno fake/)
    assert.doesNotMatch(ready, /const savedreports/)
    assert.doesNotMatch(ready, /studentcount \* 4/)
  })

  it('mantem csv real e remove o pdf simulado', () => {
    assert.ok(result.includes('text/csv'))
    assert.doesNotMatch(result, /simula[cç][aã]o: gerando arquivo pdf/)
    assert.doesNotMatch(result, /@click="exportpdf"/)
  })
})

describe('modelo de contrato transacional', () => {
  const migration = normalize(read('supabase/migrations/202609060035_modelo_contrato_transacional.sql'))
  const contracts = normalize(read('app/composables/useContratos.ts'))
  const editor = normalize(read('app/components/contratos/ContratosModel.vue'))

  it('versiona e troca o modelo ativo dentro de uma unica funcao', () => {
    assert.ok(migration.includes('function public.salvar_modelo_contrato'))
    assert.ok(migration.includes('lock table public.modelos_contrato'))
    assert.ok(migration.includes('returning id into v_id'))
  })

  it('restringe a operacao a gestao e valida o conteudo', () => {
    assert.ok(migration.includes("public.meu_papel() <> 'gestao'"))
    assert.ok(migration.includes("length(trim(coalesce(p_texto, ''))) < 100"))
    assert.ok(migration.includes('revoke all on function public.salvar_modelo_contrato(text) from public, anon'))
  })

  it('aguarda o banco e nao mostra sucesso quando a gravacao falha', () => {
    assert.ok(contracts.includes("rpc('salvar_modelo_contrato'"))
    assert.ok(editor.includes('await savemodel(contractmodel.value)'))
    assert.ok(editor.includes("feedback.value = { type: 'error'"))
    assert.doesNotMatch(editor, /alert\("modelo salvo com sucesso!"\)/)
  })
})

describe('reenvio real de recibos', () => {
  const receipts = normalize(read('app/components/financeiro/FinanceiroReceipts.vue'))
  const modal = normalize(read('app/components/modals/ResendReceiptModal.vue'))

  it('oferece somente o canal de email realmente integrado', () => {
    assert.doesNotMatch(modal, /confirm\('whatsapp'\)/)
    assert.ok(modal.includes('reenviar por e-mail'))
  })

  it('mantem o modal durante o envio e fecha somente depois do sucesso', () => {
    const request = receipts.indexOf("$fetch('/api/send-receipt-email'")
    const close = receipts.indexOf('isresendmodalopen.value = false', request)
    assert.ok(request >= 0 && close > request)
    assert.ok(modal.includes("if (!props.sending) emit('close')"))
  })

  it('mostra a falha real sem alert nativo', () => {
    assert.ok(receipts.includes("senderror.value = `não foi possível enviar o recibo."))
    assert.doesNotMatch(receipts, /alert\(`não foi possível enviar o recibo/)
  })
})

describe('dados verdadeiros nos relatorios', () => {
  const reports = normalize(read('app/components/relatorios/RelatoriosProntos.vue'))

  it('nao inventa frequencia ou situacao financeira para alunos ativos', () => {
    assert.doesNotMatch(reports, /attendance: '100%'/)
    assert.doesNotMatch(reports, /financial: 'pago'/)
    assert.ok(reports.includes("phone: a.telefone || '-'"))
  })

  it('considera somente modalidades com vinculo atual', () => {
    assert.ok(reports.includes('.filter((m: any) => !m.data_fim)'))
    assert.ok(reports.includes('matriculas_turma (data_fim,'))
  })

  it('verifica erros do supabase e informa a falha na tela', () => {
    assert.ok((reports.match(/if \(error\) throw error/g) || []).length >= 5)
    assert.ok(reports.includes("reporterror.value = 'não foi possível gerar o relatório."))
    assert.ok(reports.includes('role="alert"'))
  })

  it('lista contratos cancelados usando dados reais', () => {
    assert.ok(reports.includes("id: 'contratos_cancelados'"))
    assert.ok(reports.includes(".eq('status', 'cancelado')"))
    assert.ok(reports.includes("status: 'cancelado'"))
  })
})

describe('edicao transacional do aluno', () => {
  const migration = normalize(read('supabase/migrations/202609060036_aluno_turmas_transacional.sql'))
  const edit = normalize(read('app/components/modals/StudentEditModal.vue'))
  const create = normalize(read('app/components/modals/StudentCreateModal.vue'))

  it('atualiza cadastro e turmas na mesma funcao protegida', () => {
    assert.ok(migration.includes('function public.salvar_aluno_com_turmas'))
    assert.ok(migration.includes('perform public.atualizar_turmas_aluno'))
    assert.ok(migration.includes("public.meu_papel() <> 'gestao'"))
  })

  it('a tela usa somente a operacao transacional', () => {
    assert.ok(edit.includes("rpc('salvar_aluno_com_turmas'"))
    assert.doesNotMatch(edit, /from\('alunos'\)\.update/)
    assert.doesNotMatch(edit, /rpc\('atualizar_turmas_aluno'/)
  })

  it('mostra erros nos formularios sem perder o contexto', () => {
    assert.ok(edit.includes('v-if="formerror"'))
    assert.ok(create.includes('v-if="formerror"'))
    assert.doesNotMatch(edit, /alert\(`/)
    assert.doesNotMatch(create, /alert\(/)
  })
})

describe('proximas turmas reais do dashboard', () => {
  const upcoming = normalize(read('app/components/dashboard/UpcomingClassesTable.vue'))

  it('remove turmas sem alunos ativos', () => {
    assert.ok(upcoming.includes('turma.students > 0'))
    assert.ok(upcoming.includes('m.data_fim === null'))
  })

  it('remove aulas que ja terminaram no dia', () => {
    assert.ok(upcoming.includes('turma.endtime >= currenttime'))
    assert.ok(upcoming.includes("t.horario_fim.substring(0, 5)"))
  })

  it('diferencia erro de agenda vazia', () => {
    assert.ok(upcoming.includes('error: loaderror'))
    assert.ok(upcoming.includes('v-else-if="!pending && loaderror"'))
    assert.ok(upcoming.includes('if (error) throw error'))
  })
})

describe('turmas atualizadas e contraste na matricula', () => {
  const create = normalize(read('app/components/modals/StudentCreateModal.vue'))
  const input = normalize(read('app/components/BaseInput.vue'))
  const select = normalize(read('app/components/BaseSelect.vue'))

  it('recarrega modalidades e turmas sempre que o modal abre', () => {
    assert.ok(create.includes('refresh: refreshmodalidades'))
    assert.ok(create.includes('refresh: refreshturmas'))
    assert.ok(create.includes('promise.all([refreshmodalidades(), refreshturmas()])'))
  })

  it('normaliza os identificadores usados pelo filtro', () => {
    assert.ok(create.includes("modalidadeid: string(t.modalidade_id || t.modalidades?.id || '')"))
    assert.ok(create.includes('option.modalidadeid === id'))
    assert.ok(create.includes('selectedmodalityids.value.includes(string(modality.value))'))
  })

  it('aplica esquema de cor correto aos controles nativos', () => {
    assert.ok(input.includes('[color-scheme:light] dark:[color-scheme:dark]'))
    assert.ok(select.includes('[color-scheme:light] dark:[color-scheme:dark]'))
  })
})

describe('exclusao definitiva do aluno', () => {
  const migration = normalize(read('supabase/migrations/202609070037_exclusao_definitiva_aluno.sql'))
  const students = normalize(read('app/components/students/StudentsTable.vue'))

  it('apaga somente o grafo do aluno em uma funcao restrita', () => {
    assert.ok(migration.includes('function public.excluir_aluno_definitivamente'))
    assert.ok(migration.includes("public.meu_papel() <> 'gestao'"))
    assert.ok(migration.includes('where aluno_id=p_aluno_id'))
  })

  it('remove dependencias antes do aluno e seu acesso', () => {
    for (const table of ['repasse_itens', 'presencas', 'recibos', 'cobrancas', 'contratos', 'matriculas_turma']) {
      assert.ok(migration.includes(`delete from public.${table}`))
    }
    assert.ok(migration.indexOf('delete from public.alunos') > migration.indexOf('delete from public.contratos'))
    assert.ok(migration.includes('delete from auth.users'))
  })

  it('separa cancelamento de exclusao irreversivel na interface', () => {
    assert.ok(students.includes('cancelar matrícula'))
    assert.ok(students.includes('excluir definitivamente'))
    assert.ok(students.includes("$fetch('/api/admin/delete-student'"))
    assert.ok(students.includes('esta ação não pode ser desfeita'))
  })
})

describe('menu flutuante de acoes do aluno', () => {
  const table = normalize(read('app/components/students/StudentsTable.vue'))

  it('renderiza fora da tabela sem criar rolagem e reposiciona dentro da tela', () => {
    assert.ok(table.includes('<teleport to="body">'))
    assert.ok(table.includes('class="fixed w-52'))
    assert.ok(table.includes('getboundingclientrect()'))
    assert.ok(table.includes('window.innerheight'))
    assert.doesNotMatch(table, /overflow-x-auto min-h-\[300px\] pb-16/)
  })

  it('fecha ao rolar ou redimensionar a pagina', () => {
    assert.ok(table.includes("window.addeventlistener('resize', closemenu)"))
    assert.ok(table.includes("window.addeventlistener('scroll', closemenu, true)"))
  })
})

describe('gestao separada de turmas e agenda', () => {
  const sidebar = normalize(read('app/components/layout/LayoutDashboardSidebar.vue'))
  const classes = normalize(read('app/components/configuracoes/ConfigTurmas.vue'))
  const calendar = normalize(read('app/pages/dashboard/agenda.vue'))
  const migration = normalize(read('supabase/migrations/202609070040_exclusao_turma.sql'))

  it('separa salas, turmas e agenda no menu da gestao', () => {
    assert.ok(sidebar.includes("label: 'salas', path: '/dashboard/salas'"))
    assert.ok(sidebar.includes("label: 'turmas', path: '/dashboard/turmas'"))
    assert.ok(sidebar.includes("label: 'agenda', path: '/dashboard/agenda'"))
  })

  it('centraliza cadastro edicao e exclusao na listagem de turmas', () => {
    assert.ok(classes.includes("rpc('salvar_turma'"))
    assert.ok(classes.includes("rpc('excluir_turma_definitivamente'"))
    assert.ok(classes.includes('editar turma'))
    assert.doesNotMatch(calendar, /<classformmodal/)
  })

  it('impede apagar turma com qualquer historico operacional', () => {
    assert.ok(migration.includes('function public.excluir_turma_definitivamente'))
    assert.ok(migration.includes('public.matriculas_turma'))
    assert.ok(migration.includes('public.presencas'))
    assert.ok(migration.includes('public.chamadas_aula'))
    assert.ok(migration.includes('public.repasse_itens'))
  })
})

describe('onboarding inicial da gestao', () => {
  const onboarding = normalize(read('app/pages/onboarding.vue'))
  const middleware = normalize(read('app/middleware/auth.global.ts'))
  const migration = normalize(read('supabase/migrations/202609070041_onboarding_gestao.sql'))

  it('guia a configuracao na ordem operacional correta', () => {
    for (const component of ['configcobrancacontrato', 'configmodalidades', 'configsalas', 'configprofessores', 'configturmas']) assert.ok(onboarding.includes(component))
    assert.ok(onboarding.includes("title: 'escola'"))
    assert.ok(onboarding.indexOf("title: 'modalidades'") < onboarding.indexOf("title: 'turmas'"))
  })

  it('exige dados reais no banco antes de avancar', () => {
    assert.ok(onboarding.includes("{ count: 'exact', head: true }"))
    assert.ok(onboarding.includes('cadastre pelo menos um item'))
    assert.ok(onboarding.includes("rpc('concluir_onboarding'"))
  })

  it('redireciona apenas novas contas de gestao para o onboarding', () => {
    assert.ok(migration.includes('set default false'))
    assert.ok(migration.includes('set onboarding_concluido=true where onboarding_concluido is null'))
    assert.ok(middleware.includes("to.path !== '/onboarding'"))
    assert.ok(onboarding.includes("if (profile?.onboarding_concluido) await navigateto('/dashboard')"))
  })

  it('nao publica o onboarding no menu administrativo', () => {
    const sidebar = normalize(read('app/components/layout/LayoutDashboardSidebar.vue'))
    assert.doesNotMatch(sidebar, /configura[cç][aã]o inicial/)
    assert.doesNotMatch(sidebar, /path: '\/onboarding'/)
  })
})

describe('largura do painel administrativo', () => {
  const layout = normalize(read('app/layouts/dashboard.vue'))
  const classesPage = normalize(read('app/pages/dashboard/turmas.vue'))

  it('reserva a sidebar uma unica vez e estica o conteudo restante', () => {
    assert.ok(layout.includes('class="w-full min-w-0 min-h-screen pl-[72px]'))
    assert.ok(layout.includes("'md:pl-[220px]'"))
    assert.ok(classesPage.includes('w-full min-h-screen'))
  })

  it('usa em turmas exatamente o mesmo wrapper externo de modalidades', () => {
    const modalitiesPage = normalize(read('app/pages/dashboard/modalidades.vue'))
    assert.ok(classesPage.includes('class="p-4 sm:p-8 w-full min-h-screen"'))
    assert.ok(modalitiesPage.includes('class="p-4 sm:p-8 w-full min-h-screen"'))
    assert.doesNotMatch(classesPage, /definepagemeta\(\{ layout: 'dashboard'/)
  })
})

describe('pix e exclusao segura do professor', () => {
  const migration = normalize(read('supabase/migrations/202609070038_professor_pix_exclusao.sql'))
  const teachers = normalize(read('app/components/configuracoes/ConfigProfessores.vue'))

  it('salva chave pix e permite cpf opcional sem validacao algoritmica', () => {
    assert.ok(migration.includes('add column if not exists pix_chave'))
    assert.doesNotMatch(migration, /cpf_valido\(v_cpf\)/)
    assert.ok(teachers.includes('cpf (opcional)'))
    assert.ok(teachers.includes('p_pix_chave: form.value.pixkey'))
  })

  it('bloqueia exclusao quando existe historico operacional', () => {
    assert.ok(migration.includes('function public.excluir_professor_definitivamente'))
    assert.ok(migration.includes('repasses_professor'))
    assert.ok(migration.includes('matriculas_turma mt join public.turmas'))
    assert.ok(migration.includes('presencas pr join public.turmas'))
  })

  it('remove turmas vazias, modalidades e acesso com confirmacao', () => {
    assert.ok(migration.includes('delete from public.turmas where professor_id=p_professor_id'))
    assert.ok(migration.includes('delete from public.professor_modalidades'))
    assert.ok(migration.includes('delete from auth.users'))
    assert.ok(teachers.includes('excluir professor'))
  })
})

describe('acesso manual do professor sem smtp', () => {
  const invite = normalize(read('server/api/admin/invite-user.post.ts'))
  const resend = normalize(read('server/api/admin/resend-access.post.ts'))
  const teachers = normalize(read('app/components/configuracoes/ConfigProfessores.vue'))

  it('cria o auth user e devolve o link sem tentar enviar email', () => {
    assert.ok(invite.includes("type: 'invite'"))
    assert.ok(invite.includes('const activationlink = invitation.properties?.action_link'))
    assert.doesNotMatch(invite, /inviteuserbyemail/)
  })

  it('gera novo link e permite copiar no cadastro do professor', () => {
    assert.ok(resend.includes("type: 'recovery'"))
    assert.ok(teachers.includes('copiar link'))
    assert.ok(teachers.includes('navigator.clipboard.writetext'))
  })

  it('normaliza id e sub da identidade validada no servidor', () => {
    const management = normalize(read('server/utils/requireManagement.ts'))
    assert.ok(management.includes('authuser.id || authuser.sub'))
    assert.ok(management.includes(".eq('id', authuserid)"))
  })
})

describe('exclusao de modalidade e criacao guiada de sala', () => {
  const migration = normalize(read('supabase/migrations/202609070039_exclusao_modalidade.sql'))
  const modalities = normalize(read('app/components/configuracoes/ConfigModalidades.vue'))
  const rooms = normalize(read('app/components/configuracoes/ConfigSalas.vue'))

  it('protege modalidades que possuem turmas historicas', () => {
    assert.ok(migration.includes('function public.excluir_modalidade_definitivamente'))
    assert.ok(migration.includes('exists(select 1 from public.turmas'))
    assert.ok(migration.includes('update public.salas set modalidade_padrao_id=null'))
  })

  it('expoe exclusao confirmada na listagem', () => {
    assert.ok(modalities.includes("rpc('excluir_modalidade_definitivamente'"))
    assert.ok(modalities.includes('excluir modalidade'))
  })

  it('abre nova sala com a modalidade criada selecionada', () => {
    assert.ok(modalities.includes("path: '/dashboard/salas'"))
    assert.ok(modalities.includes("query: { nova: '1', modalidade: string(savedid) }"))
    assert.ok(rooms.includes("route.query.nova !== '1'"))
    assert.ok(rooms.includes('formdata.value.defaultmodality = requestedmodality'))
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

describe('cadastro de turmas em lote', () => {
  const form = normalize(read('app/components/modals/ClassFormModal.vue'))
  const classes = normalize(read('app/components/configuracoes/ConfigTurmas.vue'))
  const migration = normalize(read('supabase/migrations/202609080042_turmas_em_lote.sql'))

  it('permite selecionar varios dias somente ao criar', () => {
    assert.ok(form.includes('form.diassemana'))
    assert.ok(form.includes('toggleday'))
    assert.ok(form.includes('v-if="classdata"'))
    assert.ok(form.includes('dias_semana: props.classdata ? undefined : selecteddays.value'))
  })

  it('usa uma unica operacao transacional para criar o lote', () => {
    assert.ok(classes.includes("rpc('salvar_turmas_em_lote'"))
    assert.ok(migration.includes('function public.salvar_turmas_em_lote'))
    assert.ok(migration.includes('from unnest(p_dias_semana)'))
    assert.ok(migration.includes('insert into public.turmas'))
    assert.ok(migration.includes('array_agg(distinct dia order by dia)'))
  })

  it('mantem a edicao de uma turma individual', () => {
    assert.ok(classes.includes("rpc('salvar_turma'"))
    assert.ok(form.includes("if (props.classdata) return 'salvar alterações'"))
  })
})

describe('confirmacao integral do lote de turmas', () => {
  const form = normalize(read('app/components/modals/ClassFormModal.vue'))
  const classes = normalize(read('app/components/configuracoes/ConfigTurmas.vue'))
  const migration = normalize(read('supabase/migrations/202609080043_correcao_turmas_em_lote.sql'))

  it('mostra previamente todos os dias selecionados', () => {
    assert.ok(form.includes('selecteddaynames'))
    assert.ok(form.includes('serão criadas {{ selecteddays.length }} turmas'))
  })

  it('insere cada dia no banco e valida a resposta integral', () => {
    assert.ok(migration.includes('foreach v_dia in array v_dias loop'))
    assert.ok(migration.includes('array_append(v_ids, v_id)'))
    assert.ok(classes.includes('data.length !== total'))
  })
})

describe('controles responsivos da chamada', () => {
  const pages = [
    normalize(read('app/pages/dashboard/frequencia.vue')),
    normalize(read('app/pages/professor/chamada.vue'))
  ]

  it('separa os tres estados sem texto sobreposto', () => {
    for (const page of pages) {
      assert.ok(page.includes('sm:grid-cols-3'))
      assert.ok(page.includes('min-w-28 whitespace-nowrap'))
      assert.ok(page.includes('min-w-36'))
      assert.doesNotMatch(page, /transition-all w-14 text-center/)
    }
  })

  it('mantem area de toque confortavel e estado desabilitado visivel', () => {
    for (const page of pages) {
      assert.ok(page.includes('min-h-11'))
      assert.ok(page.includes('disabled:cursor-not-allowed'))
    }
  })
})

describe('matricula com varias modalidades', () => {
  const createModal = normalize(read('app/components/modals/StudentCreateModal.vue'))
  const transaction = normalize(read('supabase/migrations/202608310008_matricula_transacional.sql'))

  it('seleciona varias modalidades sem apagar escolhas anteriores', () => {
    assert.ok(createModal.includes('selectedmodalityids'))
    assert.ok(createModal.includes('selectedmodalitygroups'))
    assert.ok(createModal.includes('selectclassformodality'))
    assert.doesNotMatch(createModal, /watch\(selectedmodalityid/)
  })

  it('exige exatamente uma turma para cada modalidade escolhida', () => {
    assert.ok(createModal.includes('isenrollmentselectioncomplete'))
    assert.ok(createModal.includes('formdata.instruments = formdata.instruments.filter(id => !modalityclassids.has(id))'))
    assert.ok(createModal.includes('escolha uma turma para cada modalidade selecionada'))
  })

  it('envia todas as turmas e soma as mensalidades no contrato', () => {
    assert.ok(createModal.includes('p_turma_ids: formdata.instruments'))
    assert.ok(createModal.includes('selectedclasses.reduce'))
    assert.ok(transaction.includes('foreach v_turma_id in array'))
    assert.ok(transaction.includes('v_valor + m.valor_padrao_mensalidade'))
  })
})

describe('hotfix da exclusao definitiva do aluno', () => {
  const migration = normalize(read('supabase/migrations/202609090044_hotfix_excluir_aluno.sql'))

  it('recria a assinatura consumida pela interface e atualiza o cache da api', () => {
    assert.ok(migration.includes('function public.excluir_aluno_definitivamente(p_aluno_id uuid)'))
    assert.ok(migration.includes("public.meu_papel() <> 'gestao'::public.papel_usuario"))
    assert.ok(migration.includes("notify pgrst, 'reload schema'"))
    assert.ok(migration.includes('grant execute on function public.excluir_aluno_definitivamente(uuid) to authenticated'))
  })

  it('remove dependencias antes do cadastro e do acesso', () => {
    const dependencies = ['repasse_itens', 'comissoes_professor_aluno', 'presencas', 'recibos', 'fluxo_caixa', 'cobrancas', 'contratos', 'matriculas_turma']
    for (const table of dependencies) assert.ok(migration.includes(`delete from public.${table}`))
    assert.ok(migration.indexOf('delete from public.matriculas_turma') < migration.indexOf('delete from public.alunos'))
    assert.ok(migration.includes('delete from auth.users'))
  })
})

describe('exclusao administrativa do aluno sem dependencia de rpc', () => {
  const table = normalize(read('app/components/students/StudentsTable.vue'))
  const endpoint = normalize(read('server/api/admin/delete-student.post.ts'))

  it('envia a sessao autenticada para a rota administrativa', () => {
    assert.ok(table.includes("$fetch('/api/admin/delete-student'"))
    assert.ok(table.includes('authorization: `bearer ${accesstoken}`'))
    assert.doesNotMatch(table, /rpc\('excluir_aluno_definitivamente'/)
  })

  it('revalida a gestao no servidor e nao expoe a chave privada', () => {
    assert.ok(endpoint.includes('requiremanagement(event)'))
    assert.ok(endpoint.includes("from('alunos')"))
    assert.ok(endpoint.includes('admin.auth.admin.deleteuser'))
    assert.doesNotMatch(table, /supabase_secret|service_role/)
  })

  it('remove o grafo operacional e registra auditoria', () => {
    for (const tableName of ['repasse_itens', 'comissoes_professor_aluno', 'presencas', 'recibos', 'fluxo_caixa', 'cobrancas', 'contratos', 'matriculas_turma']) {
      assert.ok(endpoint.includes(`'${tableName}'`))
    }
    assert.ok(endpoint.includes("acao: 'exclusao_definitiva'"))
  })
})
