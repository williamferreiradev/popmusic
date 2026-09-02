-- Criacao, edicao e inativacao segura de turmas.
begin;

create or replace function public.salvar_turma(
  p_id uuid, p_modalidade_id uuid, p_professor_id uuid, p_sala_id uuid,
  p_dia_semana integer, p_horario_inicio time, p_horario_fim time, p_capacidade_maxima integer
) returns uuid language plpgsql security definer set search_path=public as $$
declare v_id uuid;
begin
  if public.meu_papel()<>'gestao' then raise exception 'Apenas a gestao pode salvar turmas'; end if;
  if p_id is null then
    insert into public.turmas(modalidade_id,professor_id,sala_id,dia_semana,horario_inicio,horario_fim,capacidade_maxima,ativo)
    values(p_modalidade_id,p_professor_id,p_sala_id,p_dia_semana,p_horario_inicio,p_horario_fim,p_capacidade_maxima,true)
    returning id into v_id;
  else
    update public.turmas set modalidade_id=p_modalidade_id,professor_id=p_professor_id,sala_id=p_sala_id,
      dia_semana=p_dia_semana,horario_inicio=p_horario_inicio,horario_fim=p_horario_fim,
      capacidade_maxima=p_capacidade_maxima
    where id=p_id and ativo returning id into v_id;
    if v_id is null then raise exception 'Turma ativa nao encontrada'; end if;
  end if;
  return v_id;
end $$;

create or replace function public.inativar_turma(p_turma_id uuid)
returns void language plpgsql security definer set search_path=public as $$
begin
  if public.meu_papel()<>'gestao' then raise exception 'Apenas a gestao pode inativar turmas'; end if;
  perform 1 from public.turmas where id=p_turma_id and ativo for update;
  if not found then raise exception 'Turma ativa nao encontrada'; end if;
  if exists(select 1 from public.matriculas_turma where turma_id=p_turma_id and data_fim is null) then
    raise exception 'A turma possui matriculas ativas. Transfira ou encerre os vinculos antes de inativar';
  end if;
  update public.turmas set ativo=false where id=p_turma_id;
end $$;

revoke all on function public.salvar_turma(uuid,uuid,uuid,uuid,integer,time,time,integer) from public,anon;
revoke all on function public.inativar_turma(uuid) from public,anon;
grant execute on function public.salvar_turma(uuid,uuid,uuid,uuid,integer,time,time,integer) to authenticated;
grant execute on function public.inativar_turma(uuid) to authenticated;
commit;
