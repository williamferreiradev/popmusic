# Correções das pendências prioritárias

## Exclusão de alunos

A API usa uma única função transacional. Falhas de integridade revertem todas as remoções do banco. Cobranças pagas, movimentação financeira e contratos assinados bloqueiam a exclusão; o usuário recebe a orientação de inativar. O cadastro de autenticação e a autoria de auditoria são preservados.

Auth e Storage são serviços externos à transação. A solicitação fica registrada em fila durável: falha ao bloquear acesso ou limpar arquivos aparece como pendência e pode ser reprocessada no painel. Repetir a solicitação não repete a exclusão do banco. A antiga função pública também passa pela regra protegida.

## Relatórios

O construtor está acessível em Relatórios > Personalizados e salvos. Alunos, frequência, financeiro, contratos e repasses consultam registros reais, com filtros validados no servidor e paginação. Filtros salvos ficam restritos ao seu autor com papel de gestão. O CSV exporta a página atual e trata células que poderiam ser interpretadas como fórmulas.

O filtro de alunos do professor João foi salvo e recuperado após recarregar a página. Os dois alunos da simulação continuam no banco e aparecem como dados de teste; pagamentos e repasses simulados não movimentam dinheiro real.

## Recuperação

Baseline reproduzível criada e backup real restaurado localmente: 60 tabelas, 204 registros, 3 arquivos. Não foi necessário alterar a senha do cliente. Consulte `docs/recuperacao_banco.md` para procedimento, limites e armazenamento privado.

## Validação e limites

198 testes automatizados passaram, incluindo PostgreSQL executando rollback da exclusão, bloqueios financeiros, autorização, filtros reais, isolamento de relatórios salvos e recuperação da estrutura. O ensaio com os dados reais é separado e privado, sem inserir dados pessoais na suíte.

As migrations 048 e 049 foram aplicadas no projeto atual. A versão do aplicativo precisa incorporar o commit para usar as novas APIs e telas. Não houve acesso ou publicação manual pela Vercel.

Esta entrega resolve as três prioridades solicitadas dentro dos limites de validação descritos. Não certifica o projeto inteiro como 100%: continuam necessárias homologação em novo Supabase e as demais verificações do relatório original, como integrações externas, dispositivos e acessibilidade.
