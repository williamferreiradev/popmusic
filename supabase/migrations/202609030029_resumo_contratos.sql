-- Resumo global de contratos sem carregar todos os documentos no navegador.
begin;

create or replace function public.resumo_contratos()
returns table (
  aguardando bigint,
  aceitos_mes bigint,
  vencendo bigint,
  total bigint,
  total_aceitos bigint,
  taxa_aceite numeric
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if public.meu_papel() <> 'gestao'::public.papel_usuario then
    raise exception 'Apenas a gestão pode consultar o resumo de contratos';
  end if;

  return query
  with totais as (
    select
      count(*) filter (
        where c.status = 'aguardando_assinatura'::public.status_contrato
          and (c.token_expira_em is null or c.token_expira_em >= now())
      ) as aguardando,
      count(*) filter (
        where c.status = 'aceito'::public.status_contrato
          and c.data_aceite >= date_trunc('month', current_date)
          and c.data_aceite < date_trunc('month', current_date) + interval '1 month'
      ) as aceitos_mes,
      count(*) filter (
        where c.status = 'aceito'::public.status_contrato
          and c.data_fim_vigencia >= current_date
          and c.data_fim_vigencia <= current_date + 30
      ) as vencendo,
      count(*) as total,
      count(*) filter (where c.status = 'aceito'::public.status_contrato) as total_aceitos
    from public.contratos c
  )
  select
    t.aguardando,
    t.aceitos_mes,
    t.vencendo,
    t.total,
    t.total_aceitos,
    case when t.total = 0 then 0
      else round(t.total_aceitos::numeric * 100 / t.total, 2)
    end
  from totais t;
end;
$$;

revoke all on function public.resumo_contratos() from public, anon;
grant execute on function public.resumo_contratos() to authenticated;

commit;
