-- Cancelamento sem fidelidade:
-- pagamentos confirmados nunca sao devolvidos; vencidos permanecem devidos;
-- o mes permanece devido se houve presenca; demais cobrancas futuras sao canceladas.
begin;

create or replace function public.cancelar_aluno(p_aluno_id uuid, p_motivo text)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_motivo text := trim(coalesce(p_motivo, ''));
  v_inicio_mes date := date_trunc('month', current_date)::date;
  v_proximo_mes date := (date_trunc('month', current_date) + interval '1 month')::date;
  v_fez_aula_no_mes boolean;
begin
  if public.meu_papel() <> 'gestao' then raise exception 'Apenas a gestao pode cancelar matriculas'; end if;
  if length(v_motivo) < 5 then raise exception 'Informe o motivo do cancelamento'; end if;

  perform 1 from public.alunos where id = p_aluno_id for update;
  if not found then raise exception 'Aluno inexistente'; end if;

  update public.alunos set status='cancelado', data_cancelamento=current_date, motivo_cancelamento=v_motivo
   where id=p_aluno_id and status<>'cancelado';
  if not found then raise exception 'Aluno ja cancelado'; end if;

  select exists (
    select 1 from public.presencas p
     where p.aluno_id=p_aluno_id and p.data_aula>=v_inicio_mes and p.data_aula<v_proximo_mes
       and p.status='presente'
  ) into v_fez_aula_no_mes;

  update public.matriculas_turma set data_fim=current_date, motivo_fim='Cancelamento: '||v_motivo
   where aluno_id=p_aluno_id and data_fim is null;

  update public.cobrancas set status='cancelada', motivo_cancelamento='Cancelamento sem fidelidade: '||v_motivo
   where aluno_id=p_aluno_id
     and status in ('pendente','atrasada')
     and vencimento>current_date
     and (vencimento>=v_proximo_mes or (vencimento>=v_inicio_mes and not v_fez_aula_no_mes));

  update public.contratos set status='cancelado'
   where aluno_id=p_aluno_id and status in ('aguardando_assinatura','aceito');
  update public.usuarios set ativo=false where id=(select usuario_id from public.alunos where id=p_aluno_id);
end $$;

comment on function public.cancelar_aluno(uuid,text) is
  'Cancela sem multa de fidelidade, preservando pagamentos, dividas vencidas e o mes com aula realizada.';
revoke all on function public.cancelar_aluno(uuid,text) from public,anon;
grant execute on function public.cancelar_aluno(uuid,text) to authenticated;
commit;
