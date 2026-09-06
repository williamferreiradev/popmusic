# Plano de teste ponta a ponta — Pop Music

Data: 06/09/2026  
Ambiente: https://popmusic-beige.vercel.app

## Como registrar o resultado

Para cada item, marque `PASSOU` ou `FALHOU`. Se falhar, anote: usuário utilizado, tela, horário, passos, resultado esperado, resultado obtido e captura de tela. Não use CPF ou dados pessoais reais durante a homologação.

## 0. Preparação obrigatória

- [ ] Fazer backup do banco de produção.
- [ ] Aplicar as migrações `034`, `035` e `036`; a `035` já foi confirmada.
- [ ] No Supabase Auth, definir Site URL como `https://popmusic-beige.vercel.app`.
- [ ] Adicionar `https://popmusic-beige.vercel.app/**` às Redirect URLs.
- [ ] Confirmar na Vercel as variáveis de Supabase, URL pública e Resend, sem expor valores.
- [ ] Confirmar remetente/domínio autorizado no Resend.
- [ ] Criar dados exclusivos de homologação: modalidade, sala, professor, turma, aluno maior e aluno menor.
- [ ] Abrir o DevTools e verificar se o console começa sem erros vermelhos.

## 1. Login e proteção de acesso

1. Abra `/` em aba anônima. Deve redirecionar para `/login`.
2. Tente entrar com senha errada. Deve negar sem informar se o e-mail existe.
3. Entre como administrador. Deve abrir `/dashboard`.
4. Com administrador, tente abrir `/professor` e `/aluno`. O acesso deve ser negado ou redirecionado.
5. Saia e confirme que voltar para uma URL interna exige novo login.
6. Abra uma URL interna inexistente ou não autorizada. Ela não pode liberar conteúdo privado.

## 2. Configurações básicas

1. Em Configurações, confira nome, CNPJ, endereço, telefone, e-mail, remetente e PIX da escola.
2. Altere um campo de homologação, salve e recarregue. O valor deve persistir.
3. Teste um valor inválido. Deve aparecer erro e o sistema não pode indicar sucesso.
4. Abra o modelo de contrato, faça uma pequena alteração, salve e recarregue.
5. Confirme que contratos antigos não mudaram e somente contratos novos usam a versão nova.

## 3. Modalidades, salas e professores

1. Crie uma modalidade `TESTE Teclado`.
2. Edite o nome, salve e recarregue.
3. Inative e reative a modalidade.
4. Crie uma sala `TESTE Sala 1` com capacidade 2.
5. Edite, inative e reative a sala.
6. Crie um professor com e-mail exclusivo, modalidade e regra de repasse.
7. Edite telefone, modalidade e repasse; recarregue e confira persistência.
8. Envie o convite do professor e confirme o recebimento real do e-mail.
9. Tente cadastrar CPF ou e-mail já usado. Deve bloquear sem duplicar o registro.

## 4. Turmas e agenda

1. Crie uma turma vinculando modalidade, professor, sala, dia e horário.
2. Confirme a turma nas visões diária, semanal e mensal da agenda.
3. Clique na turma. O popup deve mostrar modalidade, professor, sala e quantidade de alunos.
4. Edite horário ou sala e confirme que os vínculos continuam corretos.
5. Tente criar conflito de horário para o mesmo professor.
6. Tente criar conflito de horário para a mesma sala.
7. Tente matricular mais alunos que a capacidade da sala. O último deve ser bloqueado.

## 5. Matrícula de aluno maior

1. Abra Alunos e clique em Nova matrícula.
2. Informe dados fictícios de uma pessoa com 18 anos ou mais.
3. Escolha uma modalidade e uma turma com vaga.
4. Defina mensalidade e vencimento entre os dias 1 e 28.
5. Conclua uma única vez, mesmo clicando rapidamente duas vezes.
6. Deve surgir apenas um aluno, uma matrícula ativa e um contrato pendente.
7. O link do contrato deve abrir e o e-mail deve indicar envio real ou falha real.
8. Em Contratos, confira nome, valor, vencimento e status.
9. Antes da assinatura, não devem existir mensalidades criadas indevidamente se a regra atual as cria somente no aceite.

## 6. Matrícula de aluno menor

1. Inicie uma matrícula com data de nascimento de menor de 18 anos.
2. Tente concluir sem responsável. O formulário deve bloquear.
3. Preencha nome, CPF e telefone fictícios do responsável.
4. Conclua e abra o contrato.
5. O responsável deve aparecer como contratante e o menor como aluno identificado.
6. O contato usado no envio deve respeitar os dados do responsável definidos pelo fluxo.

## 7. Assinatura do contrato pelo celular

1. Abra o link do aluno maior em um celular real.
2. Confira aluno, modalidade, valor, vencimento e texto antes de aceitar.
3. Negue a câmera uma vez. A página deve informar o problema sem aceitar o contrato.
4. Autorize a câmera, tire a foto e marque os consentimentos exigidos.
5. Assine uma vez. Deve aparecer confirmação real.
6. Atualize a página e tente assinar novamente. O sistema deve bloquear reaceite.
7. No administrador, confira data de aceite, hash/evidência e status aceito.
8. Repita o fluxo para o aluno menor e confirme o responsável como contratante.
9. Teste um token inexistente, expirado e já usado; cada caso deve informar o estado correto.

## 8. Cobranças e pagamento manual

1. Após a assinatura, abra Financeiro > Cobranças.
2. Confirme a quantidade esperada de mensalidades, valores e vencimentos sem duplicidade.
3. Localize uma cobrança pendente e marque manualmente como paga.
4. Escolha conta, forma e data do pagamento.
5. Clique apenas uma vez; tente também duplo clique em um registro de teste.
6. A cobrança deve ficar paga, gerar recibo e criar uma entrada no fluxo de caixa.
7. Recarregue e confirme que tudo persistiu.
8. Tente baixar novamente a mesma cobrança. Deve bloquear duplicidade.
9. Abra o recibo, confira dados e teste impressão.
10. Reenvie por e-mail. O modal só deve fechar após confirmação do servidor.
11. Teste o WhatsApp manual na visualização; deve abrir o aplicativo/site com mensagem pronta.
12. Faça um estorno de teste e confira recibo preservado, histórico e saída no caixa.
13. Cancele uma cobrança pendente e confirme que ela não é contabilizada como recebida.

## 9. Repasse do professor

1. Depois do pagamento do aluno, abra Financeiro > Professores.
2. Confirme que o professor correto recebeu o item de repasse da turma correta.
3. Confira a regra percentual ou fixa cadastrada.
4. Abra o demonstrativo e confira competência, aluno e total.
5. Registre o pagamento do professor em uma conta financeira.
6. Deve surgir uma saída no fluxo de caixa e o saldo pendente deve diminuir.
7. Tente repetir o pagamento. O sistema não pode duplicar o repasse.

## 10. Portal do professor e chamada

1. Abra o convite, defina uma senha forte e entre como professor.
2. O professor deve ver somente suas turmas, alunos e repasses.
3. Tente acessar `/dashboard`, `/aluno` e uma turma de outro professor. Deve bloquear.
4. Abra a chamada da turma na data correta.
5. Marque presente, falta e falta justificada em alunos de teste.
6. Salve, recarregue e confirme persistência.
7. Finalize a chamada.
8. Tente alterá-la após finalizar. Com a migração `034`, deve ser bloqueado.
9. Entre como administrador, reabra a chamada com motivo e confira a auditoria.
10. O professor deve enxergar apenas o próprio repasse, sem CPF ou finanças de terceiros.

## 11. Portal do aluno/responsável

1. Entre com uma conta de aluno ou responsável convidado.
2. Confira a página inicial e a próxima aula.
3. Em Aulas, veja somente as turmas vinculadas.
4. Em Frequência, confirme as presenças lançadas pelo professor.
5. Em Financeiro, confirme cobranças pagas, pendentes, atrasadas ou canceladas.
6. Em Contrato, confira somente o próprio contrato.
7. Tente abrir `/dashboard`, `/professor` ou dados de outro aluno. Deve bloquear.

## 12. Trancamento e cancelamento sem fidelidade

1. Use um aluno de teste com mensalidade paga e outra futura.
2. Tranque a matrícula com motivo; confira remoção da agenda sem apagar histórico.
3. Destranque e confirme restauração correta do vínculo permitido.
4. Cancele a matrícula com motivo.
5. O aluno pode usar o período já pago conforme a regra definida.
6. Pagamentos realizados não são devolvidos automaticamente.
7. Cobranças futuras elegíveis devem ser canceladas.
8. Cobrança vencida ou mês com aula realizada deve seguir a regra de dívida definida.
9. Contrato e matrícula devem ficar cancelados sem apagar histórico, recibos e presenças.

## 13. Relatórios

1. Gere Alunos ativos e compare com a tela de alunos.
2. Confirme que não aparece frequência ou pagamento fixo inventado.
3. Gere Inadimplentes e compare valores e dias com Cobranças.
4. Gere Aniversariantes e confira o mês.
5. Gere Contratos aguardando e compare com Contratos.
6. Exporte CSV, abra o arquivo e confira cabeçalhos, acentos e linhas.
7. Desligue a internet e tente gerar um relatório. Deve aparecer erro, não “zero resultados”.

## 14. Responsividade e navegadores

1. Repita matrícula, assinatura, agenda, chamada e pagamento em 360 px e 390 px.
2. Teste tablet, notebook e desktop.
3. Confira tabelas com rolagem horizontal e botões acessíveis.
4. Teste menu lateral recolhido e expandido.
5. Confira modais com teclado do celular aberto.
6. Teste tema claro e escuro.
7. Teste Chrome, Edge e um navegador móvel; Safari se houver dispositivo Apple.
8. Navegue por teclado e confirme foco visível nos controles principais.

## 15. Falhas e segurança

1. Teste sessão expirada durante uma operação.
2. Teste perda de internet antes de salvar e durante uma assinatura.
3. Teste convite inválido, expirado e já utilizado.
4. Teste usuário desativado.
5. Confirme que mensagens não exibem SQL, stack trace, chave ou token.
6. No console e na aba Network, confirme que a chave secreta do Supabase nunca aparece no navegador.
7. Confirme que fotos ficam em bucket privado e URLs assinadas expiram.
8. Tente acessar diretamente dados de outro papel; menus escondidos não bastam, o banco deve negar.

## 16. Critério de aprovação

A versão pode ser entregue quando: migrações e backup estiverem confirmados; todos os fluxos P0 passarem; não houver erro de console bloqueador; cada papel enxergar somente seus dados; matrícula gerar contrato e cobranças sem duplicidade; chamada persistir e ficar bloqueada após finalização; pagamento gerar recibo, caixa e repasse corretos; e a responsável da escola aprovar matrícula, assinatura, chamada e pagamento acompanhados.

## Fora desta primeira entrega

Assistente OpenAI, transcrição de áudio no servidor, WhatsApp automático, pagamento automático, QR Code, relatórios personalizados e reposições avançadas não devem ser cobrados nesta homologação.
