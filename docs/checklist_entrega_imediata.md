# Checklist de entrega imediata

Este documento contém somente o necessário para colocar a primeira versão em uso. Funcionalidades futuras, como Assistente OpenAI, áudio, WhatsApp automático, QR Code e relatórios avançados, não bloqueiam esta entrega.

## Validado tecnicamente

- [x] Aplicação publicada em HTTPS na Vercel.
- [x] Rota inicial redireciona para o login e a tela de login responde corretamente.
- [x] Testes automatizados: 72 aprovados, nenhuma falha (04/09/2026).
- [x] TypeScript/typecheck sem erros (04/09/2026).
- [x] ESLint sem erros (04/09/2026).
- [x] Portal do aluno diferencia falha de carregamento de estado vazio e mantém tabelas financeiras utilizáveis no celular.
- [x] Frontend e servidor compilam; o empacotamento local para apenas no `EPERM readlink` do Windows/OneDrive.
- [x] Build em ambiente externo confirmado pela implantação funcional da Vercel.

## Bloqueadores antes de liberar para uso real

- [x] Executar `docs/sql/auditoria_final_supabase.sql` no Supabase e guardar o resultado (`docs/evidencias/auditoria_supabase_2026-09-04.md`).
- [x] Confirmar migrações aplicadas no banco de produção até `033`, incluindo segurança e cancelamento sem fidelidade.
- [ ] Aplicar a migração `034`, que bloqueia alterações do professor depois da chamada finalizada.
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
