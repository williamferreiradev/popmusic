-- Pop Music - constraints idempotentes
-- Execute somente depois que 202608310002_integrity_audit.sql retornar zero
-- inconsistencias. Nenhum dado e removido automaticamente.

begin;

create unique index if not exists uq_contratos_token
  on public.contratos (token);

create unique index if not exists uq_cobrancas_contrato_vencimento
  on public.cobrancas (contrato_id, vencimento)
  where contrato_id is not null;

create unique index if not exists uq_presencas_aluno_turma_data_tipo
  on public.presencas (aluno_id, turma_id, data_aula, tipo_aula);

create unique index if not exists uq_matricula_ativa_aluno_turma
  on public.matriculas_turma (aluno_id, turma_id)
  where data_fim is null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'contratos_dia_vencimento_valido'
      and conrelid = 'public.contratos'::regclass
  ) then
    alter table public.contratos
      add constraint contratos_dia_vencimento_valido
      check (dia_vencimento between 1 and 28) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'contratos_valor_mensalidade_positivo'
      and conrelid = 'public.contratos'::regclass
  ) then
    alter table public.contratos
      add constraint contratos_valor_mensalidade_positivo
      check (valor_mensalidade > 0) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'cobrancas_valor_positivo'
      and conrelid = 'public.cobrancas'::regclass
  ) then
    alter table public.cobrancas
      add constraint cobrancas_valor_positivo
      check (valor > 0) not valid;
  end if;
end
$$;

alter table public.contratos validate constraint contratos_dia_vencimento_valido;
alter table public.contratos validate constraint contratos_valor_mensalidade_positivo;
alter table public.cobrancas validate constraint cobrancas_valor_positivo;

commit;
