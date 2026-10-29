# Agenda do professor e recuperação de acesso

A área do professor ganhou Minha Agenda, com visões de dia, semana e mês, navegação de período, retorno a hoje, detalhes da aula e acesso à chamada com turma e data selecionadas. O dashboard também aponta para o calendário.

Os dados vêm de `vw_professor_agenda`, que já restringe as turmas ao professor autenticado com RLS. Nenhuma nova permissão ou migration foi necessária. As ocorrências refletem a grade semanal das turmas atualmente ativas; feriados e exceções devem ser confirmados com a gestão. As contagens representam matrículas ativas atualmente, não uma projeção histórica.

No ADM, a ação existente de recuperação ficou identificada como Redefinir senha, com botão para abrir a definição da nova senha sem depender de entrega de e-mail. O link gerado usa o próprio aplicativo e um token temporário no fragmento da URL, validado por `verifyOtp` no Supabase. Isso evita depender do redirecionamento externo que estava devolvendo o usuário ao login. A nova senha continua sendo escolhida pelo usuário; não há senha fixa ou chave mestra.

Validação: 205 testes passaram, typecheck e build concluíram, e o lint dos arquivos alterados não encontrou erros. A agenda semanal foi conferida no navegador local com a sessão do professor João: uma turma de Teclado, quinta-feira, 14h–15h, Sala 2, com os dois alunos de teste. O reset com token novo foi validado localmente; o usuário informou a conclusão da definição da senha e o painel publicado abriu com a conta do professor.

As alterações foram enviadas à branch `codex/corrigir-acessos-repasses`. Isso não confirma publicação na versão de produção.
