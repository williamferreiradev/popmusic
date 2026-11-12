-- Cleanup de segurança: remove políticas e privilégios legados que sobreviveram
-- à migration 001 e não foram cobertos por ela.
--
-- Contexto (análise 2026-11-11):
-- 1. A migration 001 só removeu as políticas legadas cujos nomes conhecia. Um
--    segundo conjunto de políticas "to public" criado por outro caminho ficou
--    ativo. A mais grave expõe professores (CPF, telefone, e-mail, PIX,
--    comissão) a qualquer usuário autenticado, inclusive alunos (baseline
--    linha 2527). Duas políticas de presencas anulem o bloqueio de chamada
--    finalizada da migration 034.
-- 2. Todas essas políticas são redundantes: a camada correta "to
--    authenticated" (001+) já cobre cada tabela. Removê-las não muda o
--    comportamento esperado — apenas elimina o excesso (permissivo + OR).
-- 3. Grants padrão do Supabase nunca revogados para authenticated: TRUNCATE
--    (não passa por RLS), TRIGGER, REFERENCES e MAINTAIN.
-- 4. EXECUTE de funções financeiras privilegiadas concedido a anon (o corpo
--    das funções checa papel, mas o padrão "ACL aberta + check in-body" é
--    frágil). Assina-se com o padrão já usado nas funções de assinatura:
--    revoke de tudo, grant somente a quem usa.
--
-- Efeito esperado: nenhuma tela muda. Aluno continua vendo suas turmas,
-- frequência, cobranças e contrato (views + políticas authenticated).
-- Professor continua fazendo chamada (presenças/chamadas_aula authenticated).
--
-- Verificação pós-aplicação (SQL Editor):
--   select tablename, policyname from pg_policies
--    where schemaname='public' and 'public' = any(roles);
--   -- resultado esperado: ZERO linhas
--   select grantee, privilege_type from information_schema.role_table_grants
--    where table_schema='public' and grantee='authenticated'
--      and privilege_type in ('TRUNCATE','MAINTAIN');
--   -- resultado esperado: ZERO linhas

begin;

-- ---------------------------------------------------------------------------
-- 1. Políticas legadas "to public" com nome conhecido (documentação do motivo)
-- ---------------------------------------------------------------------------

-- professores: expunha dados pessoais de TODOS os professores a qualquer
-- autenticado (aluno incluído) — o achado mais grave da análise.
drop policy if exists "Todos os papéis autenticados leem professores" on public.professores;

-- presencas: sem checagem de chamada finalizada nem de vínculo do professor,
-- anulavam a restrição da 034 (insert/update coexistem por OR).
drop policy if exists "Professor e gestão registram presença" on public.presencas;
drop policy if exists "Professor e gestão editam presença" on public.presencas;

-- catálogos: equivalentes authenticated já existem
-- (autenticados_leem_modalidades / autenticados_leem_salas / gestao_crud).
drop policy if exists "Todos os papéis autenticados leem modalidades" on public.modalidades;
drop policy if exists "Todos os papéis autenticados leem salas" on public.salas;
drop policy if exists "Todos os papéis autenticados leem feriados" on public.feriados;

-- camada de gestão duplicada por "gestao_crud" (FOR ALL, authenticated)
drop policy if exists "Aluno vê apenas o próprio registro" on public.alunos;
drop policy if exists "Gestão atualiza alunos" on public.alunos;
drop policy if exists "Gestão cria alunos" on public.alunos;
drop policy if exists "Gestão vê todos os alunos" on public.alunos;
drop policy if exists "Professor vê apenas alunos das suas turmas" on public.alunos;
drop policy if exists "Só gestão consulta auditoria" on public.auditoria;
drop policy if exists "Aluno vê apenas as próprias cobranças" on public.cobrancas;
drop policy if exists "Gestão gerencia cobranças" on public.cobrancas;
drop policy if exists "Gestão vê todas as cobranças" on public.cobrancas;
drop policy if exists "Só gestão vê comissões" on public.comissoes_professor_aluno;
drop policy if exists "Gestão atualiza configurações" on public.configuracoes;
drop policy if exists "Gestão insere configurações" on public.configuracoes;
drop policy if exists "Gestão lê configurações" on public.configuracoes;
drop policy if exists "Só gestão acessa contas financeiras" on public.contas_financeiras;
drop policy if exists "Aluno vê apenas os próprios contratos" on public.contratos;
drop policy if exists "Gestão atualiza contratos" on public.contratos;
drop policy if exists "Gestão cria contratos" on public.contratos;
drop policy if exists "Gestão vê todos os contratos" on public.contratos;
drop policy if exists "Só gestão gerencia feriados" on public.feriados;
drop policy if exists "Só gestão acessa fluxo de caixa" on public.fluxo_caixa;
drop policy if exists "Aluno vê as próprias matrículas" on public.matriculas_turma;
drop policy if exists "Gestão gerencia matrículas" on public.matriculas_turma;
drop policy if exists "Gestão vê todas as matrículas" on public.matriculas_turma;
drop policy if exists "Professor vê matrículas das próprias turmas" on public.matriculas_turma;
drop policy if exists "Só gestão edita modalidades" on public.modalidades;
drop policy if exists "Só gestão exclui modalidades" on public.modalidades;
drop policy if exists "Só gestão gerencia modalidades" on public.modalidades;
drop policy if exists "Gestão vê modelos de contrato" on public.modelos_contrato;
drop policy if exists "Só gestão edita modelo de contrato" on public.modelos_contrato;
drop policy if exists "Aluno vê as próprias presenças" on public.presencas;
drop policy if exists "Gestão vê todas as presenças" on public.presencas;
drop policy if exists "Professor vê presenças das próprias turmas" on public.presencas;
drop policy if exists "Só gestão edita professores" on public.professores;
drop policy if exists "Só gestão gerencia professores" on public.professores;
drop policy if exists "Gestão gerencia recibos" on public.recibos;
drop policy if exists "Gestão vê todos os recibos" on public.recibos;
drop policy if exists "Usuário gerencia os próprios relatórios salvos" on public.relatorios_salvos;
drop policy if exists "Usuário vê os próprios relatórios salvos" on public.relatorios_salvos;
drop policy if exists "Gestão vê itens de repasse" on public.repasse_itens;
drop policy if exists "Professor vê itens do próprio repasse" on public.repasse_itens;
drop policy if exists "Gestão vê todos os repasses" on public.repasses_professor;
drop policy if exists "Professor vê apenas o próprio repasse" on public.repasses_professor;
drop policy if exists "Só gestão gerencia repasses" on public.repasses_professor;
drop policy if exists "Só gestão edita salas" on public.salas;
drop policy if exists "Só gestão exclui salas" on public.salas;
drop policy if exists "Só gestão gerencia salas" on public.salas;
drop policy if exists "Aluno vê turmas em que está matriculado" on public.turmas;
drop policy if exists "Gestão gerencia turmas" on public.turmas;
drop policy if exists "Gestão vê todas as turmas" on public.turmas;
drop policy if exists "Professor vê apenas as próprias turmas" on public.turmas;
drop policy if exists "Gestão vê todos os usuários" on public.usuarios;
drop policy if exists "Só gestão cria usuários" on public.usuarios;
drop policy if exists "Só gestão edita usuários" on public.usuarios;
drop policy if exists "Usuário vê o próprio registro" on public.usuarios;

-- ---------------------------------------------------------------------------
-- 2. Rede de segurança: derruba QUALQUER política "to public" restante em
--    schema public (drift não catalogado). A camada correta usa
--    authenticated/service_role; nada no projeto deve depender de to public.
--    Cada remoção é registrada no log do SQL Editor.
-- ---------------------------------------------------------------------------
do $$
declare r record;
begin
  for r in
    select policyname, tablename
    from pg_policies
    where schemaname = 'public'
      and 'public' = any(roles)
  loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
    raise notice 'Política legada "to public" removida: %.%', r.tablename, r.policyname;
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 3. Cobertura de leitura que existia apenas na camada "to public"
--
-- As views do aluno executam com security_invoker, então os JOINs pedem
-- SELECT ao próprio usuário. O que faltava na camada authenticated:
--
--  - aluno lê turmas apenas onde tem matrícula vigente (views
--    vw_aluno_minhas_turmas e vw_aluno_minha_frequencia fazem JOIN);
--  - professor e aluno leem feriados (chamada bloqueia dias de feriado);
--  - aluno vê o NOME do professor da turma sem expor CPF/PIX/telefone:
--    a nova view pública mínima abaixo, e o JOIN de
--    vw_aluno_minhas_turmas passa a usá-la em vez da tabela.
-- ---------------------------------------------------------------------------

create policy aluno_le_turmas_matriculado
  on public.turmas as permissive for select to authenticated
  using (exists (
    select 1 from public.matriculas_turma mt
    where mt.turma_id = turmas.id
      and mt.aluno_id = public.meu_aluno_id()
      and mt.data_fim is null
  ));

create policy autenticados_leem_feriados
  on public.feriados as permissive for select to authenticated
  using (true);

grant select on public.feriados to authenticated;

-- View mínima: somente id, nome e ativo. O dono (postgres) ignora RLS da
-- tabela professores, mas o SELECT expõe apenas estas colunas — CPF,
-- comissão, PIX e contatos permanecem inacessíveis a qualquer cliente.
create or replace view public.vw_professor_publico as
  select id, nome, ativo
  from public.professores;

revoke all on table public."vw_professor_publico" from public, anon;
grant select on table public.vw_professor_publico to authenticated;

-- O nome do professor agora vem da view mínima.
create or replace view public.vw_aluno_minhas_turmas with (security_invoker=true) as
  select t.id as turma_id,
         t.dia_semana,
         t.horario_inicio,
         t.horario_fim,
         m.nome as modalidade,
         pp.nome as professor,
         s.nome as sala
    from public.matriculas_turma mt
      join public.turmas t on t.id = mt.turma_id
      join public.modalidades m on m.id = t.modalidade_id
      left join public.vw_professor_publico pp on pp.id = t.professor_id
      left join public.salas s on s.id = t.sala_id
   where mt.aluno_id = public.meu_aluno_id()
     and mt.data_fim is null
     and t.ativo = true;

-- ---------------------------------------------------------------------------
-- 4. Privilégios: revoke do excesso herdado do padrão Supabase
-- ---------------------------------------------------------------------------

-- TRUNCATE não passa por RLS: nenhum papel de aplicação deve tê-lo.
revoke truncate on all tables in schema public from authenticated;

-- Referências cruzadas, triggers e manutenção ficam no dono/service_role.
revoke trigger, references, maintain on all tables in schema public from authenticated;

-- anon não executa funções operacionais; o corpo já exige papel de gestão,
-- mas a ACL deve negar por padrão (mesmo padrão das funções de assinatura).
revoke execute on function public.estornar_pagamento_manual(uuid,uuid,date,text) from anon;
revoke execute on function public.registrar_pagamento_manual(uuid,public.forma_pagamento,date,uuid,text) from anon;
revoke execute on function public.obter_resumo_financeiro(date) from anon;
revoke execute on function public.excluir_aluno_definitivamente(uuid) from anon;

-- Helpers de trigger e auditoria não são chamáveis por fora.
revoke execute on function public.registrar_auditoria_automatica() from anon;
revoke execute on function public.sanitizar_auditoria(text,jsonb) from anon;
revoke execute on function public.proteger_snapshot_contrato() from anon;
revoke execute on function public.marcar_contrato_anterior_renovado() from anon;
revoke execute on function public.validar_turma() from anon;
revoke execute on function public.set_atualizado_em() from anon;
revoke execute on function public.rls_auto_enable() from anon;

-- Tabelas futuras criadas pelo mesmo dono nascem sem privilégio implícito.
alter default privileges in schema public
  revoke all privileges on tables from authenticated;

notify pgrst, 'reload schema';

commit;
