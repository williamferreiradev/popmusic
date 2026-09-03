-- Pop Music - auditoria final, somente leitura
-- Execute no SQL Editor do Supabase e exporte o resultado como CSV.
-- A entrega só deve prosseguir quando todas as linhas estiverem com status OK.

with
tabelas_sensiveis(tabela) as (
  values
    ('usuarios'), ('alunos'), ('professores'), ('professor_modalidades'),
    ('modalidades'), ('salas'), ('turmas'), ('matriculas_turma'),
    ('contratos'), ('cobrancas'), ('presencas'), ('recibos'),
    ('repasses_professor'), ('repasse_itens'), ('fluxo_caixa'),
    ('contas_financeiras'), ('configuracoes'), ('feriados'),
    ('modelos_contrato'), ('chamadas_aula'), ('auditoria'),
    ('comunicacoes'), ('estornos_pagamento')
),
views_portais(view_name) as (
  values
    ('vw_professor_agenda'), ('vw_professor_alunos'),
    ('vw_professor_meu_repasse'), ('vw_aluno_meu_perfil'),
    ('vw_aluno_minhas_turmas'), ('vw_aluno_minha_frequencia'),
    ('vw_aluno_minhas_cobrancas'), ('vw_aluno_meu_contrato')
),
indices_obrigatorios(index_name) as (
  values
    ('uq_contratos_token'), ('uq_cobrancas_contrato_vencimento'),
    ('uq_presencas_aluno_turma_data_tipo'),
    ('uq_matricula_ativa_aluno_turma'),
    ('uq_repasse_item_cobranca_turma'), ('idx_cobrancas_aluno_id'),
    ('idx_cobrancas_contrato_id'), ('idx_presencas_turma_data'),
    ('idx_presencas_aluno_data'), ('idx_repasses_professor_id')
),
auditoria as (
  select
    'integridade'::text as categoria,
    'tokens de contrato duplicados'::text as verificacao,
    count(*)::bigint as problemas
  from (
    select token from public.contratos group by token having count(*) > 1
  ) x

  union all
  select 'integridade', 'cobranças duplicadas por contrato e vencimento', count(*)
  from (
    select contrato_id, vencimento
    from public.cobrancas
    where contrato_id is not null
    group by contrato_id, vencimento having count(*) > 1
  ) x

  union all
  select 'integridade', 'presenças duplicadas', count(*)
  from (
    select aluno_id, turma_id, data_aula, tipo_aula
    from public.presencas
    group by aluno_id, turma_id, data_aula, tipo_aula having count(*) > 1
  ) x

  union all
  select 'integridade', 'matrículas ativas duplicadas', count(*)
  from (
    select aluno_id, turma_id
    from public.matriculas_turma
    where data_fim is null
    group by aluno_id, turma_id having count(*) > 1
  ) x

  union all
  select 'integridade', 'contratos aceitos sem data ou hash', count(*)
  from public.contratos
  where status = 'aceito'::public.status_contrato
    and (data_aceite is null or aceite_hash is null or btrim(aceite_hash) = '')

  union all
  select 'integridade', 'repasse duplicado para cobrança e turma', count(*)
  from (
    select cobranca_id, turma_id
    from public.repasse_itens
    where cobranca_id is not null
    group by cobranca_id, turma_id having count(*) > 1
  ) x

  union all
  select 'segurança', 'tabelas sensíveis sem RLS', count(*)
  from tabelas_sensiveis e
  left join pg_catalog.pg_class c
    on c.relname = e.tabela and c.relnamespace = 'public'::regnamespace
  where c.oid is null or not c.relrowsecurity

  union all
  select 'segurança', 'privilégios anon em tabelas sensíveis', count(*)
  from information_schema.role_table_grants g
  join tabelas_sensiveis e on e.tabela = g.table_name
  where g.table_schema = 'public' and g.grantee = 'anon'

  union all
  select 'segurança', 'views de portal ausentes ou sem security_invoker', count(*)
  from views_portais e
  left join pg_catalog.pg_class c
    on c.relname = e.view_name and c.relnamespace = 'public'::regnamespace
  where c.oid is null
     or not coalesce(c.reloptions, array[]::text[]) @> array['security_invoker=true']

  union all
  select 'desempenho', 'índices obrigatórios ausentes', count(*)
  from indices_obrigatorios e
  left join pg_catalog.pg_indexes i
    on i.schemaname = 'public' and i.indexname = e.index_name
  where i.indexname is null

  union all
  select 'storage', 'bucket fotos_alunos ausente ou público', count(*)
  from (select 1) base
  where not exists (
    select 1 from storage.buckets where id = 'fotos_alunos' and public = false
  )
)
select
  categoria,
  verificacao,
  case when problemas = 0 then 'OK' else 'ERRO' end as status,
  problemas
from auditoria
order by
  case when problemas = 0 then 1 else 0 end,
  categoria,
  verificacao;

