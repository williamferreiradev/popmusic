-- Trancamento, destrancamento, cancelamento e troca preservando historico.
begin;
alter table public.alunos add column if not exists motivo_trancamento text;
alter table public.matriculas_turma add column if not exists motivo_fim text;

create or replace function public.trancar_aluno(p_aluno_id uuid,p_motivo text)
returns void language plpgsql security definer set search_path=public as $$
begin
  if public.meu_papel()<>'gestao' then raise exception 'Apenas a gestao pode trancar matriculas'; end if;
  if length(trim(coalesce(p_motivo,'')))<5 then raise exception 'Informe o motivo do trancamento'; end if;
  update public.alunos set status='trancado',data_inicio_trancamento=current_date,motivo_trancamento=trim(p_motivo) where id=p_aluno_id and status='ativo';
  if not found then raise exception 'Aluno nao esta ativo'; end if;
  update public.matriculas_turma set data_fim=current_date,motivo_fim='Trancamento: '||trim(p_motivo) where aluno_id=p_aluno_id and data_fim is null;
  update public.cobrancas set status='cancelada',motivo_cancelamento='Trancamento: '||trim(p_motivo)
    where aluno_id=p_aluno_id and status='pendente' and date_trunc('month',vencimento)>date_trunc('month',current_date);
end $$;

create or replace function public.destrancar_aluno(p_aluno_id uuid)
returns void language plpgsql security definer set search_path=public as $$
declare v_inicio date; v_turma_id uuid; v_cap integer; v_ocupacao integer;
begin
  if public.meu_papel()<>'gestao' then raise exception 'Apenas a gestao pode destrancar matriculas'; end if;
  select data_inicio_trancamento into v_inicio from public.alunos where id=p_aluno_id and status='trancado' for update;
  if not found or v_inicio is null then raise exception 'Aluno nao esta trancado'; end if;
  select turma_id into v_turma_id from public.matriculas_turma where aluno_id=p_aluno_id order by data_fim desc nulls last,criado_em desc limit 1;
  if v_turma_id is null then raise exception 'Aluno nao possui turma anterior'; end if;
  select capacidade_maxima into v_cap from public.turmas where id=v_turma_id and ativo for update;
  if not found then raise exception 'A turma anterior esta inativa. Use a edicao para escolher outra turma'; end if;
  select count(*) into v_ocupacao from public.matriculas_turma where turma_id=v_turma_id and data_fim is null;
  if v_ocupacao>=v_cap then raise exception 'A turma anterior esta lotada. Escolha outra turma'; end if;
  insert into public.matriculas_turma(aluno_id,turma_id,data_inicio) values(p_aluno_id,v_turma_id,current_date);
  update public.contratos set data_fim_vigencia=data_fim_vigencia+(current_date-v_inicio) where aluno_id=p_aluno_id and status='aceito' and data_fim_vigencia is not null;
  update public.alunos set status='ativo',data_inicio_trancamento=null,motivo_trancamento=null where id=p_aluno_id;
end $$;

create or replace function public.cancelar_aluno(p_aluno_id uuid,p_motivo text)
returns void language plpgsql security definer set search_path=public as $$
begin
  if public.meu_papel()<>'gestao' then raise exception 'Apenas a gestao pode cancelar matriculas'; end if;
  if length(trim(coalesce(p_motivo,'')))<5 then raise exception 'Informe o motivo do cancelamento'; end if;
  update public.alunos set status='cancelado',data_cancelamento=current_date,motivo_cancelamento=trim(p_motivo) where id=p_aluno_id and status<>'cancelado';
  if not found then raise exception 'Aluno inexistente ou ja cancelado'; end if;
  update public.matriculas_turma set data_fim=current_date,motivo_fim='Cancelamento: '||trim(p_motivo) where aluno_id=p_aluno_id and data_fim is null;
  update public.cobrancas set status='cancelada',motivo_cancelamento='Cancelamento da matricula: '||trim(p_motivo)
    where aluno_id=p_aluno_id and status='pendente' and date_trunc('month',vencimento)>date_trunc('month',current_date);
  update public.contratos set status='cancelado' where aluno_id=p_aluno_id and status in ('aguardando_assinatura','aceito');
  update public.usuarios set ativo=false where id=(select usuario_id from public.alunos where id=p_aluno_id);
end $$;

create or replace function public.atualizar_turmas_aluno(p_aluno_id uuid,p_turma_ids uuid[])
returns void language plpgsql security definer set search_path=public as $$
declare v_turma_id uuid; v_cap integer; v_ocupacao integer;
begin
  if public.meu_papel()<>'gestao' then raise exception 'Apenas a gestao pode alterar matriculas'; end if;
  if coalesce(array_length(p_turma_ids,1),0)=0 then raise exception 'Selecione ao menos uma turma'; end if;
  update public.matriculas_turma set data_fim=current_date,motivo_fim='Troca de turma'
    where aluno_id=p_aluno_id and data_fim is null and not(turma_id=any(p_turma_ids));
  foreach v_turma_id in array p_turma_ids loop
    if not exists(select 1 from public.matriculas_turma where aluno_id=p_aluno_id and turma_id=v_turma_id and data_fim is null) then
      select capacidade_maxima into v_cap from public.turmas where id=v_turma_id and ativo for update;
      if not found then raise exception 'Turma inexistente ou inativa'; end if;
      select count(*) into v_ocupacao from public.matriculas_turma where turma_id=v_turma_id and data_fim is null;
      if v_ocupacao>=v_cap then raise exception 'Uma turma selecionada esta lotada'; end if;
      insert into public.matriculas_turma(aluno_id,turma_id,data_inicio) values(p_aluno_id,v_turma_id,current_date);
    end if;
  end loop;
end $$;

revoke all on function public.trancar_aluno(uuid,text),public.destrancar_aluno(uuid),public.cancelar_aluno(uuid,text),public.atualizar_turmas_aluno(uuid,uuid[]) from public,anon;
grant execute on function public.trancar_aluno(uuid,text),public.destrancar_aluno(uuid),public.cancelar_aluno(uuid,text),public.atualizar_turmas_aluno(uuid,uuid[]) to authenticated;
commit;
