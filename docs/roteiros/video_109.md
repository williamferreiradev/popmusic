# Vídeo 109 — O dashboard mostrava turma sem aluno

## Gancho

“Se não existe aluno nessa aula, ela deve ocupar espaço nas próximas turmas?”

## Desenvolvimento

**Tela:** card “Próximas turmas do dia” mostrando uma turma vazia.

**Fala:** “A consulta buscava todas as turmas ativas do dia. Ela contava alunos, mas não usava essa contagem para decidir o que aparecia.”

**Tela:** destacar os filtros por alunos ativos e horário final.

**Fala:** “Agora o dashboard mantém somente turmas com pelo menos uma matrícula ativa e cuja aula ainda não terminou. Assim a gestão enxerga o que realmente ainda vai acontecer hoje.”

**Tela:** mostrar os estados de vazio e erro.

**Fala:** “Também diferenciei um dia sem próximas aulas de uma falha ao consultar o Supabase. Tela vazia e banco indisponível não significam a mesma coisa.”

## Fechamento

**Fala:** “Dashboard bom reduz ruído operacional; ele não lista agenda fantasma.”

**CTA:** “Qual informação precisa aparecer primeiro no painel de uma escola?”

## Cuidados na gravação

- Borrar nomes de alunos e professores.
- Usar uma turma de homologação sem dados pessoais reais.
- Não mostrar URLs internas, tokens ou credenciais.
