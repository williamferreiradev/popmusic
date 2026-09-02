-- Cadastro atomico e ativacao segura de professores.
begin;

create or replace function public.salvar_professor(
  p_id uuid, p_nome text, p_cpf text, p_telefone text, p_email text,
  p_comissao_tipo public.tipo_comissao, p_comissao_valor numeric, p_modalidade_ids uuid[]
) returns uuid language plpgsql security definer set search_path=public as $$
declare
  v_id uuid; v_cpf text:=regexp_replace(coalesce(p_cpf,''),'\D','','g');
  v_tel text:=regexp_replace(coalesce(p_telefone,''),'\D','','g');
  v_email text:=lower(trim(coalesce(p_email,'')));
begin
  if public.meu_papel()<>'gestao' then raise exception 'Apenas a gestao pode salvar professores'; end if;
  if length(trim(coalesce(p_nome,'')))<3 then raise exception 'Nome completo invalido'; end if;
  if not public.cpf_valido(v_cpf) then raise exception 'CPF invalido'; end if;
  if v_tel !~ '^\d{10,11}$' then raise exception 'Telefone invalido'; end if;
  if v_email !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' then raise exception 'E-mail invalido'; end if;
  if p_comissao_valor<0 or (p_comissao_tipo='percentual' and p_comissao_valor>100) then raise exception 'Valor de repasse invalido'; end if;
  if coalesce(array_length(p_modalidade_ids,1),0)=0 then raise exception 'Selecione ao menos uma modalidade'; end if;
  if (select count(*) from unnest(p_modalidade_ids)x)<>(select count(distinct x) from unnest(p_modalidade_ids)x) then raise exception 'Modalidade repetida'; end if;
  if exists(select 1 from unnest(p_modalidade_ids)x left join public.modalidades m on m.id=x where m.id is null or not m.ativo) then raise exception 'Modalidade inexistente ou inativa'; end if;

  perform pg_advisory_xact_lock(hashtextextended('prof-cpf:'||v_cpf,0));
  perform pg_advisory_xact_lock(hashtextextended('prof-email:'||v_email,0));
  if exists(select 1 from public.professores where id<>coalesce(p_id,'00000000-0000-0000-0000-000000000000') and regexp_replace(coalesce(cpf,''),'\D','','g')=v_cpf) then raise exception 'Ja existe professor com este CPF'; end if;
  if exists(select 1 from public.professores where id<>coalesce(p_id,'00000000-0000-0000-0000-000000000000') and lower(trim(coalesce(email,'')))=v_email) then raise exception 'Ja existe professor com este e-mail'; end if;

  if p_id is null then
    insert into public.professores(nome,cpf,telefone,email,comissao_padrao_tipo,comissao_padrao_valor,ativo)
    values(trim(p_nome),v_cpf,v_tel,v_email,p_comissao_tipo,p_comissao_valor,true) returning id into v_id;
  else
    update public.professores set nome=trim(p_nome),cpf=v_cpf,telefone=v_tel,email=v_email,
      comissao_padrao_tipo=p_comissao_tipo,comissao_padrao_valor=p_comissao_valor where id=p_id returning id into v_id;
    if v_id is null then raise exception 'Professor nao encontrado'; end if;
  end if;

  delete from public.professor_modalidades where professor_id=v_id;
  insert into public.professor_modalidades(professor_id,modalidade_id) select v_id,x from unnest(p_modalidade_ids)x;
  return v_id;
end $$;

create or replace function public.alterar_status_professor(p_professor_id uuid,p_ativo boolean)
returns void language plpgsql security definer set search_path=public as $$
declare v_usuario_id uuid;
begin
  if public.meu_papel()<>'gestao' then raise exception 'Apenas a gestao pode alterar professores'; end if;
  if not p_ativo and exists(select 1 from public.turmas where professor_id=p_professor_id and ativo) then
    raise exception 'O professor possui turma ativa. Realoque ou desative as turmas primeiro';
  end if;
  update public.professores set ativo=p_ativo where id=p_professor_id returning usuario_id into v_usuario_id;
  if not found then raise exception 'Professor nao encontrado'; end if;
  if v_usuario_id is not null then update public.usuarios set ativo=p_ativo where id=v_usuario_id; end if;
end $$;

revoke all on function public.salvar_professor(uuid,text,text,text,text,public.tipo_comissao,numeric,uuid[]) from public,anon;
revoke all on function public.alterar_status_professor(uuid,boolean) from public,anon;
grant execute on function public.salvar_professor(uuid,text,text,text,text,public.tipo_comissao,numeric,uuid[]) to authenticated;
grant execute on function public.alterar_status_professor(uuid,boolean) to authenticated;
commit;
