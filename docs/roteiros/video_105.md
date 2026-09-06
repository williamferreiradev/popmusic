# Vídeo 105 — O relatório que dizia que todo mundo pagou

## Gancho

“O sistema mostrava 100% de presença e mensalidade paga para qualquer aluno ativo.”

## Desenvolvimento

**Tela:** card “Alunos ativos” e a tabela gerada.

**Fala:** “A consulta buscava alunos reais, mas duas colunas eram preenchidas com valores fixos. Isso deixava o relatório bonito e completamente perigoso para uma decisão da escola.”

**Tela:** destacar no código a remoção dos campos fixos e a seleção de status, telefone e modalidades atuais.

**Fala:** “Substituí as métricas inventadas por informações que realmente vêm do cadastro. Também passei a ignorar vínculos antigos com turma, então uma modalidade encerrada não aparece como se ainda estivesse ativa.”

**Tela:** simular uma falha de consulta e mostrar o aviso vermelho.

**Fala:** “As consultas agora verificam o erro retornado pelo Supabase. Se o banco falhar, o sistema mostra uma falha clara em vez de uma tabela vazia que parece significar zero resultados.”

## Fechamento

**Fala:** “Dado desconhecido não pode virar 100% só porque fica bonito no dashboard.”

**CTA:** “Qual métrica você jamais confiaria sem saber de onde ela veio?”

## Cuidados na gravação

- Usar registros de homologação ou borrar nomes e telefones.
- Não mostrar CPF, e-mail, valores financeiros ou tokens.
- Explicar que frequência e financeiro possuem relatórios próprios e não foram estimados nesta tela.
