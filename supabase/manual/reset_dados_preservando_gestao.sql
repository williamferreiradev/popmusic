-- RESET DE HOMOLOGAÇÃO — operação destrutiva e irreversível.
-- Preserva somente a conta de gestão informada abaixo, configurações e modelos de contrato.
-- Revise o e-mail antes de executar no SQL Editor do Supabase.

begin;

do $$
declare
  v_admin_email constant text := 'william.ferreira.web@gmail.com';
  v_admin_id uuid;
begin
  select id into v_admin_id
  from auth.users
  where lower(email) = lower(v_admin_email);

  if v_admin_id is null then
    raise exception 'ABORTADO: conta de gestão % não encontrada no Auth', v_admin_email;
  end if;

  if not exists (
    select 1 from public.usuarios
    where id = v_admin_id and papel = 'gestao'
  ) then
    raise exception 'ABORTADO: % não possui perfil de gestão', v_admin_email;
  end if;

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
    public.auditoria
  restart identity cascade;

  delete from public.usuarios where id <> v_admin_id;
  delete from auth.users where id <> v_admin_id;
  update public.usuarios set ativo = true where id = v_admin_id;
end;
$$;

commit;
