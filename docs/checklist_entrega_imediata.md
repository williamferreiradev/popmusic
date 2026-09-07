# Checklist de entrega imediata

Este documento contém somente o necessário para colocar a primeira versão em uso. Funcionalidades futuras, como Assistente OpenAI, áudio, WhatsApp automático, QR Code e relatórios avançados, não bloqueiam esta entrega.

## Validado tecnicamente

- [x] Aplicação publicada em HTTPS na Vercel.
- [x] Rota inicial redireciona para o login e a tela de login responde corretamente.
- [x] Testes automatizados: 118 aprovados, nenhuma falha (07/09/2026).
- [x] TypeScript/typecheck sem erros (04/09/2026).
- [x] ESLint sem erros (04/09/2026).
- [x] Portal do aluno diferencia falha de carregamento de estado vazio e mantém tabelas financeiras utilizáveis no celular.
- [x] CRUDs de modalidades e salas validam os dados, mostram falhas reais e impedem comandos repetidos durante a gravação.
- [x] Agenda mantém os vínculos ao editar turmas, valida a capacidade da sala e não mascara falhas do banco.
- [x] Lista de alunos diferencia erro e vazio, reduz consultas na busca e mantém filtros e paginação consistentes.
- [x] Assinatura distingue links indisponíveis de falhas temporárias, bloqueia reaceite e informa o resultado real do e-mail.
- [x] Financeiro dos professores não simula WhatsApp ou ajuste local e protege o pagamento contra repetição.
- [x] Relatórios expõem somente consultas conectadas ao banco e exportação CSV real, sem filtros, dados ou PDF simulados.
- [x] Modelo de contrato é versionado em transação, mantém a versão anterior em caso de falha e só confirma sucesso real.
- [x] Reenvio de recibo oferece apenas e-mail real, mantém o modal aberto durante falhas e bloqueia envio repetido.
- [x] Relatórios não inventam frequência ou pagamento, filtram vínculos ativos e exibem falhas reais do Supabase.
- [x] Edição de aluno e turmas usa uma transação; formulários preservam o contexto e mostram erros sem `alert()`.
- [x] Dashboard mostra nas próximas turmas somente horários ainda em andamento/futuros com alunos ativos.
- [x] Nova matrícula atualiza turmas ao abrir, normaliza modalidade e explica a diferença entre sala e turma; inputs respeitam o tema.
- [x] Aluno pode ser cancelado ou excluído definitivamente; a exclusão total é transacional, restrita à gestão e confirmada separadamente.
- [x] Professor aceita PIX e CPF opcional; exclusão remove turmas vazias, mas protege histórico de aulas e finanças.
- [x] Modalidade sem turmas pode ser excluída; criar modalidade abre o cadastro de sala com seleção automática.
- [x] Relatórios consultam dados reais, incluem contratos cancelados e exportam CSV UTF-8.
- [x] Frontend e servidor compilam; o empacotamento local para apenas no `EPERM readlink` do Windows/OneDrive.
- [x] Build em ambiente externo confirmado pela implantação funcional da Vercel.

## Bloqueadores antes de liberar para uso real

- [x] Executar `docs/sql/auditoria_final_supabase.sql` no Supabase e guardar o resultado (`docs/evidencias/auditoria_supabase_2026-09-04.md`).
- [x] Confirmar migrações aplicadas no banco de produção até `033`, incluindo segurança e cancelamento sem fidelidade.
- [ ] Aplicar a migração `034`, que bloqueia alterações do professor depois da chamada finalizada.
- [x] Migração `035` aplicada: modelo de contrato salvo e ativado de forma transacional.
- [ ] Aplicar a migração `036`, que atualiza aluno e turmas em uma única transação.
- [ ] Aplicar a migração `037`, que permite à gestão excluir definitivamente todo o grafo de um aluno.
- [ ] Aplicar a migração `038`, que adiciona PIX, CPF opcional e exclusão segura de professor.
- [ ] Aplicar a migração `039`, que permite excluir modalidade sem histórico.
- [ ] Confirmar no Supabase as URLs de redirecionamento do domínio de produção.
- [ ] Fazer backup do banco antes da homologação.
- [x] Validar que o bucket `fotos_alunos` existe e não é público (confirmado pela auditoria).
- [ ] Rotacionar a senha e qualquer chave que tenha sido compartilhada durante o desenvolvimento.

## Homologação rápida — administrador

- [ ] Entrar com uma conta administrativa real.
- [ ] Criar um aluno maior, escolher modalidade/turma e concluir a matrícula.
- [ ] Confirmar contrato e 12 cobranças sem duplicidade.
- [ ] Criar um aluno menor e confirmar a obrigatoriedade do responsável.
- [ ] Assinar um contrato pelo celular usando a foto.
- [ ] Registrar uma mensalidade como paga e conferir recibo e fluxo de caixa.
- [ ] Conferir se o pagamento entrou no cálculo de repasse do professor.
- [ ] Conferir agenda diária, semanal e mensal e o popup dos alunos.

## Homologação rápida — professor e aluno

- [ ] Professor entra e enxerga somente suas turmas e seus alunos.
- [ ] Professor registra/finaliza uma chamada e a presença continua após recarregar.
- [ ] Professor enxerga somente o próprio repasse.
- [ ] Aluno/responsável entra e enxerga somente seus dados, turmas, cobranças e contrato.
- [ ] Testar sessão expirada, convite inválido e tentativa de acesso a uma rota de outro papel.

## Entrega

- [ ] Corrigir apenas falhas bloqueadoras encontradas na homologação.
- [ ] Cadastrar os dados reais da escola e retirar registros de demonstração.
- [ ] Entregar endereço e contas de acesso.
- [ ] Fazer uma matrícula, uma assinatura, uma chamada e um pagamento junto com a responsável.
- [ ] Registrar a aprovação da responsável pela escola.

## Fora da primeira entrega

- Assistente OpenAI e transcrição de áudio.
- WhatsApp automático e pagamento automático.
- QR Code, reposições avançadas e relatórios personalizados.
- Monitoramento avançado, alertas e indicadores de evasão.
