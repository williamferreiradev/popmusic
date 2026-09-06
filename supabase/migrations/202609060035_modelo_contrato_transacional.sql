begin;

create or replace function public.salvar_modelo_contrato(p_texto text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
  v_versao integer;
begin
  if public.meu_papel() <> 'gestao'::public.papel_usuario then
    raise exception 'Apenas a gestao pode salvar modelos de contrato';
  end if;
  if length(trim(coalesce(p_texto, ''))) < 100 then
    raise exception 'O modelo de contrato precisa ter pelo menos 100 caracteres';
  end if;
  lock table public.modelos_contrato in share row exclusive mode;
  select coalesce(max(versao), 0) + 1 into v_versao from public.modelos_contrato;
  insert into public.modelos_contrato (texto, versao, ativo)
  values (trim(p_texto), v_versao, true) returning id into v_id;
  update public.modelos_contrato set ativo = false where ativo and id <> v_id;
  return v_id;
end;
$$;

revoke all on function public.salvar_modelo_contrato(text) from public, anon;
grant execute on function public.salvar_modelo_contrato(text) to authenticated;

commit;
