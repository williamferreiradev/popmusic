begin;

create table if not exists public.chamadas_aula (
  id uuid primary key default gen_random_uuid(),
  turma_id uuid not null references public.turmas(id) on delete restrict,
  data_aula date not null,
  finalizada_em timestamptz not null default now(),
  finalizada_por uuid not null references public.usuarios(id) on delete restrict,
  criado_em timestamptz not null default now(),
  constraint uq_chamada_turma_data unique (turma_id, data_aula)
);

create index if not exists idx_chamadas_aula_data on public.chamadas_aula (data_aula);
create index if not exists idx_chamadas_aula_finalizada_por on public.chamadas_aula (finalizada_por);

alter table public.chamadas_aula enable row level security;

drop policy if exists "gestao_crud" on public.chamadas_aula;
create policy "gestao_crud"
on public.chamadas_aula for all to authenticated
using (public.meu_papel() = 'gestao'::public.papel_usuario)
with check (public.meu_papel() = 'gestao'::public.papel_usuario);

drop policy if exists "professor_le_fechamento_propria_turma" on public.chamadas_aula;
create policy "professor_le_fechamento_propria_turma"
on public.chamadas_aula for select to authenticated
using (public.turma_do_professor(turma_id));

drop policy if exists "professor_finaliza_propria_turma" on public.chamadas_aula;
create policy "professor_finaliza_propria_turma"
on public.chamadas_aula for insert to authenticated
with check (
  public.meu_papel() = 'professor'::public.papel_usuario
  and public.turma_do_professor(turma_id)
  and finalizada_por = auth.uid()
);

revoke all on table public.chamadas_aula from anon;
grant select, insert on table public.chamadas_aula to authenticated;

commit;
