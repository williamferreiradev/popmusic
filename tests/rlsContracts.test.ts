import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const normalize = (text: string) => text.replace(/\s+/g, ' ').toLowerCase()
const security = normalize(read('supabase/migrations/202608310001_security_hardening.sql'))

describe('RLS das tabelas sensíveis', () => {
  const sensitiveTables = [
    'usuarios', 'alunos', 'professores', 'professor_modalidades', 'matriculas_turma',
    'contratos', 'cobrancas', 'presencas', 'recibos', 'repasses_professor',
    'fluxo_caixa', 'contas_financeiras', 'configuracoes', 'modelos_contrato'
  ]

  it('habilita RLS em todas as tabelas operacionais sensíveis', () => {
    for (const table of sensitiveTables) {
      assert.ok(
        security.includes(`alter table public.${table} enable row level security`),
        `RLS ausente em public.${table}`
      )
    }
  })

  it('não concede acesso direto anônimo às tabelas de alunos e finanças', () => {
    for (const table of [
      'usuarios', 'alunos', 'matriculas_turma', 'contratos', 'cobrancas',
      'presencas', 'recibos', 'repasses_professor', 'fluxo_caixa'
    ]) {
      assert.ok(security.includes(`revoke all on table public.${table} from anon`))
    }
    assert.doesNotMatch(security, /create policy[^;]+to anon[^;]+using\s*\(\s*true\s*\)/)
  })
})

describe('isolamento por papel', () => {
  it('restringe o aluno aos próprios dados', () => {
    for (const policy of [
      'aluno_le_proprio_cadastro', 'aluno_le_proprias_matriculas',
      'aluno_le_proprios_contratos', 'aluno_le_proprias_cobrancas',
      'aluno_le_proprias_presencas', 'aluno_le_proprios_recibos'
    ]) {
      assert.ok(security.includes(`create policy "${policy}"`), `Política ${policy} ausente`)
    }
    assert.ok(security.includes('aluno_id = public.meu_aluno_id()'))
  })

  it('restringe professor às próprias turmas, alunos, presenças e repasses', () => {
    assert.ok(security.includes('professor_id = public.meu_professor_id()'))
    assert.ok(security.includes('public.turma_do_professor(turma_id)'))
    assert.ok(security.includes('public.aluno_do_professor(aluno_id)'))
    assert.ok(security.includes('registrado_por = auth.uid()'))
  })

  it('concede CRUD de gestão condicionado ao papel obtido pelo banco', () => {
    assert.ok(security.includes('create policy "gestao_crud"'))
    assert.ok(security.includes("using (public.meu_papel() = ''gestao''::public.papel_usuario)"))
    assert.ok(security.includes("with check (public.meu_papel() = ''gestao''::public.papel_usuario)"))
  })
})

describe('views seguras do professor', () => {
  const views = normalize(read('supabase/migrations/202609020019_views_professor_seguras.sql'))

  it('executa todas as views com as permissões do usuário chamador', () => {
    assert.equal((views.match(/with \(security_invoker = true\)/g) || []).length, 3)
  })

  it('não expõe CPF, endereço nem valores de outros professores', () => {
    assert.ok(views.includes('null::text as telefone'))
    assert.ok(views.includes('null::text as email'))
    assert.doesNotMatch(views, /select distinct[^;]+a\.cpf/)
    assert.ok(views.includes('where r.professor_id = public.meu_professor_id()'))
  })

  it('revoga acesso público e libera leitura apenas a autenticados', () => {
    for (const view of ['vw_professor_agenda', 'vw_professor_alunos', 'vw_professor_meu_repasse']) {
      assert.ok(views.includes(`revoke all on public.${view} from public, anon`))
      assert.ok(views.includes(`grant select on public.${view} to authenticated`))
    }
  })
})

describe('operações privilegiadas', () => {
  it('mantém assinatura pública somente no backend service role', () => {
    const signature = normalize(read('supabase/migrations/202609020017_contrato_imutavel.sql'))
    assert.ok(signature.includes('revoke all on function public.assinar_contrato_com_consentimento(text,text,text,text) from public, anon, authenticated'))
    assert.ok(signature.includes('grant execute on function public.assinar_contrato_com_consentimento(text,text,text,text) to service_role'))
  })

  it('protege pagamentos, repasses e resumo financeiro por papel de gestão', () => {
    for (const migration of [
      'supabase/migrations/202608310006_repasse_transacional.sql',
      'supabase/migrations/202608310007_baixa_manual_cobranca.sql',
      'supabase/migrations/202609030025_estorno_pagamento_manual.sql',
      'supabase/migrations/202609030026_resumo_financeiro.sql'
    ]) {
      const sql = normalize(read(migration))
      assert.ok(sql.includes("public.meu_papel() <> 'gestao'"), `Proteção de gestão ausente em ${migration}`)
    }
  })
})
