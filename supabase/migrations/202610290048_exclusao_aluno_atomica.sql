begin;
create table if not exists public.exclusoes_aluno (
  id uuid primary key default gen_random_uuid(), aluno_id uuid not null unique,
  usuario_id uuid, solicitado_por uuid not null references public.usuarios(id) on delete restrict,
  fotos text[] not null default '{}',
  status text not null default 'pendente' check(status in ('pendente','concluida')),
  ultimo_erro text, criada_em timestamptz not null default now(), concluida_em timestamptz
);
alter table public.exclusoes_aluno enable row level security;
revoke all on public.exclusoes_aluno from public,anon,authenticated;
grant select,insert,update on public.exclusoes_aluno to service_role;
create or replace function public.excluir_aluno_transacional(p_actor_id uuid,p_aluno_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_aluno public.alunos%rowtype; v_job public.exclusoes_aluno%rowtype; v_fotos text[];
begin
  perform public.definir_autor_acesso(p_actor_id);
  if p_aluno_id is null then raise exception 'ALUNO_INVALIDO'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('excluir-aluno:'||p_aluno_id::text,0));
  select * into v_job from public.exclusoes_aluno where aluno_id=p_aluno_id;
  if found then return to_jsonb(v_job); end if;
  select * into v_aluno from public.alunos where id=p_aluno_id for update;
  if not found then raise exception 'ALUNO_NAO_ENCONTRADO'; end if;
  -- Serializa com baixa/estorno e assinatura antes de validar o histórico.
  perform 1 from public.cobrancas where aluno_id=p_aluno_id for update;
  perform 1 from public.contratos where aluno_id=p_aluno_id for update;
  if v_aluno.usuario_id is not null then perform 1 from public.usuarios where id=v_aluno.usuario_id for update; end if;
  if exists(select 1 from public.cobrancas c where c.aluno_id=p_aluno_id and (c.status='paga' or c.data_pagamento is not null))
    or exists(select 1 from public.recibos r join public.cobrancas c on c.id=r.cobranca_id where c.aluno_id=p_aluno_id)
    or exists(select 1 from public.estornos_pagamento e join public.cobrancas c on c.id=e.cobranca_id where c.aluno_id=p_aluno_id)
    or exists(select 1 from public.fluxo_caixa f join public.cobrancas c on c.id=f.origem_id where c.aluno_id=p_aluno_id)
    or exists(select 1 from public.repasse_itens r where r.aluno_id=p_aluno_id) then
    raise exception 'ALUNO_COM_HISTORICO_FINANCEIRO';
  end if;
  if exists(select 1 from public.contratos c where c.aluno_id=p_aluno_id and
    (c.data_aceite is not null or c.documento_assinado_snapshot is not null or c.status::text in ('aceito','renovado','vencendo','vencido'))) then
    raise exception 'ALUNO_COM_CONTRATO_ASSINADO';
  end if;
  if v_aluno.usuario_id is not null and (
    exists(select 1 from public.usuarios u where u.id=v_aluno.usuario_id and u.papel<>'aluno')
    or exists(select 1 from public.professores p where p.usuario_id=v_aluno.usuario_id)
    or exists(select 1 from public.alunos a where a.usuario_id=v_aluno.usuario_id and a.id<>p_aluno_id)
  ) then raise exception 'ACESSO_ALUNO_COMPARTILHADO'; end if;
  select coalesce(array_agg(distinct path) filter(where path is not null and path<>''),'{}') into v_fotos
  from (select v_aluno.foto_url as path union all select c.foto_assinatura_url from public.contratos c where c.aluno_id=p_aluno_id) photos;
  insert into public.exclusoes_aluno(aluno_id,usuario_id,solicitado_por,fotos)
  values(p_aluno_id,v_aluno.usuario_id,p_actor_id,v_fotos) returning * into v_job;
  if v_aluno.usuario_id is not null then update public.usuarios set ativo=false where id=v_aluno.usuario_id; end if;
  delete from public.comissoes_professor_aluno where aluno_id=p_aluno_id;
  delete from public.presencas where aluno_id=p_aluno_id;
  delete from public.cobrancas where aluno_id=p_aluno_id;
  delete from public.contratos where aluno_id=p_aluno_id;
  delete from public.matriculas_turma where aluno_id=p_aluno_id;
  delete from public.alunos where id=p_aluno_id;
  insert into public.auditoria(tabela,registro_id,acao,usuario_id,dados_depois)
  values('alunos',p_aluno_id,'exclusao_definitiva',p_actor_id,jsonb_build_object('exclusao_id',v_job.id,'acesso_desativado',v_aluno.usuario_id is not null));
  return to_jsonb(v_job);
end $$;
revoke all on function public.excluir_aluno_transacional(uuid,uuid) from public,anon,authenticated;
grant execute on function public.excluir_aluno_transacional(uuid,uuid) to service_role;
create or replace function public.excluir_aluno_definitivamente(p_aluno_id uuid)
returns void language plpgsql security definer set search_path='' as $$
begin perform public.excluir_aluno_transacional(auth.uid(),p_aluno_id); end $$;
revoke all on function public.excluir_aluno_definitivamente(uuid) from public,anon;
grant execute on function public.excluir_aluno_definitivamente(uuid) to authenticated;
notify pgrst,'reload schema';
commit;
