# Vídeo 106 — Evitando salvar metade da edição do aluno

## Gancho

“O nome do aluno podia mudar mesmo quando a troca de turma dava erro.”

## Desenvolvimento

**Tela:** abrir a edição de um aluno e mostrar os dados pessoais e as turmas.

**Fala:** “A tela fazia duas gravações: primeiro atualizava o aluno e depois tentava trocar as turmas. Se a turma estivesse lotada, a segunda operação falhava, mas a primeira já tinha sido salva.”

**Tela:** mostrar a função SQL `salvar_aluno_com_turmas`.

**Fala:** “Levei as duas etapas para uma função transacional. Ela valida permissão, nome, nascimento e seleção de turma. Depois atualiza o cadastro e os vínculos como uma única unidade: ou tudo funciona, ou nada muda.”

**Tela:** mostrar o erro dentro do modal sem fechá-lo.

**Fala:** “Também substituí os alertas do navegador por mensagens dentro dos formulários. Assim a secretária entende o problema e consegue corrigir os dados sem perder o que digitou.”

## Fechamento

**Fala:** “Quando uma ação representa uma única intenção do usuário, o banco também deve tratá-la como uma única operação.”

**CTA:** “Você já encontrou um cadastro salvo pela metade em algum sistema?”

## Cuidados na gravação

- Usar aluno fictício e turmas de homologação.
- Borrar nome, CPF, telefone, e-mail e dados do responsável.
- Não executar testes destrutivos em registros reais.
