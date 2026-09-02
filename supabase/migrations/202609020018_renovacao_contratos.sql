-- Renovacao e reenvio de contrato com token criptografico e historico preservado.
alter type public.status_contrato add value if not exists 'renovado';

begin;

create or replace function public.renovar_contrato(
  p_contrato_id uuid,
  p_valor_mensalidade numeric,
  p_dia_vencimento integer
) returns jsonb
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_anterior public.contratos%rowtype;
  v_novo public.contratos%rowtype;
  v_aluno public.alunos%rowtype;
  v_texto text;
begin
  if public.meu_papel() <> 'gestao'::public.papel_usuario then raise exception 'Acesso negado'; end if;
  if p_valor_mensalidade is null or p_valor_mensalidade <= 0 then raise exception 'Valor da mensalidade invalido'; end if;
  if p_dia_vencimento not between 1 and 28 then raise exception 'Dia de vencimento deve estar entre 1 e 28'; end if;

  select * into v_anterior from public.contratos where id = p_contrato_id for update;
  if not found then raise exception 'Contrato anterior nao encontrado'; end if;
  if v_anterior.status <> 'aceito' then raise exception 'Somente contrato aceito pode ser renovado'; end if;
  if exists (
    select 1 from public.contratos
    where contrato_anterior_id = v_anterior.id and status in ('aguardando_assinatura','aceito')
  ) then raise exception 'Ja existe renovacao ativa para este contrato'; end if;

  select * into v_aluno from public.alunos where id = v_anterior.aluno_id;
  select mc.texto into v_texto from public.modelos_contrato mc where mc.ativo order by mc.versao desc limit 1;

  insert into public.contratos (
    aluno_id, modelo_contrato_id, texto_gerado, status, token, token_expira_em,
    valor_mensalidade, dia_vencimento, data_envio, contrato_anterior_id
  ) values (
    v_anterior.aluno_id, null, coalesce(v_texto, v_anterior.texto_gerado),
    'aguardando_assinatura', encode(gen_random_bytes(32),'hex'), now() + interval '7 days',
    p_valor_mensalidade, p_dia_vencimento, now(), v_anterior.id
  ) returning * into v_novo;

  return jsonb_build_object(
    'contrato_id', v_novo.id, 'contrato_anterior_id', v_anterior.id,
    'token', v_novo.token, 'token_expira_em', v_novo.token_expira_em,
    'aluno_nome', v_aluno.nome, 'aluno_email', v_aluno.email,
    'responsavel_nome', v_aluno.responsavel_nome, 'responsavel_email', v_aluno.responsavel_email,
    'valor_mensalidade', v_novo.valor_mensalidade, 'dia_vencimento', v_novo.dia_vencimento
  );
end $$;

create or replace function public.regenerar_token_contrato(p_contrato_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_contrato public.contratos%rowtype;
  v_aluno public.alunos%rowtype;
begin
  if public.meu_papel() <> 'gestao'::public.papel_usuario then raise exception 'Acesso negado'; end if;
  select * into v_contrato from public.contratos where id = p_contrato_id for update;
  if not found then raise exception 'Contrato nao encontrado'; end if;
  if v_contrato.status not in ('aguardando_assinatura','expirado') then raise exception 'Contrato nao permite reenvio'; end if;

  update public.contratos set
    token = encode(gen_random_bytes(32),'hex'), token_expira_em = now() + interval '7 days',
    data_envio = now(), status = 'aguardando_assinatura'
  where id = v_contrato.id returning * into v_contrato;
  select * into v_aluno from public.alunos where id = v_contrato.aluno_id;

  return jsonb_build_object(
    'contrato_id', v_contrato.id, 'token', v_contrato.token,
    'token_expira_em', v_contrato.token_expira_em, 'aluno_nome', v_aluno.nome,
    'aluno_email', v_aluno.email, 'responsavel_nome', v_aluno.responsavel_nome,
    'responsavel_email', v_aluno.responsavel_email, 'valor_mensalidade', v_contrato.valor_mensalidade,
    'dia_vencimento', v_contrato.dia_vencimento
  );
end $$;

create or replace function public.marcar_contrato_anterior_renovado()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.status = 'aceito' and old.status is distinct from new.status and new.contrato_anterior_id is not null then
    update public.contratos
       set status = 'renovado'
     where id = new.contrato_anterior_id and status = 'aceito';
  end if;
  return new;
end $$;

drop trigger if exists trg_marcar_contrato_anterior_renovado on public.contratos;
create trigger trg_marcar_contrato_anterior_renovado
after update of status on public.contratos
for each row execute function public.marcar_contrato_anterior_renovado();

revoke all on function public.renovar_contrato(uuid,numeric,integer) from public, anon;
revoke all on function public.regenerar_token_contrato(uuid) from public, anon;
grant execute on function public.renovar_contrato(uuid,numeric,integer) to authenticated;
grant execute on function public.regenerar_token_contrato(uuid) to authenticated;

commit;
