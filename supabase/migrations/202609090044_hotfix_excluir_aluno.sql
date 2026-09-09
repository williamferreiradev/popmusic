begin;

create or replace function public.excluir_aluno_definitivamente(p_aluno_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_usuario_id uuid;
begin
  if public.meu_papel() <> 'gestao'::public.papel_usuario then
    raise exception 'Apenas a gestão pode excluir alunos';
  end if;

  select usuario_id
    into v_usuario_id
    from public.alunos
   where id = p_aluno_id
   for update;

  if not found then
    raise exception 'Aluno não encontrado';
  end if;

  delete from public.repasse_itens where aluno_id = p_aluno_id;
  delete from public.comissoes_professor_aluno where aluno_id = p_aluno_id;
  delete from public.presencas where aluno_id = p_aluno_id;
  delete from public.recibos
   where cobranca_id in (select id from public.cobrancas where aluno_id = p_aluno_id);
  delete from public.fluxo_caixa
   where origem_id in (select id from public.cobrancas where aluno_id = p_aluno_id);
  delete from public.cobrancas where aluno_id = p_aluno_id;
  delete from public.contratos where aluno_id = p_aluno_id;
  delete from public.matriculas_turma where aluno_id = p_aluno_id;
  delete from public.alunos where id = p_aluno_id;

  if v_usuario_id is not null then
    delete from auth.users where id = v_usuario_id;
  end if;
end;
$$;

revoke all on function public.excluir_aluno_definitivamente(uuid) from public, anon;
grant execute on function public.excluir_aluno_definitivamente(uuid) to authenticated;

notify pgrst, 'reload schema';

commit;
