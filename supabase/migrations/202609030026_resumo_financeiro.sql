-- Totais financeiros calculados no banco, sem depender de listas no navegador.
begin;

create or replace function public.obter_resumo_financeiro(p_referencia date default current_date)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v_inicio date := date_trunc('month', p_referencia)::date;
  v_fim date := (date_trunc('month', p_referencia) + interval '1 month')::date;
begin
  if public.meu_papel() <> 'gestao'::public.papel_usuario then
    raise exception 'Somente a gestão pode consultar o resumo financeiro';
  end if;
  return jsonb_build_object(
    'a_receber_mes', coalesce((select sum(valor) from public.cobrancas where vencimento >= v_inicio and vencimento < v_fim and status in ('pendente'::public.status_cobranca, 'atrasada'::public.status_cobranca)), 0),
    'recebido_mes', coalesce((select sum(case when tipo = 'entrada' then valor else -valor end) from public.fluxo_caixa where data >= v_inicio and data < v_fim and origem_tipo in ('cobranca', 'estorno_cobranca')), 0),
    'em_atraso', coalesce((select sum(valor) from public.cobrancas where vencimento < p_referencia and status in ('pendente'::public.status_cobranca, 'atrasada'::public.status_cobranca)), 0),
    'saldo_caixa', coalesce((select sum(saldo_inicial) from public.contas_financeiras), 0) + coalesce((select sum(case when tipo = 'entrada' then valor else -valor end) from public.fluxo_caixa), 0),
    'referencia', p_referencia
  );
end;
$$;

revoke all on function public.obter_resumo_financeiro(date) from public;
grant execute on function public.obter_resumo_financeiro(date) to authenticated;
commit;
