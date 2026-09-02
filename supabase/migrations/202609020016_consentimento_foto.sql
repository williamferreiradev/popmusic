-- Registra o consentimento da foto junto da transacao de assinatura.
begin;

alter table public.alunos
  add column if not exists consentimento_foto_em timestamptz;

create or replace function public.assinar_contrato_com_consentimento(
  p_token text,
  p_foto_path text,
  p_ip text default null,
  p_user_agent text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_resultado jsonb;
  v_aluno_id uuid;
begin
  v_resultado := public.assinar_contrato(p_token, p_foto_path, p_ip, p_user_agent);
  v_aluno_id := (v_resultado ->> 'aluno_id')::uuid;
  update public.alunos
     set cessao_imagem_aceita = true,
         consentimento_foto_em = clock_timestamp()
   where id = v_aluno_id;
  if not found then raise exception 'Aluno nao encontrado'; end if;
  return v_resultado;
end $$;

revoke all on function public.assinar_contrato_com_consentimento(text,text,text,text) from public, anon, authenticated;
grant execute on function public.assinar_contrato_com_consentimento(text,text,text,text) to service_role;

commit;
