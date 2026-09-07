begin;

create or replace function public.excluir_turma_definitivamente(p_turma_id uuid)
returns void language plpgsql security definer set search_path=public as $$
begin
  if public.meu_papel()<>'gestao' then raise exception 'Apenas a gestao pode excluir turmas'; end if;
  perform 1 from public.turmas where id=p_turma_id for update;
  if not found then raise exception 'Turma nao encontrada'; end if;
  if exists(select 1 from public.matriculas_turma where turma_id=p_turma_id)
    or exists(select 1 from public.presencas where turma_id=p_turma_id)
    or exists(select 1 from public.chamadas_aula where turma_id=p_turma_id)
    or exists(select 1 from public.repasse_itens where turma_id=p_turma_id) then
    raise exception 'A turma possui historico e nao pode ser excluida. Desative a turma';
  end if;
  delete from public.turmas where id=p_turma_id;
end $$;

revoke all on function public.excluir_turma_definitivamente(uuid) from public,anon;
grant execute on function public.excluir_turma_definitivamente(uuid) to authenticated;

commit;
