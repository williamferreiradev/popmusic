-- Regras de horario, sala, professor e capacidade das turmas.
begin;

create or replace function public.validar_turma() returns trigger
language plpgsql set search_path=public as $$
declare
  v_capacidade_sala integer;
  v_matriculados integer;
begin
  if new.dia_semana not between 0 and 6 then raise exception 'Dia da semana invalido'; end if;
  if new.horario_inicio >= new.horario_fim then raise exception 'O horario inicial deve ser anterior ao final'; end if;
  if new.capacidade_maxima <= 0 then raise exception 'A capacidade da turma deve ser maior que zero'; end if;

  select capacidade_padrao into v_capacidade_sala from public.salas where id=new.sala_id and ativo for share;
  if not found then raise exception 'Sala inexistente ou inativa'; end if;
  if new.capacidade_maxima > v_capacidade_sala then raise exception 'A capacidade da turma ultrapassa a capacidade da sala (%)',v_capacidade_sala; end if;
  if not exists(select 1 from public.professores where id=new.professor_id and ativo) then raise exception 'Professor inexistente ou inativo'; end if;
  if not exists(select 1 from public.modalidades where id=new.modalidade_id and ativo) then raise exception 'Modalidade inexistente ou inativa'; end if;

  -- Serializa alteracoes da mesma agenda para impedir conflitos concorrentes.
  perform pg_advisory_xact_lock(hashtextextended('professor:'||new.professor_id||':'||new.dia_semana,0));
  perform pg_advisory_xact_lock(hashtextextended('sala:'||new.sala_id||':'||new.dia_semana,0));

  if new.ativo and exists(
    select 1 from public.turmas t where t.id<>coalesce(new.id,'00000000-0000-0000-0000-000000000000'::uuid)
      and t.ativo and t.dia_semana=new.dia_semana and t.professor_id=new.professor_id
      and t.horario_inicio < new.horario_fim and t.horario_fim > new.horario_inicio
  ) then raise exception 'O professor ja possui turma nesse horario'; end if;

  if new.ativo and exists(
    select 1 from public.turmas t where t.id<>coalesce(new.id,'00000000-0000-0000-0000-000000000000'::uuid)
      and t.ativo and t.dia_semana=new.dia_semana and t.sala_id=new.sala_id
      and t.horario_inicio < new.horario_fim and t.horario_fim > new.horario_inicio
  ) then raise exception 'A sala ja esta ocupada nesse horario'; end if;

  if tg_op='UPDATE' and new.capacidade_maxima < old.capacidade_maxima then
    select count(*) into v_matriculados from public.matriculas_turma where turma_id=new.id and data_fim is null;
    if new.capacidade_maxima < v_matriculados then raise exception 'A capacidade nao pode ser menor que os % alunos matriculados',v_matriculados; end if;
  end if;
  return new;
end $$;

drop trigger if exists trg_validar_turma on public.turmas;
create trigger trg_validar_turma before insert or update of dia_semana,horario_inicio,horario_fim,
  capacidade_maxima,professor_id,sala_id,modalidade_id,ativo on public.turmas
  for each row execute function public.validar_turma();

do $$ begin
  if not exists(select 1 from pg_constraint where conname='salas_capacidade_positiva') then
    alter table public.salas add constraint salas_capacidade_positiva check(capacidade_padrao>0) not valid;
  end if;
  if not exists(select 1 from pg_constraint where conname='turmas_capacidade_positiva') then
    alter table public.turmas add constraint turmas_capacidade_positiva check(capacidade_maxima>0) not valid;
  end if;
  if not exists(select 1 from pg_constraint where conname='turmas_horario_valido') then
    alter table public.turmas add constraint turmas_horario_valido check(horario_inicio<horario_fim) not valid;
  end if;
end $$;

alter table public.salas validate constraint salas_capacidade_positiva;
alter table public.turmas validate constraint turmas_capacidade_positiva;
alter table public.turmas validate constraint turmas_horario_valido;
commit;
