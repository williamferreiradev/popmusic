-- RESET COMPLETO PARA ENTREGA — operação DESTRUTIVA e IRREVERSÍVEL.
-- Prepara o banco para os testes do zero pela escola:
--   * preserva: a conta de gestão do ADM (edite o e-mail abaixo!), o modelo de
--     contrato ativo e as configurações da escola (nome, CNPJ, PIX, remetente);
--   * remove: alunos, professores, turmas, salas, modalidades, matrículas,
--     contratos, cobranças, recibos, caixa, repasses, presenças, chamadas,
--     contas financeiras, feriados, relatórios salvos, comunicações e todos os
--     demais usuários (gestão extra, professores e alunos) do Auth;
--   * preserva: trilha de auditoria (imutável por regra de negócio) — os
--     registros de quem criou/alterou permanecem para histórico legal.
--
-- ANTES DE EXECUTAR:
-- 1. FAÇA BACKUP (docs/recuperacao_banco.md, seção "Repetir o backup sem senha").
-- 2. Edite v_admin_email para o e-mail da conta de gestão que a escola vai usar.
-- 3. Execute a partir do SQL Editor do projeto Pop Music.
--
-- Trilha de auditoria de fixturas de teste (TESTE AUTOMATIZADO / rls051) fica
-- no histórico, mas os perfis dessas contas já estão inativos e as identidades
-- banidas — nada deles é utilizável.

begin;

do $$
declare
  v_admin_email constant text := 'william.ferreira.web@gmail.com';  -- EDITE AQUI
  v_admin_id uuid;
  v_restantes int;
begin
  select id into v_admin_id
  from auth.users
  where lower(pg_catalog.btrim(email)) = lower(pg_catalog.btrim(v_admin_email));

  if v_admin_id is null then
    raise exception 'ABORTADO: conta de gestão % não encontrada no Auth', v_admin_email;
  end if;

  if not exists (
    select 1 from public.usuarios
    where id = v_admin_id and papel = 'gestao'
  ) then
    raise exception 'ABORTADO: % não possui perfil de gestão ativo em usuarios', v_admin_email;
  end if;

  -- Operação operacional (ordem respeita FKs):
  truncate table
    public.estornos_pagamento,
    public.repasse_itens,
    public.repasses_professor,
    public.fluxo_caixa,
    public.recibos,
    public.cobrancas,
    public.presencas,
    public.chamadas_aula,
    public.matriculas_turma,
    public.contratos,
    public.tentativas_assinatura,
    public.comissoes_professor_aluno,
    public.professor_modalidades,
    public.turmas,
    public.alunos,
    public.professores,
    public.salas,
    public.modalidades,
    public.contas_financeiras,
    public.comunicacoes,
    public.relatorios_salvos,
    public.feriados,
    public.exclusoes_aluno,
    public.auditoria
  restart identity cascade;

  -- Perfis públicos: só a conta do ADM permanece (ativa + onboarding pendente
  -- para a escola refazer o cadastro guiado).
  delete from public.usuarios where id <> v_admin_id;
  update public.usuarios
     set ativo = true, onboarding_concluido = false
   where id = v_admin_id;

  -- Identidades Auth: todos menos o ADM (usuarios.id → auth.users CASCADE
  -- já teria removido os perfis apagados acima; aqui removemos as raízes).
  delete from auth.users where id <> v_admin_id;

  -- Verificação interna: nada além do ADM pode restar.
  select count(*) into v_restantes from public.usuarios;
  if v_restantes <> 1 then
    raise exception 'ABORTADO: esperado 1 perfil de usuário após o reset, encontrados %', v_restantes;
  end if;
end;
$$;

commit;

-- Confirmação visual (execute se rodar bloco a bloco):
-- select papel, ativo, onboarding_concluido from public.usuarios;
-- select 'alunos' t, count(*) from public.alunos union all
-- select 'professores', count(*) from public.professores union all
-- select 'turmas', count(*) from public.turmas union all
-- select 'contratos', count(*) from public.contratos union all
-- select 'cobrancas', count(*) from public.cobrancas;
