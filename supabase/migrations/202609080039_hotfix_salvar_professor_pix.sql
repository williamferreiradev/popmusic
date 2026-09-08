begin;

alter table public.professores
  add column if not exists pix_chave text;

create or replace function public.salvar_professor(
  p_id uuid,
  p_nome text,
  p_cpf text,
  p_telefone text,
  p_email text,
  p_comissao_tipo public.tipo_comissao,
  p_comissao_valor numeric,
  p_modalidade_ids uuid[],
  p_pix_chave text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_cpf text := nullif(regexp_replace(coalesce(p_cpf, ''), '\D', '', 'g'), '');
  v_tel text := regexp_replace(coalesce(p_telefone, ''), '\D', '', 'g');
  v_email text := lower(trim(coalesce(p_email, '')));
begin
  if public.meu_papel() <> 'gestao' then
    raise exception 'Apenas a gestao pode salvar professores';
  end if;
  if length(trim(coalesce(p_nome, ''))) < 3 then raise exception 'Nome completo invalido'; end if;
  if v_tel !~ '^\d{10,11}$' then raise exception 'Telefone invalido'; end if;
  if v_email !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' then raise exception 'E-mail invalido'; end if;
  if p_comissao_valor < 0 or (p_comissao_tipo = 'percentual' and p_comissao_valor > 100) then
    raise exception 'Valor de repasse invalido';
  end if;
  if coalesce(array_length(p_modalidade_ids, 1), 0) = 0 then
    raise exception 'Selecione ao menos uma modalidade';
  end if;
  if v_cpf is not null and exists (
    select 1 from public.professores
    where id <> coalesce(p_id, '00000000-0000-0000-0000-000000000000')
      and regexp_replace(coalesce(cpf, ''), '\D', '', 'g') = v_cpf
  ) then raise exception 'Ja existe professor com este CPF'; end if;
  if exists (
    select 1 from public.professores
    where id <> coalesce(p_id, '00000000-0000-0000-0000-000000000000')
      and lower(trim(coalesce(email, ''))) = v_email
  ) then raise exception 'Ja existe professor com este e-mail'; end if;

  if p_id is null then
    insert into public.professores (
      nome, cpf, telefone, email, comissao_padrao_tipo,
      comissao_padrao_valor, pix_chave, ativo
    ) values (
      trim(p_nome), v_cpf, v_tel, v_email, p_comissao_tipo,
      p_comissao_valor, nullif(trim(p_pix_chave), ''), true
    ) returning id into v_id;
  else
    update public.professores set
      nome = trim(p_nome),
      cpf = v_cpf,
      telefone = v_tel,
      email = v_email,
      comissao_padrao_tipo = p_comissao_tipo,
      comissao_padrao_valor = p_comissao_valor,
      pix_chave = nullif(trim(p_pix_chave), '')
    where id = p_id
    returning id into v_id;
    if v_id is null then raise exception 'Professor nao encontrado'; end if;
  end if;

  delete from public.professor_modalidades where professor_id = v_id;
  insert into public.professor_modalidades (professor_id, modalidade_id)
  select v_id, modalidade_id from unnest(p_modalidade_ids) as modalidade_id;
  return v_id;
end;
$$;

revoke all on function public.salvar_professor(uuid,text,text,text,text,public.tipo_comissao,numeric,uuid[],text) from public, anon;
grant execute on function public.salvar_professor(uuid,text,text,text,text,public.tipo_comissao,numeric,uuid[],text) to authenticated;

commit;

notify pgrst, 'reload schema';
