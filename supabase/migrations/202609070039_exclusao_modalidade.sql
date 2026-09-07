begin;

create or replace function public.excluir_modalidade_definitivamente(p_modalidade_id uuid)
returns void language plpgsql security definer set search_path=public as $$
begin
  if public.meu_papel()<>'gestao' then raise exception 'Apenas a gestao pode excluir modalidades'; end if;
  perform 1 from public.modalidades where id=p_modalidade_id for update;
  if not found then raise exception 'Modalidade nao encontrada'; end if;
  if exists(select 1 from public.turmas where modalidade_id=p_modalidade_id) then
    raise exception 'A modalidade possui turmas. Exclua somente modalidades sem historico';
  end if;
  update public.salas set modalidade_padrao_id=null where modalidade_padrao_id=p_modalidade_id;
  delete from public.professor_modalidades where modalidade_id=p_modalidade_id;
  delete from public.modalidades where id=p_modalidade_id;
end $$;

revoke all on function public.excluir_modalidade_definitivamente(uuid) from public,anon;
grant execute on function public.excluir_modalidade_definitivamente(uuid) to authenticated;

commit;
