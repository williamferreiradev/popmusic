# Checklist mestre de entrega — Pop Music

> Objetivo: levar o sistema da situação atual até uma entrega segura e utilizável pela escola.
>
> Prioridades: **P0 bloqueia a entrega**, **P1 necessário para operação confiável**, **P2 melhoria posterior**.

## Como usar

- [ ] Atribuir um responsável e uma data para cada item P0 e P1.
- [ ] Executar primeiro em ambiente de homologação, nunca diretamente em produção.
- [ ] Anexar evidência ao concluir: captura de tela, vídeo curto, log ou registro no banco.
- [ ] Considerar concluído somente quando implementação e teste estiverem marcados.
- [ ] Registrar defeitos encontrados com: tela, usuário, passos, resultado esperado e resultado obtido.

## 0. Decisões de negócio que precisam ser confirmadas — P0

- [ ] Confirmar os papéis existentes: gestão, secretaria, professor e aluno.
- [ ] Definir exatamente o que a secretaria pode visualizar, criar, editar, excluir e receber.
- [ ] Definir se professor pode alterar chamada depois de finalizá-la e por quanto tempo.
- [ ] Definir quem pode justificar ausência e agendar reposição.
- [x] Definir que presença e falta são informativas e não liberam o repasse sem mensalidade paga.
- [x] Definir cálculo do professor por percentual da mensalidade ou valor fixo por aluno pago.
- [x] Disponibilizar o repasse após a baixa da mensalidade e exigir confirmação manual da gestão.
- [ ] Definir regras de vencimento, multa, juros, desconto e tolerância.
- [ ] Definir o que ocorre financeiramente ao trancar, cancelar ou trocar uma matrícula.
- [ ] Definir duração, renovação e cancelamento do contrato.
- [ ] Aprovar o texto jurídico do contrato para maior e menor de idade.
- [ ] Confirmar quem assina pelo menor e quais dados do responsável são obrigatórios.
- [ ] Definir política de guarda e exclusão de selfie, CPF e contrato conforme LGPD.
- [ ] Escolher o provedor oficial de WhatsApp.
- [ ] Confirmar domínio, e-mail remetente, nome, CNPJ, endereço, telefone e chave PIX oficiais.

## 1. Banco de dados e migrações — P0

- [ ] Fazer backup completo do banco atual antes de aplicar novas migrações.
- [ ] Executar `docs/sql/auditoria_final_supabase.sql` e guardar o CSV do resultado (SQL somente leitura já preparado).
- [ ] Corrigir matrículas ativas duplicadas.
- [ ] Corrigir presenças duplicadas por aluno, turma, data e tipo.
- [ ] Corrigir contratos assinados sem data ou hash.
- [ ] Aplicar as constraints de integridade somente depois da limpeza.
- [ ] Confirmar chaves estrangeiras e comportamento de exclusão de todas as tabelas.
- [ ] Confirmar índices para buscas por aluno, professor, turma, vencimento e status.
- [ ] Verificar se todas as tabelas sensíveis estão com RLS habilitada.
- [ ] Confirmar que `anon` não acessa alunos, contratos, cobranças, recibos ou presenças.
- [ ] Confirmar que `service_role` existe somente no servidor e nas Edge Functions.
- [x] Verificar e alinhar o uso de `vw_professor_agenda`, dados relacionais de alunos e `vw_professor_meu_repasse` com as colunas reais.
- [ ] Garantir que as views do professor respeitem RLS ou usem `security_invoker`.
- [ ] Criar migração versionada para qualquer view ou função que hoje exista apenas no banco remoto.
- [x] Atualizar os tipos TypeScript para refletir o esquema implantado até a migration 028.
- [ ] Testar restauração do backup em um projeto de homologação.

## 2. Autenticação e níveis de acesso — P0

- [x] Remover o fallback que considera usuário sem perfil como gestão.
- [x] Bloquear usuário autenticado que não tenha registro válido em `usuarios`.
- [x] Bloquear usuário com `ativo = false`.
- [x] Direcionar gestão para `/dashboard`.
- [x] Direcionar professor para `/professor`.
- [x] Direcionar aluno para `/aluno`.
- [ ] Definir e implementar o destino da secretaria.
- [ ] Corrigir a inconsistência entre acesso da secretaria no middleware e nas políticas RLS.
- [x] Impedir professor de abrir qualquer rota administrativa digitando a URL.
- [x] Impedir aluno de abrir rotas de professor ou administração.
- [x] Cobrir automaticamente os redirecionamentos e bloqueios de rota dos três papéis.
- [ ] Impedir secretaria de abrir configurações e financeiro caso não tenha permissão.
- [x] Garantir que esconder um botão não seja o único controle de segurança.
- [x] Validar sessão no servidor e testar redirecionamento ao login quando estiver expirada.
- [x] Implementar solicitação de recuperação de senha com resposta neutra.
- [x] Implementar definição de senha forte no primeiro acesso por convite.
- [x] Bloquear convite expirado, já utilizado ou inválido validando o token no servidor; homologação real permanece no roteiro funcional.
- [x] Confirmar e testar a política de senha forte no primeiro acesso e na recuperação.
- [ ] Configurar e testar proteção contra tentativas repetidas de login.

## 3. Convites e gerenciamento de usuários — P0

- [x] Exigir JWT válido na função `convidar-usuario`.
- [x] Verificar dentro da função se o solicitante é gestão.
- [x] Validar uma lista fechada de papéis permitidos.
- [x] Impedir autoelevação de privilégio.
- [x] Restringir CORS ao domínio oficial e à homologação.
- [x] Validar nome e formato do e-mail no servidor.
- [x] Tratar conta já vinculada sem criar um segundo usuário, oferecendo recuperação de acesso.
- [x] Vincular usuário convidado ao registro correto de professor.
- [x] Executar compensação no convite: se perfil ou vínculo falhar, remover o usuário de autenticação órfão.
- [x] Permitir reenviar acesso com segurança somente pela gestão e para professor vinculado.
- [x] Permitir desativar acesso sem apagar histórico operacional.
- [x] Registrar quem criou, convidou, reenviou acesso, alterou ou desativou um usuário.

## 4. Cadastro e acesso do professor — P0

- [x] Ao criar professor, salvar nome, CPF, telefone, e-mail e forma de repasse em uma transação.
- [x] Validar CPF e e-mail duplicados, inclusive em requisições simultâneas.
- [x] Vincular modalidades ativas que o professor ensina na mesma transação.
- [x] Criar convite de acesso ao salvar ou por uma ação explícita.
- [x] Preencher `professores.usuario_id` com o usuário autenticado correto.
- [x] Mostrar na listagem se a conta do professor está vinculada.
- [x] Permitir reenvio do acesso/recuperação para a conta vinculada.
- [x] Permitir bloquear acesso preservando turmas, chamadas e repasses.
- [x] Impedir inativação do professor com turma ativa, exigindo realocação ou desativação prévia.
- [ ] Testar alteração da forma e do valor de repasse sem mudar períodos já fechados.

## 5. Portal do professor — P0

- [x] Remover todas as turmas e alunos simulados da tela de chamada.
- [x] Carregar somente turmas pertencentes ao professor autenticado.
- [x] Exibir agenda real por data e horário.
- [x] Exibir modalidade, sala, capacidade e quantidade de matriculados.
- [x] Exibir somente alunos com matrícula ativa na turma.
- [x] Carregar chamada já registrada ao reabrir a aula.
- [x] Permitir marcar presente, falta e falta justificada.
- [x] Salvar cada presença no banco com aluno, turma, data, tipo e usuário responsável.
- [x] Impedir presença duplicada por aluno, turma, data e tipo usando índice único no banco.
- [x] Permitir marcar todos presentes, exigir confirmação e persistir cada registro.
- [x] Implementar finalização da chamada.
- [x] Bloquear alterações do professor depois da finalização.
- [x] Permitir que somente a gestão reabra uma chamada finalizada com motivo obrigatório.
- [x] Preservar histórico de finalização e reabertura sem apagar registros anteriores.
- [x] Carregar feriados reais da tabela, removendo dias simulados.
- [ ] Implementar falta do professor e efeito no repasse.
- [x] Retirar temporariamente a reposição fictícia da interface do professor até existir agenda real.
- [x] Garantir que professor não veja telefone, CPF, endereço ou dados de saúde na listagem de alunos.
- [x] Exibir lista real de alunos e vínculos ativos do professor.
- [x] Exibir repasse real, separado por competência e status.
- [ ] Definir se professor apenas visualiza ou confirma recebimento.
- [x] Criar estado vazio, carregamento e erro nas telas principais do portal do professor.

## 6. Administração: alunos e matrículas — P0

- [x] Validar nome, CPF, nascimento, telefone e e-mail no banco durante a matrícula.
- [x] Calcular maioridade usando a data atual e a data de nascimento completa.
- [x] Exigir dados do responsável quando o aluno for menor.
- [x] Impedir CPF duplicado do aluno no fluxo transacional, inclusive em requisições simultâneas.
- [ ] Avaliar e tratar responsável por mais de um aluno.
- [x] Listar todas as modalidades ativas no seletor.
- [x] Após escolher a modalidade, listar somente turmas compatíveis e ativas.
- [x] Mostrar dia, horário, professor, sala e vagas disponíveis no card da turma.
- [x] Impedir matrícula em turma lotada com bloqueio transacional da turma.
- [x] Impedir duas matrículas ativas iguais para aluno e turma.
- [x] Garantir transação ou rollback se aluno, vínculos de turma ou contrato falharem; cobranças são criadas somente após assinatura.
- [x] Permitir editar dados sem apagar matrículas indevidamente.
- [x] Implementar troca de turma encerrando o vínculo anterior e preservando histórico.
- [x] Implementar trancamento, destrancamento e cancelamento com data, motivo e regras financeiras.
- [x] Substituir exclusão física de aluno pela inativação transacional com preservação do histórico.
- [ ] Testar busca, filtros, paginação e estados sem dados.

## 7. Modalidades, salas, professores e turmas — P0

- [ ] Testar criação, edição, inativação e reativação de modalidade.
- [x] Impedir modalidade duplicada ou definir a regra para nomes iguais.
- [ ] Testar criação, edição, inativação e reativação de sala.
- [x] Validar capacidade da sala maior que zero.
- [x] Impedir conflito de sala no mesmo dia e horário, inclusive em gravações simultâneas.
- [x] Impedir conflito de professor no mesmo dia e horário, inclusive em gravações simultâneas.
- [x] Validar horário inicial anterior ao final.
- [x] Impedir capacidade da turma acima da capacidade da sala ou abaixo dos matriculados atuais.
- [x] Impedir inativação de catálogo usado por turma ativa sem tratamento.
- [x] Implementar criação, edição e inativação transacional de turma; teste funcional remoto permanece no roteiro de homologação.
- [x] Atualizar a agenda imediatamente após salvar ou desativar uma turma.
- [x] Garantir que turmas inativas não apareçam em novas matrículas.

## 8. Contrato e assinatura — P0

- [ ] Aprovar texto e dados fixos do contrato com a escola e responsável jurídico.
- [x] Para maior, usar os dados do próprio aluno como contratante.
- [x] Para menor, usar os dados do responsável como contratante e identificar o aluno.
- [x] Confirmar modalidade, horários das turmas, valor, vencimento e duração no documento.
- [x] Gerar o token inicial da matrícula com `gen_random_bytes`, sem `Math.random()`.
- [x] Definir expiração de sete dias para o link inicial de assinatura.
- [x] Impedir reutilização do token depois da assinatura.
- [x] Impedir duas assinaturas simultâneas do mesmo contrato com bloqueio de linha.
- [x] Validar contrato inexistente, cancelado, expirado e já assinado.
- [x] Solicitar consentimento explícito para captura e armazenamento da foto e registrá-lo junto da assinatura transacional.
- [x] Validar câmera recusada, indisponível, ocupada, incompatível e interrompida.
- [x] Validar tamanho, formato, estrutura, dimensões e qualidade visual mínima da imagem.
- [x] Não chamar captura de selfie de biometria se não houver verificação biométrica real.
- [x] Guardar data, hora, IP, agente do navegador, hash criptográfico e caminho da evidência.
- [x] Salvar a foto no bucket privado sem gerar URL pública.
- [x] Gerar via imutável do contrato assinado com snapshot e hash SHA-256 protegido contra alterações.
- [x] Permitir baixar ou visualizar a via assinada usando o snapshot histórico e a foto privada temporária.
- [x] Registrar renovação e histórico de versões, preservando a via anterior; cancelamento permanece registrado no ciclo da matrícula.

## 9. Cobranças, pagamentos e financeiro — P0

- [x] Gerar automaticamente as 12 cobranças previstas quando o contrato é assinado.
- [x] Garantir que a geração seja idempotente e não crie duplicatas.
- [x] Gerar primeira competência no mês do aceite, com vencimento configurado, e total de 12 parcelas.
- [ ] Testar mensalidade, matrícula, material, desconto e cobrança avulsa.
- [x] Implementar baixa manual com data, forma, conta e observação, sem gateway automático.
- [x] Impedir baixa manual duplicada com bloqueio de linha no banco.
- [x] Gerar recibo somente após pagamento manual confirmado.
- [x] Manter cobrança, recibo e fluxo de caixa na mesma transação.
- [x] Implementar cancelamento e estorno transacionais preservando recibo, caixa e auditoria; teste funcional remoto permanece no roteiro.
- [x] Exibir pendente, paga, atrasada ou cancelada; pagamento parcial não faz parte do escopo atual.
- [x] Implementar filtros por período, aluno, status e forma de pagamento; turma exige vínculo próprio no modelo e o teste funcional permanece no roteiro.
- [x] Calcular os totais do dashboard por função SQL direta; validação funcional com dados de produção permanece no roteiro.
- [x] Remover chave PIX fixa das telas de cobrança, assinatura e recibo.
- [x] Carregar PIX e dados institucionais de `configuracoes.escola`.
- [x] Restringir acesso financeiro em middleware, RLS, views e funções conforme o papel ativo do usuário.

## 10. Repasse dos professores — P0

- [x] Implementar valor fixo por aluno e percentual da mensalidade.
- [x] Congelar a regra, valor-base, valor configurado e itens usados em cada competência.
- [x] Usar mensalidade paga e vínculo ativo do aluno com a turma como base do repasse; chamadas finalizadas permanecem informativas.
- [ ] Tratar matrícula no meio do mês, cancelamento, trancamento e desconto.
- [ ] Tratar falta do professor e reposição.
- [x] Gerar detalhamento por professor, aluno, turma, modalidade e aulas finalizadas.
- [x] Calcular o cabeçalho do repasse pela soma dos itens no banco.
- [x] Registrar pagamento, data, conta e responsável em uma única transação.
- [x] Impedir pagamento duplicado do mesmo item e permitir repasse complementar para mensalidades pagas posteriormente.
- [x] Exibir ao professor somente os próprios valores por RLS.
- [ ] Testar ajuste manual com motivo e log de auditoria.

## 11. E-mail e WhatsApp — P0 para e-mail, P1 para WhatsApp se acordado

- [ ] Configurar `RESEND_API_KEY` no servidor de produção.
- [ ] Validar domínio e remetente no Resend.
- [x] Não retornar sucesso quando o provedor de e-mail não estiver configurado.
- [x] Verificar `response.ok` e tratar falhas HTTP do provedor.
- [x] Registrar tentativa, destinatário mascarado, provedor, status e código de erro.
- [ ] Testar e-mail de contrato, confirmação, recibo e reenvio.
- [ ] Testar endereço inválido, rejeição, timeout e indisponibilidade do provedor.
- [ ] Escolher e configurar o provedor de WhatsApp.
- [ ] Aprovar templates de WhatsApp quando o provedor exigir.
- [ ] Normalizar telefones no padrão internacional.
- [ ] Registrar enviado, entregue, lido e erro quando disponível.
- [ ] Implementar retentativa controlada sem duplicar mensagens.
- [x] Manter a chave do Resend e o segredo de chamada interna somente no servidor.

## 12. Segurança e LGPD — P0

- [ ] Revisar todas as políticas RLS com uma matriz papel × tabela × operação.
- [ ] Testar acesso direto pelo cliente Supabase, não apenas pelos menus.
- [x] Proteger envio inicial por perfil de gestão e confirmação por segredo interno do servidor.
- [x] Proteger endpoint público de assinatura com token forte, validade e limite persistente de tentativas por token e IP.
- [x] Validar destinatários e URLs recebidos pelos endpoints de e-mail.
- [x] Escapar entradas dinâmicas antes de interpolar no HTML dos e-mails.
- [x] Remover segredos, dados pessoais, fotos, destinatários e tokens dos logs do servidor.
- [x] Configurar cabeçalhos de segurança no aplicativo; HTTPS ainda deve ser validado na hospedagem.
- [x] Revisar bucket de fotos, limite de upload, MIME e acesso público; evidências ficam privadas e são exibidas por URL temporária.
- [x] Criar log automático e imutável para alterações sensíveis, removendo tokens, fotos, CPF e contatos das cópias de auditoria.
- [ ] Documentar finalidade, base legal, retenção e exclusão dos dados pessoais.
- [ ] Criar procedimento para exportação e exclusão de dados do titular.
- [ ] Definir responsáveis por incidentes e vazamentos.
- [ ] Rotacionar qualquer chave que tenha sido exposta durante o desenvolvimento.

## 13. Qualidade visual e acessibilidade — P1

- [ ] Testar todas as páginas em 360 px, 390 px, tablet, notebook e desktop.
- [ ] Garantir que nenhuma página tenha conteúdo inacessível fora da tela.
- [ ] Adicionar rolagem horizontal controlada às tabelas em telas pequenas.
- [ ] Conferir menu recolhido e expandido em todas as rotas.
- [ ] Conferir modais em telas pequenas e com teclado aberto.
- [ ] Padronizar títulos, espaçamentos, botões, campos, alertas e estados vazios.
- [ ] Verificar tema claro e escuro.
- [ ] Garantir contraste suficiente de texto e controles.
- [ ] Adicionar rótulos acessíveis e navegação por teclado.
- [ ] Manter foco dentro dos modais e devolver foco ao fechá-los.
- [ ] Substituir `alert()` por feedback visual padronizado.
- [ ] Revisar textos, acentuação, mensagens de erro e nomes da escola.
- [ ] Testar Chrome, Edge, Safari e navegador móvel.

## 14. Testes funcionais por fluxo — P0

### Fluxo A — Maior de idade

- [ ] Criar aluno maior de idade.
- [ ] Escolher modalidade e turma com vaga.
- [ ] Confirmar matrícula criada uma única vez.
- [ ] Confirmar contrato com dados do aluno.
- [ ] Confirmar cobranças corretas.
- [ ] Confirmar recebimento do link.
- [ ] Assinar com foto.
- [ ] Confirmar contrato assinado e bloqueado contra nova assinatura.
- [ ] Confirmar aluno na agenda e chamada do professor.

### Fluxo B — Menor de idade

- [ ] Criar aluno menor sem responsável e confirmar bloqueio.
- [ ] Criar aluno menor com responsável completo.
- [ ] Confirmar responsável como contratante.
- [ ] Confirmar identificação do menor no contrato.
- [ ] Enviar mensagens ao contato correto.
- [ ] Assinar e validar todas as evidências.

### Fluxo C — Professor

- [ ] Convidar professor.
- [ ] Definir senha e entrar.
- [ ] Confirmar que vê somente suas turmas.
- [ ] Confirmar que vê somente seus alunos.
- [ ] Fazer chamada real e recarregar a página.
- [ ] Confirmar persistência da presença.
- [ ] Tentar alterar chamada de outro professor e confirmar bloqueio.
- [ ] Consultar apenas o próprio repasse.

### Fluxo D — Pagamento

- [ ] Localizar cobrança pendente.
- [ ] Registrar pagamento.
- [ ] Confirmar recibo e fluxo de caixa.
- [ ] Repetir a operação e confirmar bloqueio de duplicidade.
- [ ] Estornar/cancelar conforme regra e conferir histórico.

### Fluxo E — Exceções

- [ ] Testar turma cheia.
- [ ] Testar conflito de professor e sala.
- [ ] Testar CPF e e-mail duplicados.
- [ ] Testar perda de internet durante cadastro e assinatura.
- [ ] Testar e-mail e WhatsApp indisponíveis.
- [ ] Testar usuário inativo, sessão expirada e convite inválido.
- [ ] Testar contrato expirado, inexistente e já assinado.
- [ ] Testar duas pessoas confirmando a mesma operação simultaneamente.

## 15. Testes automatizados e técnicos — P1

- [x] Adicionar script de typecheck e dependências necessárias.
- [x] Executar o typecheck completo sem erros (`npm run typecheck`).
- [x] Adicionar ESLint e comandos de lint/formatação automática ao projeto.
- [x] Executar o lint completo sem erros; usos legados de `any` permanecem registrados como avisos para correção gradual.
- [x] Criar testes unitários para maioridade, valores, vencimentos e repasses.
- [x] Criar testes de contrato de integração para matrícula, assinatura, cobrança e presença sem alterar a produção.
- [ ] Criar testes de integração para matrícula, contrato, cobrança e presença.
- [x] Criar testes de contrato das políticas RLS para gestão, professor, aluno e visitante anônimo.
- [ ] Executar testes RLS com usuários reais de homologação para cada papel.
- [ ] Criar testes end-to-end para os cinco fluxos principais.
- [ ] Executar build limpo em ambiente sem a restrição local de `readlink`.
- [ ] Verificar erros e avisos do console do navegador.
- [ ] Medir tempo de carregamento das páginas mais utilizadas.
- [ ] Testar volume maior de alunos, cobranças, turmas e presenças.
- [ ] Aplicar paginação no servidor em todas as listagens grandes (alunos, contratos, cobranças e recibos concluídos; fluxo de caixa pendente).

## 16. Ambiente, implantação e operação — P0

- [ ] Criar ambientes separados de desenvolvimento, homologação e produção.
- [ ] Configurar variáveis de ambiente no provedor de hospedagem.
- [ ] Configurar URLs de redirecionamento do Supabase.
- [ ] Configurar domínio e HTTPS.
- [ ] Aplicar migrações na ordem correta e registrar a versão implantada.
- [ ] Implantar Edge Functions e seus segredos.
- [ ] Configurar e validar buckets de armazenamento.
- [ ] Criar usuário administrador inicial com segurança.
- [ ] Configurar monitoramento de erros do frontend, servidor e funções.
- [ ] Configurar alertas para falha de e-mail, WhatsApp e rotinas críticas.
- [ ] Configurar backup automático e política de retenção.
- [ ] Documentar procedimento de rollback.
- [ ] Fazer teste de restauração antes da entrega.

## 17. Homologação com a escola — P0

- [ ] Cadastrar dados reais da escola e remover dados de demonstração.
- [ ] Cadastrar modalidades, salas, professores e turmas reais.
- [ ] Migrar os alunos atuais com conferência de duplicidades.
- [ ] Conferir saldos e cobranças iniciais.
- [ ] Realizar treinamento da gestão/secretaria.
- [ ] Realizar treinamento de pelo menos um professor.
- [ ] Executar uma matrícula real acompanhada.
- [ ] Executar uma assinatura real acompanhada.
- [ ] Executar uma chamada real acompanhada.
- [ ] Executar um pagamento e recibo acompanhados.
- [ ] Conferir um fechamento e repasse acompanhados.
- [ ] Registrar ajustes solicitados e retestar.
- [ ] Obter aprovação formal da responsável pela escola.

## 18. Entrega e pós-entrega — P1

- [ ] Entregar endereço do sistema e contas de acesso.
- [ ] Entregar manual curto por papel de usuário.
- [ ] Entregar contatos e procedimento de suporte.
- [ ] Definir período de garantia e o que ele cobre.
- [ ] Definir processo de solicitação de melhorias.
- [ ] Acompanhar diariamente os primeiros dias de operação.
- [ ] Conferir erros, mensagens, assinaturas e cobranças após o primeiro dia.
- [ ] Conferir chamadas e repasses após a primeira semana.
- [ ] Conferir fechamento financeiro após o primeiro mês.

## Itens P2 — depois da entrega estável

- [ ] Ativar o Assistente com OpenAI usando ferramentas e confirmação antes de alterações.
- [ ] Adicionar transcrição de áudio no servidor como alternativa ao navegador.
- [ ] Adicionar notificações e lembretes automáticos.
- [ ] Implementar check-in por QR somente após definir regras e segurança.
- [ ] Criar indicadores avançados de evasão, ocupação e inadimplência.
- [ ] Melhorar relatórios personalizados e exportações.
- [ ] Adicionar agenda de reposições mais sofisticada.

## Gate final: pode entregar?

Somente liberar para produção quando todas as respostas abaixo forem **sim**:

- [ ] Todos os itens P0 foram concluídos e têm evidência?
- [ ] Nenhuma tela principal depende de dados simulados?
- [ ] Professor consegue entrar e fazer chamada real?
- [ ] Cada papel acessa somente os próprios dados e operações autorizadas?
- [ ] Matrícula gera contrato e cobranças sem duplicidade?
- [ ] Contrato de maior e menor foi homologado?
- [ ] E-mail real foi recebido e falhas não aparecem como sucesso?
- [ ] Backup e restauração foram testados?
- [ ] Fluxos críticos passaram no celular e no desktop?
- [ ] A responsável da escola aprovou formalmente a homologação?

## Ordem prática recomendada

1. Fechar regras de negócio e matriz de permissões.
2. Corrigir autenticação, RLS e função de convites.
3. Fechar convite e vínculo do professor.
4. Substituir a chamada simulada por dados reais.
5. Validar agenda, alunos e repasses do professor.
6. Tornar matrícula, contrato e cobranças transacionais e idempotentes.
7. Fortalecer assinatura, tokens, armazenamento e LGPD.
8. Configurar e-mail real e depois WhatsApp.
9. Executar testes funcionais, segurança e responsividade.
10. Homologar com a escola, corrigir defeitos e publicar.
