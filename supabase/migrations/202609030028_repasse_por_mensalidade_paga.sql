-- Vincula o repasse do professor às mensalidades efetivamente recebidas.
begin;

alter table public.repasse_itens
  add column if not exists cobranca_id uuid references public.cobrancas(id) on delete restrict;

create unique index if not exists uq_repasse_item_cobranca_turma
  on public.repasse_itens (cobranca_id, turma_id)
  where cobranca_id is not null;

-- A função de pagamento depende da função de cálculo; ambas são recriadas
-- para acrescentar a cobrança que originou cada repasse.
drop function if exists public.pagar_repasse_professor(uuid,date,uuid,public.forma_pagamento,date);
drop function if exists public.calcular_repasse_professor(uuid,date);

create function public.calcular_repasse_professor(
  p_professor_id uuid,
  p_mes date
)
returns table (
  cobranca_id uuid,
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
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if public.meu_papel() <> 'gestao'::public.papel_usuario then
    raise exception 'Somente a gestão pode calcular repasses';
  end if;

  return query
  with periodo as (
    select date_trunc('month', p_mes)::date as inicio,
           (date_trunc('month', p_mes) + interval '1 month')::date as fim
  ), elegiveis as (
    select
      c.id as cobranca_id,
      a.id as aluno_id,
      a.nome as aluno_nome,
      t.id as turma_id,
      m.nome as modalidade_nome,
      m.valor_padrao_mensalidade::numeric as valor_base,
      coalesce(cpa.tipo, p.comissao_padrao_tipo) as tipo_comissao,
      coalesce(cpa.valor, p.comissao_padrao_valor)::numeric as valor_configurado,
      (
        select count(*)
        from public.chamadas_aula ca, periodo pe2
        where ca.turma_id = t.id
          and ca.ativa = true
          and ca.data_aula >= pe2.inicio
          and ca.data_aula < pe2.fim
      ) as aulas_finalizadas
    from public.cobrancas c
    join public.alunos a on a.id = c.aluno_id
    join public.matriculas_turma mt on mt.aluno_id = a.id
    join public.turmas t on t.id = mt.turma_id and t.professor_id = p_professor_id
    join public.professores p on p.id = t.professor_id
    join public.modalidades m on m.id = t.modalidade_id
    left join lateral (
      select ca.tipo, ca.valor
      from public.comissoes_professor_aluno ca
      where ca.professor_id = p.id and ca.aluno_id = a.id
      order by ca.criado_em desc, ca.id desc
      limit 1
    ) cpa on true
    cross join periodo pe
    where c.status = 'paga'::public.status_cobranca
      and c.data_pagamento >= pe.inicio
      and c.data_pagamento < pe.fim
      and p.ativo = true
      and t.ativo = true
      and mt.data_inicio <= c.data_pagamento
      and (mt.data_fim is null or mt.data_fim >= c.data_pagamento)
      and not exists (
        select 1 from public.repasse_itens ri
        where ri.cobranca_id = c.id and ri.turma_id = t.id
      )
  )
  select
    e.cobranca_id,
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
  order by e.aluno_nome, e.modalidade_nome, e.cobranca_id;
end;
$$;

create function public.pagar_repasse_professor(
  p_professor_id uuid,
  p_mes date,
  p_conta_id uuid,
  p_forma_pagamento public.forma_pagamento,
  p_data_pagamento date
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
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
  if p_data_pagamento > current_date then
    raise exception 'A data do pagamento não pode estar no futuro';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_professor_id::text || v_mes::text, 0));

  select coalesce(sum(c.valor_repasse), 0), max(p.nome)
    into v_total, v_professor_nome
  from public.calcular_repasse_professor(p_professor_id, v_mes) c
  cross join public.professores p
  where p.id = p_professor_id;

  if v_total <= 0 then raise exception 'Não há mensalidade paga pendente de repasse'; end if;
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
    repasse_id, cobranca_id, aluno_id, turma_id, presenca_id, valor,
    valor_base, tipo_comissao, valor_configurado, aulas_finalizadas
  )
  select
    v_repasse_id, c.cobranca_id, c.aluno_id, c.turma_id, null, c.valor_repasse,
    c.valor_base, c.tipo_comissao, c.valor_configurado, c.aulas_finalizadas::integer
  from public.calcular_repasse_professor(p_professor_id, v_mes) c;

  if not found then raise exception 'Nenhum item elegível foi reservado para repasse'; end if;

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

revoke all on function public.calcular_repasse_professor(uuid,date) from public, anon;
revoke all on function public.pagar_repasse_professor(uuid,date,uuid,public.forma_pagamento,date) from public, anon;
grant execute on function public.calcular_repasse_professor(uuid,date) to authenticated;
grant execute on function public.pagar_repasse_professor(uuid,date,uuid,public.forma_pagamento,date) to authenticated;

commit;
