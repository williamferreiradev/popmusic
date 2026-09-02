-- Cadastro de aluno, matriculas e contrato em uma unica transacao.
begin;
create extension if not exists pgcrypto;

create or replace function public.cpf_valido(p_cpf text) returns boolean
language plpgsql immutable strict as $$
declare
  c text := regexp_replace(p_cpf,'\D','','g'); s integer; i integer; d1 integer; d2 integer;
begin
  if c !~ '^\d{11}$' or c ~ '^(\d)\1{10}$' then return false; end if;
  s := 0; for i in 1..9 loop s := s + substring(c,i,1)::integer * (11-i); end loop;
  d1 := case when (s * 10) % 11 = 10 then 0 else (s * 10) % 11 end;
  s := 0; for i in 1..10 loop s := s + substring(c,i,1)::integer * (12-i); end loop;
  d2 := case when (s * 10) % 11 = 10 then 0 else (s * 10) % 11 end;
  return d1=substring(c,10,1)::integer and d2=substring(c,11,1)::integer;
end $$;

create or replace function public.criar_matricula_com_contrato(
  p_nome text, p_cpf text, p_data_nascimento date, p_telefone text, p_email text,
  p_turma_ids uuid[], p_responsavel_nome text default null,
  p_responsavel_cpf text default null, p_responsavel_telefone text default null,
  p_texto_contrato text default null, p_dia_vencimento integer default 10
) returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  v_aluno public.alunos%rowtype; v_turma public.turmas%rowtype;
  v_turma_id uuid; v_contrato_id uuid; v_ocupacao integer; v_idade integer;
  v_valor numeric(12,2) := 0; v_token text;
  v_cpf text := regexp_replace(coalesce(p_cpf,''), '\D','','g');
  v_resp_cpf text := regexp_replace(coalesce(p_responsavel_cpf,''), '\D','','g');
  v_tel text := regexp_replace(coalesce(p_telefone,''), '\D','','g');
  v_resp_tel text := regexp_replace(coalesce(p_responsavel_telefone,''), '\D','','g');
begin
  if public.meu_papel() <> 'gestao' then raise exception 'Apenas a gestao pode criar matriculas'; end if;
  if length(trim(coalesce(p_nome,''))) < 3 then raise exception 'Nome completo invalido'; end if;
  if not public.cpf_valido(v_cpf) then raise exception 'CPF invalido'; end if;
  if p_data_nascimento is null or p_data_nascimento > current_date then raise exception 'Data de nascimento invalida'; end if;
  if v_tel !~ '^\d{10,11}$' then raise exception 'Telefone invalido'; end if;
  if coalesce(trim(p_email),'') !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' then raise exception 'E-mail invalido'; end if;
  if coalesce(array_length(p_turma_ids,1),0) = 0 then raise exception 'Selecione ao menos uma turma'; end if;
  if (select count(*) from unnest(p_turma_ids) x) <> (select count(distinct x) from unnest(p_turma_ids) x) then raise exception 'Turma repetida'; end if;

  v_idade := extract(year from age(current_date,p_data_nascimento));
  if v_idade < 18 and (length(trim(coalesce(p_responsavel_nome,''))) < 3 or not public.cpf_valido(v_resp_cpf) or v_resp_tel !~ '^\d{10,11}$') then
    raise exception 'Dados completos do responsavel sao obrigatorios para menor';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_cpf,0));
  if exists (select 1 from public.alunos a where regexp_replace(coalesce(a.cpf,''),'\D','','g')=v_cpf) then raise exception 'Ja existe aluno com este CPF'; end if;

  foreach v_turma_id in array (select array_agg(x order by x) from unnest(p_turma_ids) x) loop
    select * into v_turma from public.turmas where id=v_turma_id for update;
    if not found then raise exception 'Turma nao encontrada'; end if;
    if not v_turma.ativo then raise exception 'Uma turma selecionada esta inativa'; end if;
    select count(*) into v_ocupacao from public.matriculas_turma where turma_id=v_turma_id and data_fim is null;
    if v_ocupacao >= v_turma.capacidade_maxima then raise exception 'Uma turma selecionada esta lotada'; end if;
    select v_valor + m.valor_padrao_mensalidade into v_valor from public.modalidades m where m.id=v_turma.modalidade_id and m.ativo;
    if v_valor is null then raise exception 'Modalidade inativa ou inexistente'; end if;
  end loop;

  insert into public.alunos(nome,cpf,data_nascimento,telefone,email,responsavel_nome,responsavel_cpf,responsavel_telefone,status,cessao_imagem_aceita,data_matricula)
  values(trim(p_nome),v_cpf,p_data_nascimento,v_tel,lower(trim(p_email)),case when v_idade<18 then trim(p_responsavel_nome) end,
    case when v_idade<18 then v_resp_cpf end,case when v_idade<18 then v_resp_tel end,'ativo',false,current_date)
  returning * into v_aluno;

  insert into public.matriculas_turma(aluno_id,turma_id,data_inicio) select v_aluno.id,x,current_date from unnest(p_turma_ids) x;
  v_token := encode(gen_random_bytes(32),'hex');
  insert into public.contratos(aluno_id,texto_gerado,status,token,token_expira_em,valor_mensalidade,dia_vencimento,data_envio)
  values(v_aluno.id,coalesce(nullif(trim(p_texto_contrato),''),'Contrato de Prestacao de Servicos Musicais - Pop Music'),
    'aguardando_assinatura',v_token,now()+interval '7 days',v_valor,p_dia_vencimento,now()) returning id into v_contrato_id;

  return jsonb_build_object('aluno_id',v_aluno.id,'aluno_nome',v_aluno.nome,'telefone',v_aluno.telefone,'email',v_aluno.email,
    'contrato_id',v_contrato_id,'token',v_token,'token_expira_em',now()+interval '7 days','valor_mensalidade',v_valor);
end $$;

revoke all on function public.criar_matricula_com_contrato(text,text,date,text,text,uuid[],text,text,text,text,integer) from public, anon;
grant execute on function public.criar_matricula_com_contrato(text,text,date,text,text,uuid[],text,text,text,text,integer) to authenticated;
commit;
