-- Alteração segura da equipe administrativa: preserva histórico e evita lockout.
begin;

create or replace function public.alterar_acesso_gestao(p_usuario_id uuid, p_nome text, p_ativo boolean)
returns void language plpgsql security definer set search_path=public as $$
declare v_papel public.papel_usuario; v_ativo_atual boolean;
begin
  if public.meu_papel() <> 'gestao'::public.papel_usuario then raise exception 'Apenas a gestao pode alterar acessos'; end if;
  if length(trim(coalesce(p_nome,''))) < 3 then raise exception 'Nome invalido'; end if;
  select papel,ativo into v_papel,v_ativo_atual from public.usuarios where id=p_usuario_id for update;
  if not found or v_papel <> 'gestao'::public.papel_usuario then raise exception 'Usuario de gestao nao encontrado'; end if;
  if not p_ativo and p_usuario_id=auth.uid() then raise exception 'Voce nao pode desativar o proprio acesso'; end if;
  if not p_ativo and v_ativo_atual and (select count(*) from public.usuarios where papel='gestao' and ativo)=1 then
    raise exception 'Nao e possivel desativar o ultimo usuario ativo da gestao';
  end if;
  update public.usuarios set nome=trim(p_nome),ativo=p_ativo where id=p_usuario_id;
end $$;

revoke all on function public.alterar_acesso_gestao(uuid,text,boolean) from public,anon;
grant execute on function public.alterar_acesso_gestao(uuid,text,boolean) to authenticated;
commit;
