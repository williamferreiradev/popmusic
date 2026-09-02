-- Registro operacional de envios sem armazenar o destinatario completo.
begin;

create table if not exists public.comunicacoes (
  id uuid primary key default gen_random_uuid(),
  canal text not null check(canal in ('email','whatsapp')),
  tipo text not null,
  destinatario_mascarado text not null,
  destinatario_hash text not null,
  provedor text not null,
  status text not null check(status in ('processando','enviado','falhou')),
  referencia_id uuid,
  provedor_mensagem_id text,
  erro_codigo text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

alter table public.comunicacoes enable row level security;
revoke insert,update,delete,truncate on public.comunicacoes from anon,authenticated;
drop policy if exists "gestao_le_comunicacoes" on public.comunicacoes;
create policy "gestao_le_comunicacoes" on public.comunicacoes for select to authenticated
using(public.meu_papel()='gestao');
create index if not exists idx_comunicacoes_data on public.comunicacoes(criado_em desc);
create index if not exists idx_comunicacoes_status on public.comunicacoes(status,criado_em desc);
create index if not exists idx_comunicacoes_destino on public.comunicacoes(destinatario_hash,criado_em desc);
commit;
