-- Totais de cobranças calculados no banco para permitir paginação da lista.
begin;

create or replace function public.resumo_cobrancas()
returns table (a_receber numeric, recebido numeric, atrasado numeric)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if public.meu_papel() <> 'gestao'::public.papel_usuario then
    raise exception 'Apenas a gestão pode consultar o resumo de cobranças';
  end if;

  return query
  select
    coalesce(sum(c.valor) filter (
      where c.status in ('pendente'::public.status_cobranca, 'atrasada'::public.status_cobranca)
    ), 0) as a_receber,
    coalesce(sum(c.valor) filter (
      where c.status = 'paga'::public.status_cobranca
        and c.data_pagamento >= date_trunc('month', current_date)::date
        and c.data_pagamento < (date_trunc('month', current_date) + interval '1 month')::date
    ), 0) as recebido,
    coalesce(sum(c.valor) filter (
      where c.status = 'atrasada'::public.status_cobranca
         or (c.status = 'pendente'::public.status_cobranca and c.vencimento < current_date)
    ), 0) as atrasado
  from public.cobrancas c;
end;
$$;

revoke all on function public.resumo_cobrancas() from public, anon;
grant execute on function public.resumo_cobrancas() to authenticated;

commit;
