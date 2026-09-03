-- Resumo do fluxo de caixa por conta, preparado para listagem paginada.
begin;

create or replace function public.resumo_fluxo_caixa(p_conta_id uuid default null)
returns table (entradas numeric, saidas numeric, saldo numeric)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if public.meu_papel() <> 'gestao'::public.papel_usuario then
    raise exception 'Apenas a gestão pode consultar o resumo do fluxo de caixa';
  end if;

  if p_conta_id is not null and not exists (
    select 1 from public.contas_financeiras where id = p_conta_id
  ) then raise exception 'Conta financeira inválida'; end if;

  return query
  with movimento as (
    select
      coalesce(sum(f.valor) filter (where f.tipo = 'entrada'::public.tipo_lancamento_caixa), 0) as entradas,
      coalesce(sum(f.valor) filter (where f.tipo = 'saida'::public.tipo_lancamento_caixa), 0) as saidas
    from public.fluxo_caixa f
    where p_conta_id is null or f.conta_id = p_conta_id
  ), inicial as (
    select coalesce(sum(c.saldo_inicial), 0) as valor
    from public.contas_financeiras c
    where c.ativo = true and (p_conta_id is null or c.id = p_conta_id)
  )
  select m.entradas, m.saidas, i.valor + m.entradas - m.saidas
  from movimento m cross join inicial i;
end;
$$;

revoke all on function public.resumo_fluxo_caixa(uuid) from public, anon;
grant execute on function public.resumo_fluxo_caixa(uuid) to authenticated;

commit;
