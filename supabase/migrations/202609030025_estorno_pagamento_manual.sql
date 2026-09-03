-- Estorno manual transacional, preservando recibo e trilha de auditoria.
begin;

create table if not exists public.estornos_pagamento (
  id uuid primary key default gen_random_uuid(),
  cobranca_id uuid not null unique references public.cobrancas(id) on delete restrict,
  recibo_id uuid not null references public.recibos(id) on delete restrict,
  fluxo_caixa_original_id uuid not null references public.fluxo_caixa(id) on delete restrict,
  fluxo_caixa_estorno_id uuid not null unique references public.fluxo_caixa(id) on delete restrict,
  conta_id uuid not null references public.contas_financeiras(id) on delete restrict,
  valor numeric(12,2) not null check (valor > 0),
  data_estorno date not null,
  motivo text not null check (length(btrim(motivo)) >= 5),
  criado_por uuid not null references public.usuarios(id) on delete restrict,
  criado_em timestamptz not null default now()
);

create index if not exists idx_estornos_pagamento_data
  on public.estornos_pagamento(data_estorno desc);

alter table public.estornos_pagamento enable row level security;
revoke insert, update, delete, truncate on public.estornos_pagamento from anon, authenticated;

drop policy if exists "gestao_le_estornos_pagamento" on public.estornos_pagamento;
create policy "gestao_le_estornos_pagamento"
on public.estornos_pagamento for select to authenticated
using (public.meu_papel() = 'gestao'::public.papel_usuario);

create or replace function public.estornar_pagamento_manual(
  p_cobranca_id uuid,
  p_conta_id uuid,
  p_data_estorno date,
  p_motivo text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cobranca public.cobrancas%rowtype;
  v_recibo_id uuid;
  v_fluxo_original_id uuid;
  v_fluxo_estorno_id uuid;
  v_estorno_id uuid;
  v_motivo text := btrim(coalesce(p_motivo, ''));
begin
  if public.meu_papel() <> 'gestao'::public.papel_usuario then
    raise exception 'Somente a gestão pode estornar pagamentos';
  end if;
  if length(v_motivo) < 5 then
    raise exception 'Informe um motivo de estorno com pelo menos 5 caracteres';
  end if;
  if p_data_estorno is null or p_data_estorno > current_date then
    raise exception 'A data do estorno é inválida ou está no futuro';
  end if;
  if not exists (
    select 1 from public.contas_financeiras
    where id = p_conta_id and ativo = true
  ) then
    raise exception 'Conta financeira inválida ou inativa';
  end if;

  select * into v_cobranca
  from public.cobrancas
  where id = p_cobranca_id
  for update;

  if not found then raise exception 'Cobrança não encontrada'; end if;
  if v_cobranca.status <> 'paga'::public.status_cobranca then
    raise exception 'Somente uma cobrança paga pode ser estornada';
  end if;
  if exists (select 1 from public.estornos_pagamento where cobranca_id = p_cobranca_id) then
    raise exception 'Esta cobrança já possui estorno';
  end if;

  select id into v_recibo_id
  from public.recibos
  where cobranca_id = p_cobranca_id
  for update;
  if not found then raise exception 'O recibo original da cobrança não foi encontrado'; end if;

  select id into v_fluxo_original_id
  from public.fluxo_caixa
  where origem_tipo = 'cobranca'
    and origem_id = p_cobranca_id
    and tipo = 'entrada'
  order by criado_em desc
  limit 1
  for update;
  if not found then raise exception 'A entrada original no caixa não foi encontrada'; end if;

  insert into public.fluxo_caixa (
    tipo, descricao, valor, data, conta_id, categoria,
    origem, origem_tipo, origem_id, criado_por
  ) values (
    'saida', 'Estorno - ' || coalesce(v_cobranca.descricao, 'Cobrança'),
    v_cobranca.valor, p_data_estorno, p_conta_id, 'Estorno',
    'manual', 'estorno_cobranca', p_cobranca_id, auth.uid()
  ) returning id into v_fluxo_estorno_id;

  insert into public.estornos_pagamento (
    cobranca_id, recibo_id, fluxo_caixa_original_id, fluxo_caixa_estorno_id,
    conta_id, valor, data_estorno, motivo, criado_por
  ) values (
    p_cobranca_id, v_recibo_id, v_fluxo_original_id, v_fluxo_estorno_id,
    p_conta_id, v_cobranca.valor, p_data_estorno, v_motivo, auth.uid()
  ) returning id into v_estorno_id;

  update public.cobrancas
  set status = 'cancelada'::public.status_cobranca,
      motivo_cancelamento = 'Estorno: ' || v_motivo
  where id = p_cobranca_id;

  return v_estorno_id;
end;
$$;

revoke all on function public.estornar_pagamento_manual(uuid, uuid, date, text) from public;
grant execute on function public.estornar_pagamento_manual(uuid, uuid, date, text) to authenticated;

drop trigger if exists trg_auditoria_automatica on public.estornos_pagamento;
create trigger trg_auditoria_automatica
after insert or update or delete on public.estornos_pagamento
for each row execute function public.registrar_auditoria_automatica();

commit;
