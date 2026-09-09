# Vídeo 130 — Como criar várias turmas de uma vez

## Gancho

Cadastrar a mesma aula cinco vezes, mudando apenas o dia da semana, é trabalho repetitivo que o sistema deveria eliminar.

## Desenvolvimento

Na tela de turmas, o formulário antes aceitava somente um dia por cadastro. Agora a gestão escolhe a modalidade, o professor, a sala, o horário e a capacidade uma única vez, marca todos os dias desejados e cria o lote inteiro.

A interface mostra quantas turmas serão criadas e também verifica conflitos de sala ou professor em cada dia selecionado. No banco, a criação acontece em uma única transação: se existir um conflito em qualquer dia, nada é salvo pela metade.

A edição continua individual. Assim, alterar a terça-feira não modifica acidentalmente as outras turmas criadas no mesmo lote.

## Demonstração

1. Abra **Turmas** e clique em **Nova turma**.
2. Escolha modalidade, professor e sala.
3. Marque segunda, quarta e sexta.
4. Defina horário e capacidade.
5. Observe o botão **Criar 3 turmas**.
6. Salve e mostre as três novas linhas na listagem e na agenda.

## Fechamento

Uma configuração, vários dias e nenhuma repetição. É assim que um cadastro operacional vira um fluxo rápido e seguro.
