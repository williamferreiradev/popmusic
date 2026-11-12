# Roteiro de testes do zero — Entrega Pop Music

**Objetivo:** a escola valida o sistema inteiro partindo de um banco limpo, criando tudo como faria no primeiro dia real de uso. Marque cada item ao concluir; anote falhas com print da tela.

**Antes de começar:** confirmar com o desenvolvedor que (a) o banco foi resetado, (b) o código está publicado na Vercel, (c) as variáveis `INTERNAL_EMAIL_SECRET`, `RESEND_API_KEY` e `NUXT_PUBLIC_APP_URL` estão na Vercel.

**Acesso inicial:** o desenvolvedor entrega o endereço do sistema e a senha da conta de gestão.

---

## Parte 1 — Primeiro acesso e configuração (gestão)

| # | Teste | Como fazer | Resultado esperado |
|---|---|---|---|
| 1.1 | Login e senha provisória | Entrar com a senha entregue | Sistema pede para definir senha nova |
| 1.2 | Senha forte obrigatória | Tentar senha fraca (ex.: `123456`) | Rejeitada com explicação |
| 1.3 | Onboarding obrigatório | Após definir senha | Abre o assistente de 5 etapas sem pular |
| 1.4 | Dados da escola | Nome, CNPJ, endereço, telefone, e-mail, chave PIX | Salvos sem erro |
| 1.5 | Modalidades | Criar 3 (ex.: Violão, Teclado, Canto) com mensalidade | Aparecem na listagem |
| 1.6 | Salas | Criar 2 salas com capacidade | Aparecem na listagem |
| 1.7 | Turmas | Criar turmas com dia, horário, professor, sala | Aparecem na agenda |
| 1.8 | Conflito de horário | Tentar criar 2 turmas mesmo professor, mesmo dia/hora | Bloqueado com mensagem clara |
| 1.9 | Turmas em lote | Criar turma da mesma modalidade em 3 dias de uma vez | Criadas as 3, ou rejeita tudo se 1 conflitar |

## Parte 2 — Professores

| # | Teste | Como fazer | Resultado esperado |
|---|---|---|---|
| 2.1 | Cadastro de professor | Nome, telefone, e-mail, comissão (percentual ou fixo), PIX | Credenciais de acesso exibidas na tela (copiar!) |
| 2.2 | Login do professor | Celular/navegador do professor, senha provisória | Pediu senha nova, entrou no portal do professor |
| 2.3 | Isolamento do professor | Conferir que só vê as próprias turmas/agenda | Sem dados de outros professores |
| 2.4 | Professor não acessa o ADM | Digitar a URL `/dashboard` | Redirecionado ao portal dele |

## Parte 3 — Matrícula e contrato (fluxo completo, com dados reais de um aluno de verdade)

| # | Teste | Como fazer | Resultado esperado |
|---|---|---|---|
| 3.1 | Aluno MAIOR de idade | Nova matrícula: dados completos + endereço com CEP, modalidade, turma, dia de vencimento | Matrícula salva; contrato gerado |
| 3.2 | Envio do link | Conferir caixa de entrada do e-mail do aluno | Recebeu o link de assinatura |
| 3.3 | Link alternativo | Se o e-mail não chegar: botão "copiar link" no ADM | Link abre a mesma página |
| 3.4 | Assinatura no celular | Abrir o link no celular do aluno | Contrato legível, botão de assinar com câmera |
| 3.5 | Câmera obrigatória | Tentar adiantar sem foto | Não deixa; pede permissão de câmera |
| 3.6 | Foto inválida | Apontar para parede/objeto | Rejeita ("nenhum rosto identificado") |
| 3.7 | Assinatura válida | Foto do rosto + aceitar os dois termos | Confirmação de sucesso + chave PIX na tela |
| 3.8 | Reassinar o mesmo link | Reabrir o link já usado | Bloqueado ("contrato já assinado") |
| 3.9 | E-mail de confirmação | Caixa de entrada do aluno | Recebeu confirmação com instruções |
| 3.10 | 12 parcelas | ADM → Financeiro → Cobranças | 12 mensalidades do aluno, vencendo no dia escolhido |
| 3.11 | Aluno na agenda | ADM → Agenda | Aluno aparece na turma/horário |
| 3.12 | Portal do aluno | Login do aluno (senha definida pelo ADM em Configurações se precisar) | Vê aulas, frequência, cobranças e contrato — só os dele |

## Parte 4 — Menor de idade

| # | Teste | Como fazer | Resultado esperado |
|---|---|---|---|
| 4.1 | Menor SEM responsável | Tentar matricular nascido há menos de 18 anos sem dados do responsável | Bloqueado |
| 4.2 | Menor COM responsável | Preencher responsável completo | Matrícula criada; contrato em nome do responsável identificando o aluno |
| 4.3 | Assinatura do responsável | Repetir 3.4–3.9 com o responsável | Mesmo fluxo completo |

## Parte 5 — Frequência e chamada

| # | Teste | Como fazer | Resultado esperado |
|---|---|---|---|
| 5.1 | Chamada do professor | Professor → Chamada → marcar presente/falta → Salvar | Persiste ao recarregar |
| 5.2 | Finalizar chamada | Botão finalizar → confirmar | Edição travada |
| 5.3 | Tentar editar após finalizar | Recarregar e tentar mudar um status | Bloqueado |
| 5.4 | Reabertura pela gestão | ADM → Frequência → reabrir com motivo | Reaberta; professor volta a editar |
| 5.5 | Falta justificada | Justificar uma falta com motivo | Registrada |

## Parte 6 — Financeiro

| # | Teste | Como fazer | Resultado esperado |
|---|---|---|---|
| 6.1 | Contas financeiras | Criar conta (ex.: Caixa) com saldo inicial | Aparece no seletor |
| 6.2 | Baixa manual | Cobrança → Registrar pagamento (forma PIX, conta criada) | Status muda para paga; recibo gerado; entrada no caixa |
| 6.3 | Baixa duplicada | Tentar pagar de novo a mesma cobrança | Bloqueado |
| 6.4 | Recibo | Visualizar/imprimir o recibo | Timbrado, valor por extenso, PIX da escola |
| 6.5 | Reenvio de recibo | Enviar por e-mail | Chega na caixa do aluno |
| 6.6 | Estorno | Estornar um pagamento com motivo | Cobrança volta, saída no caixa, recibo marcado como estornado |
| 6.7 | Cobrança avulsa | Criar cobrança manual (ex.: material) | Aparece nas cobranças |
| 6.8 | Fluxo de caixa | Conferir extrato | Entradas/saídas batem com o histórico |

## Parte 7 — Repasse de professores

| # | Teste | Como fazer | Resultado esperado |
|---|---|---|---|
| 7.1 | Cálculo | ADM → Financeiro → Repasses após pagar 1 mensalidade | Valor calculado conforme a comissão do professor |
| 7.2 | Só mensalidade paga | Conferir que cobrança pendente não entra no cálculo | Correto |
| 7.3 | Marcar como pago | Registrar pagamento com conta e forma | Saída correspondente no caixa |
| 7.4 | Visão do professor | Portal do professor → Repasse | Mesmo valor, somente leitura |
| 7.5 | Isolamento | Com 2 professores, conferir que um não vê repasse do outro | Correto |

## Parte 8 — Relatórios

| # | Teste | Como fazer | Resultado esperado |
|---|---|---|---|
| 8.1 | Relatório pronto | Alunos ativos | Lista com os alunos reais |
| 8.2 | Construtor | Criar relatório de cobranças pagas no mês | Dados reais, com paginação |
| 8.3 | CSV | Exportar | Abre no Excel com acentos corretos |
| 8.4 | Filtro salvo | Salvar um filtro com nome | Recupera ao reabrir |

## Parte 9 — Segurança (tentativas que DEVEM falhar)

| # | Teste | Como fazer | Resultado esperado |
|---|---|---|---|
| 9.1 | Sem login | Abrir o endereço em aba anônima | Vai para o login |
| 9.2 | Rota de outro papel | Aluno tenta `/professor` e `/dashboard` | Redirecionado ao portal dele |
| 9.3 | Link expirado | Pedir ao ADM para gerar contrato e esperar expiração (ou testar com token alterado) | Mensagem de link inválido/expirado |
| 9.4 | Sessão encerrada | Desativar um acesso no ADM; usuário tenta usar | Bloqueado no próximo acesso |

## Parte 10 — Fechamento da validação

- [ ] Nenhum erro no console do navegador nas telas usadas (F12 → Console)
- [ ] Testado em celular E computador
- [ ] Conferência de valores: soma das cobranças = soma dos recibos = entradas no caixa
- [ ] Registro de defeitos encontrados (tela, o que fez, o que esperava, o que aconteceu)
- [ ] Aprovação formal da responsável pela escola

**O que NÃO faz parte desta validação (fases futuras):** WhatsApp automático, PIX com baixa automática, assistente IA, check-in QR, notificações automáticas.
