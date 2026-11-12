-- Verificação pós-migration 202611110051 — execute INTEIRO no SQL Editor.
-- Resultado esperado indicado em cada comentário. Somente leitura, nada é alterado.

-- ===== 1. Políticas "to public" restantes (ESPERADO: 0 linhas) =====
select tablename, policyname
from pg_policies
where schemaname = 'public' and 'public' = any(roles)
order by tablename, policyname;

-- ===== 2. TRUNCATE/MAINTAIN para authenticated (ESPERADO: 0 linhas) =====
select table_name, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee = 'authenticated'
  and privilege_type in ('TRUNCATE', 'MAINTAIN')
order by table_name;

-- ===== 3. EXECUTE para anon em funções financeiras (ESPERADO: 0 linhas) =====
select routine_name, grantee
from information_schema.role_routine_grants
where specific_schema = 'public'
  and grantee = 'anon'
  and routine_name in (
    'estornar_pagamento_manual', 'registrar_pagamento_manual',
    'obter_resumo_financeiro', 'excluir_aluno_definitivamente'
  );

-- ===== 4. Políticas novas criadas (ESPERADO: 2 linhas) =====
select tablename, policyname
from pg_policies
where schemaname = 'public'
  and policyname in ('aluno_le_turmas_matriculado', 'autenticados_leem_feriados')
order by policyname;

-- ===== 5. View mínima do professor (ESPERADO: id, nome, ativo — SEM cpf/pix) =====
select column_name
from information_schema.columns
where table_schema = 'public' and table_name = 'vw_professor_publico'
order by ordinal_position;

-- ===== 6. Total de políticas ativas por tabela (informativo) =====
select tablename, count(*) as politicas
from pg_policies
where schemaname = 'public'
group by tablename
order by tablename;
