-- Pop Music - controle persistente de tentativas do endpoint publico de assinatura.
begin;

create table if not exists public.tentativas_assinatura (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null,
  ip_hash text not null,
  criada_em timestamptz not null default now(),
  sucesso boolean not null default false
);

alter table public.tentativas_assinatura enable row level security;
revoke all on table public.tentativas_assinatura from public, anon, authenticated;
grant all on table public.tentativas_assinatura to service_role;

create index if not exists idx_tentativas_assinatura_token_data
  on public.tentativas_assinatura (token_hash, criada_em desc);
create index if not exists idx_tentativas_assinatura_ip_data
  on public.tentativas_assinatura (ip_hash, criada_em desc);

comment on table public.tentativas_assinatura is
  'Hashes irreversiveis usados apenas para limitar abuso; nao guarda token ou IP em texto puro.';

commit;
