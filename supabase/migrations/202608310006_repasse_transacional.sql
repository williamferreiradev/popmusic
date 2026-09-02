begin;

alter table public.repasse_itens alter column presenca_id drop not null;
alter table public.repasse_itens
  add column if not exists turma_id uuid references public.turmas(id) on delete restrict,
  add column if not exists valor_base numeric(12,2),
  add column if not exists tipo_comissao public.tipo_comissao,
  add column if not exists valor_configurado numeric(12,2),
  add column if not exists aulas_finalizadas integer not null default 0;

create or replace function public.calcular_repasse_professor(
  p_professor_id uuid,
  p_mes date
)
returns table (
  aluno_id uuid,
  aluno_nome text,
  turma_id uuid,
  modalidade_nome text,
  aulas_finalizadas bigint,
  valor_base numeric,
  tipo_comissao public.tipo_comissao,
  valor_configurado numeric,
  valor_repasse numeric
)
language sql
security definer
set search_path = public
as $$
  with periodo as (
    select date_trunc('month', p_mes)::date as inicio,
           (date_trunc('month', p_mes) + interval '1 month')::date as fim
  ), elegiveis as (
    select distinct
      a.id as aluno_id,
      a.nome as aluno_nome,
      t.id as turma_id,
      m.nome as modalidade_nome,
      m.valor_padrao_mensalidade::numeric as valor_base,
      p.comissao_padrao_tipo as tipo_comissao,
      p.comissao_padrao_valor::numeric as valor_configurado,
      (
        select count(*)
        from public.chamadas_aula ca, periodo pe
        where ca.turma_id = t.id
          and ca.ativa = true
          and ca.data_aula >= pe.inicio
          and ca.data_aula < pe.fim
      ) as aulas_finalizadas
    from public.professores p
    join public.turmas t on t.professor_id = p.id
    join public.modalidades m on m.id = t.modalidade_id
    join public.matriculas_turma mt on mt.turma_id = t.id
    join public.alunos a on a.id = mt.aluno_id
    cross join periodo pe
    where p.id = p_professor_id
      and p.ativo = true
      and t.ativo = true
      and mt.data_inicio < pe.fim
      and (mt.data_fim is null or mt.data_fim >= pe.inicio)
  )
  select
    e.aluno_id,
    e.aluno_nome,
    e.turma_id,
    e.modalidade_nome,
    e.aulas_finalizadas,
    e.valor_base,
    e.tipo_comissao,
    e.valor_configurado,
    round(case
      when e.tipo_comissao = 'percentual'::public.tipo_comissao
        then e.valor_base * e.valor_configurado / 100
      else e.valor_configurado
    end, 2) as valor_repasse
  from elegiveis e
  where e.aulas_finalizadas > 0
  order by e.aluno_nome, e.modalidade_nome;
$$;

create or replace function public.pagar_repasse_professor(
  p_professor_id uuid,
  p_mes date,
  p_conta_id uuid,
  p_forma_pagamento public.forma_pagamento,
  p_data_pagamento date
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_mes date := date_trunc('month', p_mes)::date;
  v_total numeric(12,2);
  v_repasse_id uuid;
  v_professor_nome text;
begin
  if public.meu_papel() <> 'gestao'::public.papel_usuario then
    raise exception 'Somente a gestão pode pagar repasses';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_professor_id::text || v_mes::text, 0));

  if exists (
    select 1 from public.repasses_professor
    where professor_id = p_professor_id
      and mes_referencia = v_mes
      and status = 'pago'::public.status_repasse
  ) then
    raise exception 'O repasse deste professor já foi pago nesta competência';
  end if;

  select coalesce(sum(c.valor_repasse), 0), max(p.nome)
    into v_total, v_professor_nome
  from public.calcular_repasse_professor(p_professor_id, v_mes) c
  cross join public.professores p
  where p.id = p_professor_id;

  if v_total <= 0 then raise exception 'Não há valor elegível para repasse'; end if;
  if not exists (select 1 from public.contas_financeiras where id = p_conta_id) then
    raise exception 'Conta financeira inválida';
  end if;

  insert into public.repasses_professor (
    professor_id, mes_referencia, status, forma_pagamento,
    data_pagamento, conta_financeira_id, valor_total
  ) values (
    p_professor_id, v_mes, 'pago', p_forma_pagamento,
    p_data_pagamento, p_conta_id, v_total
  ) returning id into v_repasse_id;

  insert into public.repasse_itens (
    repasse_id, aluno_id, turma_id, presenca_id, valor,
    valor_base, tipo_comissao, valor_configurado, aulas_finalizadas
  )
  select
    v_repasse_id, c.aluno_id, c.turma_id, null, c.valor_repasse,
    c.valor_base, c.tipo_comissao, c.valor_configurado, c.aulas_finalizadas::integer
  from public.calcular_repasse_professor(p_professor_id, v_mes) c;

  insert into public.fluxo_caixa (
    tipo, descricao, valor, data, conta_id, categoria,
    origem, origem_tipo, origem_id, criado_por
  ) values (
    'saida', 'Pagamento Professor(a) ' || coalesce(v_professor_nome, ''),
    v_total, p_data_pagamento, p_conta_id, 'Repasse Professores',
    'automatico', 'repasse', v_repasse_id, auth.uid()
  );

  return v_repasse_id;
end;
$$;

revoke all on function public.calcular_repasse_professor(uuid, date) from public;
revoke all on function public.pagar_repasse_professor(uuid, date, uuid, public.forma_pagamento, date) from public;
grant execute on function public.calcular_repasse_professor(uuid, date) to authenticated;
grant execute on function public.pagar_repasse_professor(uuid, date, uuid, public.forma_pagamento, date) to authenticated;

commit;
