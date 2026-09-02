begin;

alter table public.chamadas_aula
  add column if not exists reaberta_em timestamptz,
  add column if not exists reaberta_por uuid references public.usuarios(id) on delete restrict,
  add column if not exists motivo_reabertura text,
  add column if not exists ativa boolean not null default true;

alter table public.chamadas_aula drop constraint if exists uq_chamada_turma_data;
create unique index if not exists uq_chamada_ativa_turma_data
  on public.chamadas_aula (turma_id, data_aula)
  where ativa = true;

alter table public.chamadas_aula
  drop constraint if exists chamadas_aula_motivo_reabertura_check;

alter table public.chamadas_aula
  add constraint chamadas_aula_motivo_reabertura_check
  check (
    (ativa = true and reaberta_em is null and reaberta_por is null and motivo_reabertura is null)
    or
    (ativa = false and reaberta_em is not null and reaberta_por is not null and length(trim(motivo_reabertura)) >= 5)
  );

drop policy if exists "gestao_reabre_chamada" on public.chamadas_aula;
drop policy if exists "gestao_crud" on public.chamadas_aula;

create policy "gestao_le_chamadas"
on public.chamadas_aula for select to authenticated
using (public.meu_papel() = 'gestao'::public.papel_usuario);

create policy "gestao_reabre_chamada"
on public.chamadas_aula for update to authenticated
using (public.meu_papel() = 'gestao'::public.papel_usuario)
with check (
  public.meu_papel() = 'gestao'::public.papel_usuario
  and ativa = false
  and reaberta_por = auth.uid()
  and reaberta_em is not null
  and length(trim(motivo_reabertura)) >= 5
);

grant update on table public.chamadas_aula to authenticated;

commit;
