-- Os vinculos eram gravados pelas RPCs, mas ficavam invisiveis no painel.
begin;
alter table public.professor_modalidades enable row level security;
drop policy if exists gestao_le_professor_modalidades on public.professor_modalidades;
create policy gestao_le_professor_modalidades on public.professor_modalidades
for select to authenticated using (public.meu_papel() = 'gestao');
drop policy if exists professor_le_proprias_modalidades on public.professor_modalidades;
create policy professor_le_proprias_modalidades on public.professor_modalidades
for select to authenticated using (
  public.meu_papel() = 'professor' and professor_id = public.meu_professor_id()
);
grant select on public.professor_modalidades to authenticated;
revoke all on public.professor_modalidades from anon;
notify pgrst, 'reload schema';
commit;
