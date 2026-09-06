begin;

create or replace function public.salvar_aluno_com_turmas(
  p_aluno_id uuid, p_nome text, p_cpf text, p_data_nascimento date,
  p_telefone text, p_email text, p_turma_ids uuid[],
  p_responsavel_nome text default null, p_responsavel_cpf text default null,
  p_responsavel_telefone text default null
) returns void language plpgsql security definer set search_path = public as $$
begin
  if public.meu_papel() <> 'gestao'::public.papel_usuario then raise exception 'Apenas a gestao pode editar alunos'; end if;
  if length(trim(coalesce(p_nome, ''))) < 3 then raise exception 'Nome invalido'; end if;
  if p_data_nascimento is null or p_data_nascimento > current_date then raise exception 'Data de nascimento invalida'; end if;
  if coalesce(array_length(p_turma_ids, 1), 0) = 0 then raise exception 'Selecione ao menos uma turma'; end if;

  update public.alunos set
    nome=trim(p_nome), cpf=regexp_replace(p_cpf, '\D', '', 'g'), data_nascimento=p_data_nascimento,
    telefone=regexp_replace(p_telefone, '\D', '', 'g'), email=lower(trim(p_email)),
    responsavel_nome=nullif(trim(p_responsavel_nome), ''),
    responsavel_cpf=nullif(regexp_replace(coalesce(p_responsavel_cpf, ''), '\D', '', 'g'), ''),
    responsavel_telefone=nullif(regexp_replace(coalesce(p_responsavel_telefone, ''), '\D', '', 'g'), '')
  where id=p_aluno_id;
  if not found then raise exception 'Aluno nao encontrado'; end if;
  perform public.atualizar_turmas_aluno(p_aluno_id, p_turma_ids);
end;
$$;

revoke all on function public.salvar_aluno_com_turmas(uuid,text,text,date,text,text,uuid[],text,text,text) from public, anon;
grant execute on function public.salvar_aluno_com_turmas(uuid,text,text,date,text,text,uuid[],text,text,text) to authenticated;

commit;
