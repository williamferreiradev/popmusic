-- Aceite do contrato e geracao das mensalidades na mesma transacao.
begin;

create or replace function public.assinar_contrato(
  p_token text,
  p_foto_path text,
  p_ip text default null,
  p_user_agent text default null
) returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_contrato public.contratos%rowtype;
  v_hash text := encode(gen_random_bytes(32),'hex');
  v_aceite timestamptz := clock_timestamp();
  v_inicio date := current_date;
  v_fim date := (current_date + interval '1 year')::date;
begin
  if coalesce(length(trim(p_token)),0) < 32 then raise exception 'Token invalido'; end if;
  if coalesce(length(trim(p_foto_path)),0) = 0 then raise exception 'Foto da assinatura obrigatoria'; end if;

  select * into v_contrato from public.contratos where token=p_token for update;
  if not found then raise exception 'Contrato nao encontrado'; end if;
  if v_contrato.status='aceito' then raise exception 'Contrato ja assinado'; end if;
  if v_contrato.status='cancelado' then raise exception 'Contrato cancelado'; end if;
  if v_contrato.status='expirado' or v_contrato.token_expira_em < now() then
    if v_contrato.status <> 'expirado' then update public.contratos set status='expirado' where id=v_contrato.id; end if;
    raise exception 'Link de assinatura expirado';
  end if;
  if v_contrato.status <> 'aguardando_assinatura' then raise exception 'Contrato indisponivel para assinatura'; end if;

  update public.contratos set
    status='aceito', data_aceite=v_aceite, data_inicio_vigencia=v_inicio,
    data_fim_vigencia=v_fim, foto_assinatura_url=trim(p_foto_path),
    aceite_hash=v_hash,
    aceite_ip=case when nullif(trim(coalesce(p_ip,'')),'') is null then null else p_ip::inet end,
    aceite_user_agent=left(coalesce(p_user_agent,'Nao informado'),500)
  where id=v_contrato.id;

  insert into public.cobrancas(aluno_id,contrato_id,descricao,valor,vencimento,status)
  select v_contrato.aluno_id, v_contrato.id,
    format('Mensalidade %s/12',g.n), v_contrato.valor_mensalidade,
    make_date(extract(year from (v_inicio + ((g.n-1)||' month')::interval))::integer,
              extract(month from (v_inicio + ((g.n-1)||' month')::interval))::integer,
              v_contrato.dia_vencimento), 'pendente'
  from generate_series(1,12) g(n)
  on conflict (contrato_id,vencimento) where contrato_id is not null do nothing;

  if (select count(*) from public.cobrancas where contrato_id=v_contrato.id) <> 12 then
    raise exception 'Nao foi possivel garantir as 12 mensalidades do contrato';
  end if;

  return jsonb_build_object('contrato_id',v_contrato.id,'aluno_id',v_contrato.aluno_id,
    'status','aceito','data_aceite',v_aceite,'aceite_hash',v_hash,
    'data_inicio_vigencia',v_inicio,'data_fim_vigencia',v_fim,'foto_assinatura_url',trim(p_foto_path));
end $$;

revoke all on function public.assinar_contrato(text,text,text,text) from public, anon, authenticated;
grant execute on function public.assinar_contrato(text,text,text,text) to service_role;
commit;
