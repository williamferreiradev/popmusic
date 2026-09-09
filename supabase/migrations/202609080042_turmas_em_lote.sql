begin;

create or replace function public.salvar_turmas_em_lote(
  p_modalidade_id uuid,
  p_professor_id uuid,
  p_sala_id uuid,
  p_dias_semana integer[],
  p_horario_inicio time,
  p_horario_fim time,
  p_capacidade_maxima integer
)
returns uuid[]
language plpgsql
security definer
set search_path = public
as $$
declare
  v_dias integer[];
  v_ids uuid[];
begin
  if public.meu_papel() <> 'gestao' then
    raise exception 'Apenas a gestão pode cadastrar turmas.';
  end if;

  select array_agg(distinct dia order by dia)
    into v_dias
    from unnest(p_dias_semana) as dias(dia)
   where dia between 0 and 6;

  if coalesce(array_length(v_dias, 1), 0) = 0
     or coalesce(array_length(v_dias, 1), 0) <> coalesce(array_length(p_dias_semana, 1), 0) then
    raise exception 'Selecione ao menos um dia válido da semana.';
  end if;
  if p_horario_inicio is null or p_horario_fim is null or p_horario_fim <= p_horario_inicio then
    raise exception 'O horário final deve ser posterior ao horário inicial.';
  end if;
  if p_capacidade_maxima is null or p_capacidade_maxima < 1 then
    raise exception 'A capacidade máxima deve ser maior que zero.';
  end if;

  with inseridas as (
    insert into public.turmas (
      modalidade_id, professor_id, sala_id, dia_semana,
      horario_inicio, horario_fim, capacidade_maxima, ativo
    )
    select
      p_modalidade_id, p_professor_id, p_sala_id, dia,
      p_horario_inicio, p_horario_fim, p_capacidade_maxima, true
    from unnest(v_dias) as dias(dia)
    returning id
  )
  select array_agg(id) into v_ids from inseridas;

  return v_ids;
end;
$$;

revoke all on function public.salvar_turmas_em_lote(uuid, uuid, uuid, integer[], time, time, integer) from public, anon;
grant execute on function public.salvar_turmas_em_lote(uuid, uuid, uuid, integer[], time, time, integer) to authenticated;

commit;
