-- Remove privilegios diretos do visitante anonimo em todo o dominio sensivel.
-- RLS continua como segunda camada; authenticated e service_role nao sao alterados.
begin;

revoke all privileges on table
  public.usuarios,
  public.alunos,
  public.professores,
  public.professor_modalidades,
  public.modalidades,
  public.salas,
  public.turmas,
  public.matriculas_turma,
  public.contratos,
  public.cobrancas,
  public.presencas,
  public.recibos,
  public.repasses_professor,
  public.repasse_itens,
  public.fluxo_caixa,
  public.contas_financeiras,
  public.configuracoes,
  public.feriados,
  public.modelos_contrato,
  public.chamadas_aula,
  public.auditoria,
  public.comunicacoes,
  public.estornos_pagamento
from anon, public;

-- Evita que tabelas futuras criadas pelo mesmo proprietario recebam acesso anonimo.
alter default privileges in schema public
  revoke all privileges on tables from anon, public;

commit;
