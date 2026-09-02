begin;

alter table public.cobrancas
  add column if not exists observacao_pagamento text,
  add column if not exists recebido_por uuid references public.usuarios(id) on delete restrict;

create or replace function public.registrar_pagamento_manual(
  p_cobranca_id uuid,
  p_forma_pagamento public.forma_pagamento,
  p_data_pagamento date,
  p_conta_id uuid,
  p_observacao text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cobranca public.cobrancas%rowtype;
  v_recibo_id uuid;
begin
  if public.meu_papel() <> 'gestao'::public.papel_usuario then
    raise exception 'Somente a gestão pode registrar pagamentos';
  end if;

  select * into v_cobranca
  from public.cobrancas
  where id = p_cobranca_id
  for update;

  if not found then raise exception 'Cobrança não encontrada'; end if;
  if v_cobranca.status = 'paga'::public.status_cobranca then
    raise exception 'Esta cobrança já foi paga';
  end if;
  if v_cobranca.status = 'cancelada'::public.status_cobranca then
    raise exception 'Não é possível pagar uma cobrança cancelada';
  end if;
  if p_data_pagamento > current_date then
    raise exception 'A data do pagamento não pode estar no futuro';
  end if;
  if not exists (select 1 from public.contas_financeiras where id = p_conta_id) then
    raise exception 'Conta financeira inválida';
  end if;

  update public.cobrancas
  set status = 'paga',
      forma_pagamento = p_forma_pagamento,
      data_pagamento = p_data_pagamento,
      observacao_pagamento = nullif(trim(p_observacao), ''),
      recebido_por = auth.uid()
  where id = p_cobranca_id;

  insert into public.recibos (cobranca_id)
  values (p_cobranca_id)
  on conflict (cobranca_id) do update set cobranca_id = excluded.cobranca_id
  returning id into v_recibo_id;

  insert into public.fluxo_caixa (
    tipo, descricao, valor, data, conta_id, categoria,
    origem, origem_tipo, origem_id, criado_por
  ) values (
    'entrada', v_cobranca.descricao, v_cobranca.valor,
    p_data_pagamento, p_conta_id, 'Mensalidade',
    'manual', 'cobranca', p_cobranca_id, auth.uid()
  );

  return v_recibo_id;
end;
$$;

revoke all on function public.registrar_pagamento_manual(uuid, public.forma_pagamento, date, uuid, text) from public;
grant execute on function public.registrar_pagamento_manual(uuid, public.forma_pagamento, date, uuid, text) to authenticated;

commit;
