# Auditoria final do Supabase — 04/09/2026

Resultado informado após a execução de `docs/sql/auditoria_final_supabase.sql` no banco de produção.

| Categoria | Verificação | Status | Problemas |
| --- | --- | --- | ---: |
| desempenho | índices obrigatórios ausentes | OK | 0 |
| integridade | cobranças duplicadas por contrato e vencimento | OK | 0 |
| integridade | contratos aceitos sem data ou hash | OK | 0 |
| integridade | matrículas ativas duplicadas | OK | 0 |
| integridade | presenças duplicadas | OK | 0 |
| integridade | repasse duplicado para cobrança e turma | OK | 0 |
| integridade | tokens de contrato duplicados | OK | 0 |
| segurança | privilégios anon em tabelas sensíveis | OK | 0 |
| segurança | tabelas sensíveis sem RLS | OK | 0 |
| segurança | views de portal ausentes ou sem security_invoker | OK | 0 |
| storage | bucket fotos_alunos ausente ou público | OK | 0 |

Conclusão: nenhuma inconsistência coberta pela auditoria foi encontrada. A auditoria estrutural do banco está aprovada; ainda são necessários backup e testes funcionais por papel antes da entrega.

