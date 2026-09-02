-- CRUD seguro e reversivel de modalidades e salas.
begin;

do $$
begin
  if exists(select 1 from public.modalidades group by lower(btrim(nome)) having count(*)>1) then
    raise exception 'Existem modalidades com nomes duplicados. Corrija-as antes de aplicar a migracao 021';
  end if;
  if exists(select 1 from public.salas group by lower(btrim(nome)) having count(*)>1) then
    raise exception 'Existem salas com nomes duplicados. Corrija-as antes de aplicar a migracao 021';
  end if;
end $$;

create unique index if not exists modalidades_nome_unico on public.modalidades(lower(btrim(nome)));
create unique index if not exists salas_nome_unico on public.salas(lower(btrim(nome)));

create or replace function public.salvar_modalidade(p_id uuid,p_nome text,p_valor numeric,p_cor text)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_id uuid; v_nome text:=btrim(coalesce(p_nome,''));
begin
  if public.meu_papel()<>'gestao' then raise exception 'Apenas a gestao pode salvar modalidades'; end if;
  if length(v_nome)<2 then raise exception 'Nome da modalidade invalido'; end if;
  if p_valor is null or p_valor<0 then raise exception 'Valor da mensalidade invalido'; end if;
  if coalesce(p_cor,'') !~ '^#[0-9A-Fa-f]{6}$' then raise exception 'Cor invalida'; end if;
  perform pg_advisory_xact_lock(hashtextextended('modalidade:'||lower(v_nome),0));
  if p_id is null then
    insert into public.modalidades(nome,valor_padrao_mensalidade,cor_calendario,ativo)
    values(v_nome,p_valor,upper(p_cor),true) returning id into v_id;
  else
    update public.modalidades set nome=v_nome,valor_padrao_mensalidade=p_valor,cor_calendario=upper(p_cor)
    where id=p_id returning id into v_id;
    if v_id is null then raise exception 'Modalidade nao encontrada'; end if;
  end if;
  return v_id;
exception when unique_violation then raise exception 'Ja existe uma modalidade com este nome';
end $$;

create or replace function public.alterar_status_modalidade(p_modalidade_id uuid,p_ativo boolean)
returns void language plpgsql security definer set search_path=public as $$
begin
  if public.meu_papel()<>'gestao' then raise exception 'Apenas a gestao pode alterar modalidades'; end if;
  perform 1 from public.modalidades where id=p_modalidade_id for update;
  if not found then raise exception 'Modalidade nao encontrada'; end if;
  if not p_ativo and exists(select 1 from public.turmas where modalidade_id=p_modalidade_id and ativo) then
    raise exception 'A modalidade possui turma ativa. Desative ou altere a turma primeiro';
  end if;
  update public.modalidades set ativo=p_ativo where id=p_modalidade_id;
end $$;

create or replace function public.salvar_sala(p_id uuid,p_nome text,p_capacidade integer,p_modalidade_id uuid)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_id uuid; v_nome text:=btrim(coalesce(p_nome,''));
begin
  if public.meu_papel()<>'gestao' then raise exception 'Apenas a gestao pode salvar salas'; end if;
  if length(v_nome)<2 then raise exception 'Nome da sala invalido'; end if;
  if p_capacidade is null or p_capacidade<=0 then raise exception 'A capacidade deve ser maior que zero'; end if;
  if p_modalidade_id is not null and not exists(select 1 from public.modalidades where id=p_modalidade_id and ativo) then
    raise exception 'Modalidade padrao inexistente ou inativa';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('sala-nome:'||lower(v_nome),0));
  if p_id is null then
    insert into public.salas(nome,capacidade_padrao,modalidade_padrao_id,ativo)
    values(v_nome,p_capacidade,p_modalidade_id,true) returning id into v_id;
  else
    perform 1 from public.salas where id=p_id for update;
    if not found then raise exception 'Sala nao encontrada'; end if;
    if exists(select 1 from public.turmas where sala_id=p_id and ativo and capacidade_maxima>p_capacidade) then
      raise exception 'A capacidade e menor que a capacidade de uma turma ativa desta sala';
    end if;
    update public.salas set nome=v_nome,capacidade_padrao=p_capacidade,modalidade_padrao_id=p_modalidade_id
    where id=p_id returning id into v_id;
  end if;
  return v_id;
exception when unique_violation then raise exception 'Ja existe uma sala com este nome';
end $$;

create or replace function public.alterar_status_sala(p_sala_id uuid,p_ativo boolean)
returns void language plpgsql security definer set search_path=public as $$
begin
  if public.meu_papel()<>'gestao' then raise exception 'Apenas a gestao pode alterar salas'; end if;
  perform 1 from public.salas where id=p_sala_id for update;
  if not found then raise exception 'Sala nao encontrada'; end if;
  if not p_ativo and exists(select 1 from public.turmas where sala_id=p_sala_id and ativo) then
    raise exception 'A sala possui turma ativa. Desative ou realoque a turma primeiro';
  end if;
  update public.salas set ativo=p_ativo where id=p_sala_id;
end $$;

revoke all on function public.salvar_modalidade(uuid,text,numeric,text) from public,anon;
revoke all on function public.alterar_status_modalidade(uuid,boolean) from public,anon;
revoke all on function public.salvar_sala(uuid,text,integer,uuid) from public,anon;
revoke all on function public.alterar_status_sala(uuid,boolean) from public,anon;
grant execute on function public.salvar_modalidade(uuid,text,numeric,text) to authenticated;
grant execute on function public.alterar_status_modalidade(uuid,boolean) to authenticated;
grant execute on function public.salvar_sala(uuid,text,integer,uuid) to authenticated;
grant execute on function public.alterar_status_sala(uuid,boolean) to authenticated;
commit;
