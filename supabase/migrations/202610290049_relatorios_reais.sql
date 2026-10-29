begin;
create or replace function public.gerar_relatorio_gestao(p_actor_id uuid,p_origem text,p_filtros jsonb default '{}',p_limite integer default 50,p_offset integer default 0)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_sql text; v_result jsonb; v_limit integer:=least(greatest(coalesce(p_limite,50),1),200); v_offset integer:=greatest(coalesce(p_offset,0),0);
begin
  perform public.definir_autor_acesso(p_actor_id);
  if jsonb_typeof(p_filtros) is distinct from 'object' then raise exception 'FILTROS_INVALIDOS'; end if;
  if p_origem='alunos' then
    v_sql:=$q$select a.id,a.nome as name,a.status::text as status,
      coalesce((select string_agg(distinct m.nome,', ' order by m.nome) from public.matriculas_turma mt join public.turmas t on t.id=mt.turma_id join public.modalidades m on m.id=t.modalidade_id where mt.aluno_id=a.id and mt.data_fim is null),'Sem turma') as modality,
      a.data_matricula as date,extract(year from age(current_date,a.data_nascimento))::int as age
      from public.alunos a where
      (nullif($1->>'status','') is null or a.status::text=$1->>'status')
      and (nullif($1->>'startDate','') is null or a.data_matricula>=($1->>'startDate')::date)
      and (nullif($1->>'endDate','') is null or a.data_matricula<=($1->>'endDate')::date)
      and ((nullif($1->>'modality','') is null and nullif($1->>'teacher','') is null) or exists(
        select 1 from public.matriculas_turma mt join public.turmas t on t.id=mt.turma_id where mt.aluno_id=a.id and mt.data_fim is null
        and (nullif($1->>'modality','') is null or t.modalidade_id=($1->>'modality')::uuid)
        and (nullif($1->>'teacher','') is null or t.professor_id=($1->>'teacher')::uuid)))$q$;
  elsif p_origem='frequencia' then
    v_sql:=$q$select * from (select a.id::text||'-'||t.id::text as id,a.nome as name,
      m.nome||' - '||t.horario_inicio::text as class,p.nome as teacher,
      round(100.0*count(*) filter(where pr.status='presente')/nullif(count(*),0),2) as percentage,
      count(*) filter(where pr.status='falta') as absences,count(*) filter(where pr.status='falta_justificada') as justified
      from public.presencas pr join public.alunos a on a.id=pr.aluno_id join public.turmas t on t.id=pr.turma_id
      join public.modalidades m on m.id=t.modalidade_id join public.professores p on p.id=t.professor_id
      where (nullif($1->>'class','') is null or t.id=($1->>'class')::uuid)
      and (nullif($1->>'teacher','') is null or p.id=($1->>'teacher')::uuid)
      and (nullif($1->>'startDate','') is null or pr.data_aula>=($1->>'startDate')::date)
      and (nullif($1->>'endDate','') is null or pr.data_aula<=($1->>'endDate')::date)
      group by a.id,a.nome,t.id,m.nome,p.nome) frequency
      where (nullif($1->>'percentage','') is null or
        ($1->>'percentage'='<50' and percentage<50) or
        ($1->>'percentage'='50-75' and percentage between 50 and 75) or
        ($1->>'percentage'='>75' and percentage>75))$q$;
  elsif p_origem='financeiro' then
    v_sql:=$q$select * from (select c.id,a.nome as name,c.descricao as description,c.valor as amount,c.vencimento as "dueDate",
      case when c.status='pendente' and c.vencimento<current_date then 'atrasada' else c.status::text end as status,
      coalesce(c.forma_pagamento::text,'—') as method from public.cobrancas c join public.alunos a on a.id=c.aluno_id
      where (nullif($1->>'paymentMethod','') is null or c.forma_pagamento::text=$1->>'paymentMethod')
      and (nullif($1->>'startDate','') is null or c.vencimento>=($1->>'startDate')::date)
      and (nullif($1->>'endDate','') is null or c.vencimento<=($1->>'endDate')::date)) charges
      where (nullif($1->>'status','') is null or status=$1->>'status')$q$;
  elsif p_origem='contratos' then
    v_sql:=$q$select * from (select c.id,a.nome as name,
      case when c.status='aguardando_assinatura' and c.token_expira_em<now() then 'expirado'
        when c.status='aceito' and c.data_fim_vigencia<current_date then 'vencido'
        when c.status='aceito' and c.data_fim_vigencia<=current_date+30 then 'vencendo'
        else c.status::text end as status,c.data_envio::date as sent,c.data_aceite::date as accepted
      from public.contratos c join public.alunos a on a.id=c.aluno_id
      where (nullif($1->>'startDate','') is null or c.data_envio::date>=($1->>'startDate')::date)
      and (nullif($1->>'endDate','') is null or c.data_envio::date<=($1->>'endDate')::date)) contracts
      where (nullif($1->>'status','') is null or status=$1->>'status')$q$;
  elsif p_origem='repasses' then
    v_sql:=$q$select r.id::text||'-'||coalesce(ri.id::text,'total') as id,p.nome as teacher,
      coalesce(a.nome,'Fechamento sem itens') as name,coalesce(ri.aulas_finalizadas,0) as classes,
      coalesce(ri.valor,r.valor_total) as amount,r.mes_referencia as month,r.status::text as status
      from public.repasses_professor r join public.professores p on p.id=r.professor_id
      left join public.repasse_itens ri on ri.repasse_id=r.id left join public.alunos a on a.id=ri.aluno_id
      where (nullif($1->>'teacher','') is null or p.id=($1->>'teacher')::uuid)
      and (nullif($1->>'status','') is null or r.status::text=$1->>'status')
      and (nullif($1->>'startDate','') is null or r.mes_referencia>=($1->>'startDate')::date)
      and (nullif($1->>'endDate','') is null or r.mes_referencia<=($1->>'endDate')::date)$q$;
  else raise exception 'ORIGEM_INVALIDA'; end if;
  execute 'with base as ('||v_sql||'), page as (select * from base order by id limit $2 offset $3) select jsonb_build_object(''rows'',coalesce((select jsonb_agg(to_jsonb(page)) from page),''[]''::jsonb),''total'',(select count(*) from base))'
    into v_result using p_filtros,v_limit,v_offset;
  return v_result;
end $$;
revoke all on function public.gerar_relatorio_gestao(uuid,text,jsonb,integer,integer) from public,anon,authenticated;
grant execute on function public.gerar_relatorio_gestao(uuid,text,jsonb,integer,integer) to service_role;
alter table public.relatorios_salvos enable row level security;
revoke all on public.relatorios_salvos from anon;
do $$ declare p record; begin
  for p in select policyname from pg_policies where schemaname='public' and tablename='relatorios_salvos' loop
    execute format('drop policy %I on public.relatorios_salvos',p.policyname);
  end loop;
end $$;
create policy gestor_relatorios_proprios on public.relatorios_salvos for all to authenticated
using(public.meu_papel()='gestao' and usuario_id=auth.uid())
with check(public.meu_papel()='gestao' and usuario_id=auth.uid());
notify pgrst,'reload schema';
commit;
