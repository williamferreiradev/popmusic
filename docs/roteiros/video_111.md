# Vídeo 111 — Cancelar não é a mesma coisa que excluir um aluno

## Gancho

“Excluir um aluno precisa apagar oito tipos de registro sem atingir ninguém mais.”

## Desenvolvimento

**Tela:** menu do aluno mostrando “Cancelar matrícula” e “Excluir definitivamente”.

**Fala:** “Cancelamento preserva histórico. Exclusão definitiva é outra operação: contratos, parcelas, recibos, presenças, matrícula, repasses e acesso precisam desaparecer juntos.”

**Tela:** função SQL `excluir_aluno_definitivamente` e confirmação vermelha.

**Fala:** “Criei uma função transacional restrita à gestão. Ela remove as dependências na ordem correta e só apaga o aluno no final. Se uma etapa falhar, o banco desfaz tudo.”

**Tela:** destacar o aviso irreversível e o botão ‘Excluir tudo’.

**Fala:** “A ação ficou separada do cancelamento e exige confirmação explícita. Isso evita transformar uma rotina administrativa em perda acidental de histórico.”

## Fechamento

**Fala:** “Operação destrutiva boa é clara, restrita e atômica.”

**CTA:** “No seu produto, apagar e arquivar ainda usam o mesmo botão?”

## Cuidados na gravação

- Executar somente com um aluno fictício de homologação.
- Fazer backup antes de demonstrar.
- Borrar nome, CPF, contatos, foto, contrato e valores.
