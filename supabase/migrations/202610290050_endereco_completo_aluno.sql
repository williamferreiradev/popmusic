begin;

alter table public.alunos
  add column if not exists logradouro text,
  add column if not exists numero text,
  add column if not exists complemento text,
  add column if not exists bairro text,
  add column if not exists cidade text,
  add column if not exists uf text,
  add column if not exists cep text;

create or replace function public.normalizar_endereco_aluno(p_endereco jsonb)
returns jsonb language plpgsql immutable set search_path='' as $$
declare v jsonb; k text;
begin
  if p_endereco is null or jsonb_typeof(p_endereco)<>'object' then raise exception 'Informe o endereco completo do aluno'; end if;
  foreach k in array array['logradouro','numero','complemento','bairro','cidade','uf','cep'] loop
    if p_endereco ? k and jsonb_typeof(p_endereco->k) not in ('string','null') then raise exception 'Campo de endereco invalido: %',k; end if;
  end loop;
  v:=jsonb_build_object(
    'logradouro',btrim(coalesce(p_endereco->>'logradouro','')),
    'numero',btrim(coalesce(p_endereco->>'numero','')),
    'complemento',nullif(btrim(coalesce(p_endereco->>'complemento','')),''),
    'bairro',btrim(coalesce(p_endereco->>'bairro','')),
    'cidade',btrim(coalesce(p_endereco->>'cidade','')),
    'uf',upper(btrim(coalesce(p_endereco->>'uf',''))),
    'cep',regexp_replace(coalesce(p_endereco->>'cep',''),'[\s.-]','','g')
  );
  if length(v->>'logradouro') not between 3 and 160 then raise exception 'Informe um logradouro com 3 a 160 caracteres'; end if;
  if length(v->>'numero') not between 1 and 20 then raise exception 'Informe o numero do endereco ou S/N'; end if;
  if length(coalesce(v->>'complemento',''))>100 then raise exception 'Complemento deve ter ate 100 caracteres'; end if;
  if length(v->>'bairro') not between 2 and 100 then raise exception 'Informe o bairro'; end if;
  if length(v->>'cidade') not between 2 and 100 then raise exception 'Informe a cidade'; end if;
  if not ((v->>'uf')=any(array['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'])) then raise exception 'Selecione uma UF valida'; end if;
  if (v->>'cep') !~ '^\d{8}$' then raise exception 'Informe um CEP com 8 digitos'; end if;
  return v;
end $$;

create or replace function public.criar_matricula_com_endereco(
  p_nome text,p_cpf text,p_data_nascimento date,p_telefone text,p_email text,p_turma_ids uuid[],p_endereco jsonb,
  p_responsavel_nome text default null,p_responsavel_cpf text default null,p_responsavel_telefone text default null,
  p_texto_contrato text default null,p_dia_vencimento integer default 10
) returns jsonb language plpgsql security definer set search_path='' as $$
declare v jsonb; resultado jsonb;
begin
  if public.meu_papel() is distinct from 'gestao'::public.papel_usuario then raise exception 'Apenas a gestao pode criar matriculas'; end if;
  v:=public.normalizar_endereco_aluno(p_endereco);
  resultado:=public.criar_matricula_com_contrato(p_nome,p_cpf,p_data_nascimento,p_telefone,p_email,p_turma_ids,
    p_responsavel_nome,p_responsavel_cpf,p_responsavel_telefone,p_texto_contrato,p_dia_vencimento);
  update public.alunos set
    logradouro=v->>'logradouro',numero=v->>'numero',complemento=v->>'complemento',
    endereco=concat_ws(', ',v->>'logradouro',v->>'numero',v->>'complemento'),
    bairro=v->>'bairro',cidade=v->>'cidade',uf=v->>'uf',cep=v->>'cep'
  where id=(resultado->>'aluno_id')::uuid;
  return resultado;
end $$;

create or replace function public.salvar_aluno_com_endereco(
  p_aluno_id uuid,p_nome text,p_cpf text,p_data_nascimento date,p_telefone text,p_email text,p_turma_ids uuid[],p_endereco jsonb,
  p_responsavel_nome text default null,p_responsavel_cpf text default null,p_responsavel_telefone text default null
) returns void language plpgsql security definer set search_path='' as $$
declare v jsonb;
begin
  if public.meu_papel() is distinct from 'gestao'::public.papel_usuario then raise exception 'Apenas a gestao pode editar alunos'; end if;
  v:=public.normalizar_endereco_aluno(p_endereco);
  perform public.salvar_aluno_com_turmas(p_aluno_id,p_nome,p_cpf,p_data_nascimento,p_telefone,p_email,p_turma_ids,
    p_responsavel_nome,p_responsavel_cpf,p_responsavel_telefone);
  update public.alunos set
    logradouro=v->>'logradouro',numero=v->>'numero',complemento=v->>'complemento',
    endereco=concat_ws(', ',v->>'logradouro',v->>'numero',v->>'complemento'),
    bairro=v->>'bairro',cidade=v->>'cidade',uf=v->>'uf',cep=v->>'cep'
  where id=p_aluno_id;
end $$;

revoke all on function public.normalizar_endereco_aluno(jsonb) from public,anon,authenticated;
revoke all on function public.criar_matricula_com_endereco(text,text,date,text,text,uuid[],jsonb,text,text,text,text,integer) from public,anon;
revoke all on function public.salvar_aluno_com_endereco(uuid,text,text,date,text,text,uuid[],jsonb,text,text,text) from public,anon;
grant execute on function public.normalizar_endereco_aluno(jsonb) to service_role;
grant execute on function public.criar_matricula_com_endereco(text,text,date,text,text,uuid[],jsonb,text,text,text,text,integer) to authenticated,service_role;
grant execute on function public.salvar_aluno_com_endereco(uuid,text,text,date,text,text,uuid[],jsonb,text,text,text) to authenticated,service_role;

notify pgrst,'reload schema';
commit;
