# Análise completa do projeto Pop Music — Engenharia reversa, checklist e veredito

**Data:** 11/11/2026
**Branch analisada:** `codex/corrigir-acessos-repasses` (commit `ae69ec4`)
**Método:** leitura de todo o repositório — 51 migrations SQL, baseline do banco real (4.335 linhas extraída do pg_catalog), ~39 páginas Vue, 12 rotas de servidor, composables, middleware, 15 suítes de teste, 30+ documentos internos. Verificações executadas no momento: `npm test` (217 testes aprovados, 0 falhas), `npm run lint` (0 erros, 309 avisos de `any`), histórico Git conferido para vazamento de segredos.

---

## PARTE 1 — O que o projeto é e para que serve

### 1.1 Visão em uma frase

Sistema de gestão completo para a **Academia de Música Pop Music** (Novo Gama – GO): matrícula digital com contrato assinado por foto via câmera, financeiro (mensalidades, recibos, fluxo de caixa, repasses de professores), frequência/chamada, agenda e portais separados para gestão, professor e aluno.

### 1.2 Stack técnica

| Camada | Tecnologia |
|---|---|
| Frontend | Nuxt 4.4 (Vue 3.5, SSR), Tailwind CSS (tema dark/neon), TypeScript |
| Backend | Nitro (rotas server `/api/**`), Supabase Auth (SSR cookies) |
| Banco | PostgreSQL 15 (Supabase) com RLS em 100% das tabelas, 46 funções RPC, 8 views, 15 enums |
| Storage | Bucket privado `fotos_alunos` (URLs assinadas de 5 min) |
| Hospedagem | Vercel (app) + Supabase (dados) |
| Testes | node:test, 15 suítes (~2.200 linhas), incluindo banco PostgreSQL descartável (PGlite) |

### 1.3 Números do projeto

- 27 tabelas, 8 views seguras, ~46 funções RPC, 15 enums, 27 triggers/automatizações
- 106 políticas RLS na baseline
- 39 páginas Vue (gestão 13, professor 5, aluno 5, público 4), 57 componentes, 25 modais
- 12 rotas de servidor, 2 serviços (provisionamento de acesso, exclusão de aluno)
- 217 testes automatizados passando
- ~130 documentos em `docs/` (roteiros de vídeo, guias, auditorias, checklists)

---

## PARTE 2 — O que o projeto FAZ (funcionalidades por área)

### 2.1 Área GESTÃO (`/dashboard/**`)

| Módulo | O que faz |
|---|---|
| **Início** | Métricas de alunos ativos, turmas de hoje, inadimplência (reais); próximas aulas |
| **Alunos** | Cadastro completo (27 campos: CPF, endereço estruturado, contatos de emergência, responsável de menor), busca/filtros/paginação, foto do contrato, editar com troca de turma em transação, trancar/cancelar/excluir definitivamente (com fila de limpeza), perfil com histórico |
| **Matrícula** | Aluno + N modalidades/turmas + contrato em 1 transação; validação de CPF (dígitos verificadores), capacidade da turma com bloqueio de linha, conflito de professor/sala com advisory lock; vencimento 1–28 |
| **Agenda** | Grade semanal 08h–21h, visão dia/semana/mês, detalhe da turma com alunos e situação financeira |
| **Frequência** | Chamada completa: presente/falta/justificada, marcar todos, finalizar chamada, reabrir com motivo obrigatório (só gestão) |
| **Contratos** | Visão geral, histórico paginado, modelo de contrato versionado (RPC transacional), reenvio de link (regenera token), renovação com vínculo à via anterior |
| **Financeiro** | 5 abas: visão geral (resumo calculado no banco), cobranças (criar/pagar/cancelar/estornar — tudo em RPC transacional), recibos (visualizar/imprimir/reenviar por e-mail), repasses (calcular/pagar), fluxo de caixa (lançamentos manuais + automáticos, contas financeiras) |
| **Professores** | CRUD com comissão (percentual ou fixo), PIX, vínculo de modalidades, criação de conta com senha temporária, bloqueio de acesso |
| **Modalidades/Salas/Turmas** | CRUDs transacionais, turmas em lote (vários dias em 1 operação, rejeição integral em conflito), validação de capacidade ≤ sala |
| **Configurações** | Equipe (criar/desativar gestores), dados da escola (CNPJ, PIX, remetente), contas financeiras, regras de frequência |
| **Relatórios** | Relatórios prontos + construtor personalizado (5 origens reais: alunos, frequência, financeiro, contratos, repasses), filtros salvos privados, CSV com proteção contra injeção de fórmulas |
| **Onboarding** | 5 etapas obrigatórias para nova conta de gestão (forçado pelo middleware) |

### 2.2 Área PROFESSOR (`/professor/**`)

- **Início:** próximas aulas, frequência do mês, alerta de alunos com ≥3 faltas, resumo de repasses. Atualiza a cada 30s.
- **Agenda:** calendário dia/semana/mês das próprias turmas.
- **Chamada:** diário de frequência completo com rollback otimista, finalização, alertas de feriado (tabela real) e data retroativa.
- **Alunos:** somente os vinculados às próprias turmas — telefone, e-mail, tipo sanguíneo e emergência **nulificados pela view**.
- **Repasse:** extrato somente leitura dos próprios valores (a transferência é feita fora do sistema).

### 2.3 Área ALUNO (`/aluno/**`)

Somente leitura, via views restritas: aulas (turmas), frequência, financeiro (cobranças), contrato (com download da via assinada).

### 2.4 Área PÚBLICA

- **Login** com recuperação de senha (resposta neutra, sem enumeração de e-mails).
- **`/confirm`:** definição de senha forte no primeiro acesso (convite) e recuperação.
- **`/assinar/:token`:** página pública de assinatura de contrato — mostra o documento completo, exige captura de foto pela câmera (upload bloqueado), dois consentimentos explícitos, rate limit duplo (10/token e 30/IP por 15 min), gera as 12 parcelas automaticamente e produz snapshot imutável do contrato com hash SHA-256.

### 2.5 Infraestrutura operacional

- Provisionamento de usuários idempotente (repara órfãos, tolera timeout, nunca apaga identidade Auth em estado incerto).
- Exclusão de aluno transacional + fila durável para limpeza de Auth/Storage com reprocessamento.
- Auditoria automática imutável em 13 tabelas, com sanitização de PII.
- Log de comunicações (e-mail) com destinatário mascarado.
- Backup: baseline reproduzível sem dados pessoais + rotina real de backup/restauração testada (60 tabelas, 204 registros restaurados em PGlite).

---

## PARTE 3 — COMO funciona (engenharia reversa dos fluxos)

### 3.1 Fluxo de matrícula (o coração do sistema)

```
Gestão (StudentCreateModal)
  → valida endereço/CPF/maioridade no cliente
  → RPC criar_matricula_com_endereco  [TRANSAÇÃO NO BANCO]
      valida CPF, capacidade (FOR UPDATE), conflitos (advisory lock)
      cria: aluno + matrículas + contrato com token de 256 bits (expira 7 dias)
  → POST /api/send-contract-email (sessão de gestão) → Resend
  → Signatário abre /assinar/:token
  → GET /api/contrato/[token] (service role): dados + URL assinada da foto (5 min)
  → Captura facial (FaceDetector nativo ou heurística de tom de pele —
     NÃO é identificação biométrica; valida presença/enquadramento/iluminação)
  → POST /api/contrato/[token]:
      rate limit por hash(token) e hash(IP) na tabela tentativas_assinatura
      valida imagem (magic bytes JPEG/PNG, 5KB–5.5MB, dimensões)
      upload no bucket privado
  → RPC assinar_contrato_com_consentimento [SÓ service_role]
      lock do contrato, valida status/expiração
      grava aceite (data, hash, IP, user-agent)
      gera EXATAMENTE 12 cobranças (falha se ≠ 12)
      snapshot jsonb do contrato + SHA-256 (protegido por trigger de imutabilidade)
  → POST /api/send-signed-confirmation-email (segredo interno x-internal-email-secret)
```

### 3.2 Ciclo financeiro

```
Cobrança paga → RPC registrar_pagamento_manual (gestão)
  → status + recibo + entrada no caixa [1 transação]
Estorno → RPC estornar_pagamento_manual → tabela estornos_pagamento + saída no caixa
Cancelamento sem fidelidade (033): mês corrente devido só se houve presença
Repasse → RPC calcular_repasse_professor (base = mensalidade PAGA no mês,
  matrícula vigente na data do pagamento; comissão por aluno com fallback ao padrão)
  → pagar_repasse_professor (advisory lock professor+mês) → repasse + itens + saída no caixa
```

### 3.3 Modelo de segurança (3 camadas)

1. **Banco (RLS):** papel vem de `app_metadata` (só backend escreve); 106 políticas; anon com zero privilégios em tabelas sensíveis; views com `security_invoker`; funções críticas exclusivas de `service_role`; auditoria sem escrita para `authenticated`.
2. **Rotas de servidor:** `requireManagement()` valida sessão + UUID + papel `gestao` ativo com falha fechada.
3. **Middleware Nuxt:** revalida sessão com o servidor, falha fechada (papel inválido = logout), deny-by-default em rotas desconhecidas.

### 3.4 Arquitetura de identidade

```
auth.users (Supabase Auth)
   └─ public.usuarios (papel, ativo, onboarding)   ← papel vem de app_metadata
        ├─ professores.usuario_id (único)
        └─ alunos.usuario_id
```

Provisionamento via `provisionar_acesso_usuario` (RPC service_role) + `server/services/accessProvisioning.ts` — trata repetição, timeout e contas parciais de forma idempotente.

---

## PARTE 4 — CHECKLIST DE MELHORIAS

### 🔴 P0 — BLOQUEIA PRODUÇÃO (corrigir antes de liberar)

| # | Item | Evidência | Ação |
|---|---|---|---|
| 1 | **Política legada expõe dados de TODOS os professores a qualquer usuário autenticado** — um aluno pode ler CPF, telefone, e-mail, PIX e comissão de todos os professores via API pública do PostgREST | Baseline linha 2527: `"Todos os papéis autenticados leem professores" ... using (auth.role() = 'authenticated')` | Migration de cleanup: `drop policy` de todas as políticas legadas "to public" que sobreviveram à migration 001 (a baseline lista ~16 delas em professores, alunos, cobrancas, contratos, etc.) |
| 2 | **Bypass do bloqueio de chamada finalizada** — as políticas legadas "Professor e gestão registram/editam presença" (to public, sem checagem de chamada ativa) coexistem (OR) com as novas da migration 034 e anulem o bloqueio | Baseline linhas 2497/2499 | Incluir as políticas de `presencas` no cleanup do item 1; retestar bloqueio com dois papéis reais |
| 3 | **TRUNCATE concedido a `authenticated`** nas tabelas principais (alunos, cobrancas, turmas, contratos...) — TRUNCATE não passa por RLS; viola menor privilégio | Baseline linhas 2685, 2787, 2949, 3437 | `revoke ALL PRIVILEGES` seletivo: `revoke TRUNCATE, REFERENCES, TRIGGER, MAINTAIN on all tables in schema public from authenticated` |
| 4 | **EXECUTE de funções financeiras concedido a `anon`** (estornar_pagamento_manual, registrar_pagamento_manual, obter_resumo_financeiro) — hoje seguro porque a função checa papel no corpo, mas o padrão é frágil | Baseline linhas 3849, 3911, 3959 | `revoke execute ... from anon` em todas as funções privilegiadas (replicar o padrão já usado nas funções de assinatura) |
| 5 | **Rotacionar o token Supabase presente em `.mcp.json`** (não commitado, mas reside em pasta sincronizada no OneDrive) + revisar se outras chaves circularam no desenvolvimento | `.mcp.json` (fora do Git — conferido) | Rotacionar `sbp_...` no painel do Supabase; manter `.mcp.json` fora do OneDrive ou usar variável de ambiente |
| 6 | **`INTERNAL_EMAIL_SECRET` é opcional no código** (`process.env.INTERNAL_EMAIL_SECRET || ''`) — se faltar no deploy da Vercel, toda assinatura conclui sem e-mail de confirmação | `server/api/contrato/[token].post.ts:182` | Falhar explicitamente (log + alerta) quando a variável não existir; adicionar às variáveis obrigatórias da Vercel |

### 🟡 P1 — NECESSÁRIO PARA OPERAÇÃO CONFIÁVEL

| # | Item | Detalhe |
|---|---|---|
| 7 | **Unicidade de CPF/e-mail do aluno no banco** | `alunos.cpf` não tem constraint UNIQUE (só `professores.cpf` tem); `salvar_aluno_com_turmas` (036) não valida CPF. Coluna gerada `cpf_digits` + UNIQUE + validação na RPC de edição |
| 8 | **PII de aluno acessível ao professor por SELECT direto** | A política `professor_le_alunos_das_turmas` expõe a linha inteira (CPF, tipo sanguíneo, emergência); a view que nulifica dados é cosmética — o professor pode consultar `alunos` direto. Mover dados sensíveis para tabela separada ou aceitar e documentar |
| 9 | **Gestor pode alterar `papel`/`ativo` direto na tabela `usuarios`** via PostgREST, contornando as RPCs com guard "último gestor" | Restringir a política FOR ALL de `usuarios` (colunas sensíveis ou trigger) |
| 10 | **CSP fraca** | `Content-Security-Policy` só define `frame-ancestors/base-uri/object-src` — sem `default-src`/`script-src`, a política não restringe execução de script. Adicionar `default-src 'self'` + exceções mínimas |
| 11 | **Rate limit nas rotas autenticadas de e-mail** | `send-contract-email`, `resend-access`, `send-receipt-email` sem throttle — sessão comprometida dispara volume arbitrário no Resend |
| 12 | **`appUrl` com fallback para o Host da requisição** em resend-access e rotas de e-mail (invite-user exige a variável explícita — o padrão certo) | Uniformizar: exigir `NUXT_PUBLIC_APP_URL` |
| 13 | **Dados fake no dashboard** | Gráficos hardcoded (`:chart-data="[120,125,...]"`) e "Risco de evasão" fixo em 0 (`dashboard/index.vue:27,37,48,55`) — remover ou conectar a dados reais |
| 14 | **GET público do contrato sem rate limit e retorna PII completa** | Por design o contrato mostra os dados (necessário), mas vale reduzir campos à saída (ex.: sem e-mail/telefones de emergência), e o GET poderia ter o mesmo rate limit do POST |
| 15 | **Cadastro self-service cria perfil `aluno` ativo** para qualquer signup com a chave pública (poluição/contas spam) | Gate: exigir convite válido para ativar, ou desativar signups públicos no Auth |
| 16 | **Fotos da agenda sem URL assinada** | `dashboard/agenda.vue` usa path do storage direto em `<img>` — imagens quebradas (bucket é privado). Usar `createSignedUrl` como as demais telas |
| 17 | **Documentação defasada** | README diz que não existe baseline (ela existe desde 29/10 em `supabase/baseline/20261029_schema.sql`) e aponta migration errada como a mais recente (045 vs 050). Atualizar README + arquitetura_seguranca |
| 18 | **Scripts de dump no repondo com e-mail pessoal hard-coded** | `supabase/manual/reset_dados_preservando_gestao.sql` contém e-mail pessoal + TRUNCATE cascade — remover dado pessoal e reforçar aviso; garantir que funções de export sejam sempre derrubadas após uso |
| 19 | **Trancamento não recria cobranças** ao destrancar (estende vigência, mas o período pausado não gera mensalidades) | Decisão de produto + ajuste na RPC `destrancar_aluno` |
| 20 | **CI inexistente** | Criar workflow GitHub Actions: `npm test` + `typecheck` + `lint` + build em cada PR; gate de release com `docs/sql/auditoria_final_supabase.sql` |

### 🟢 P2 — MELHORIAS POSTERIORES

| # | Item |
|---|---|
| 21 | Remover código morto: ~400 linhas de funções `_legacy` em `useFinanceiro.ts`; `useConfiguracoes.ts` inteiro mockado (não importado por ninguém); bloco de presenças nunca inserido em `[token].post.ts:136-169`; assinatura client-side comentada em `assinar/[token].vue` |
| 22 | Unificar os dois diários de frequência (~650 linhas cada, professor × gestão, quase duplicados com drift) |
| 23 | Regenerar tipos TypeScript (os dois arquivos divergem e omitem 5 tabelas + maioria das RPCs) |
| 24 | Substituir testes de "texto SQL" (regex sobre migrations) por testes comportamentais contra banco descartável (o padrão do `databaseRecovery.test.mjs` é excelente — estender para políticas RLS) |
| 25 | N+1 de performance: `fetchTeachers` chama RPC por professor; `team.get.ts` chama `getUserById` por membro; agenda carrega turmas+matrículas+alunos+contratos+cobranças aninhados |
| 26 | Deduplicar HTML dos e-mails (3 arquivos com CSS repetido) e `escapeHtml` (redefinido em 3 rotas) |
| 27 | Substituir `alert()/confirm()/prompt()` (44 ocorrências) por componentes padronizados |
| 28 | Acessibilidade: checkbox sem foco de teclado, abas sem `aria-controls`, modais sem trap de foco |
| 29 | Reduzir os 309 avisos de `any` (tipar payloads HTTP e resultados de RPC) |
| 30 | Rotação/limpeza das tabelas de auditoria, tentativas e comunicações (crescem indefinidamente) |
| 31 | Registrar script de teste explicitamente listado no `package.json` → migrar para glob ou registrar automaticamente |
| 32 | LGPD: documento de finalidade/base legal/retenção; procedimento de exportação e exclusão do titular; responsáveis por incidentes (itens abertos no checklist mestre) |
| 33 | FaceCapture: rejeitar 2 rostos (`faces.length > 2` deixa passar exatamente 2) e descrever a funcionalidade como "validação visual", não biometria |
| 34 | Integrar PIX dinâmico com webhook (Asaas/Efi) para baixa automática — hoje toda baixa é manual |
| 35 | WhatsApp automático (Evolution/UAZAPI) — hoje é link de clique |

---

## PARTE 5 — VEREDITO: está pronto para produção?

### Resposta curta

**Não imediatamente — está a uma migration de correções de ser.** O projeto tem uma fundação acima da média para o porte (RLS em 100% das tabelas, transações com advisory lock, auditoria sanitizada, provisionamento idempotente, 217 testes verdes, baseline restaurável), mas há **4 correções obrigatórias de segurança no banco de produção** que são rápidas e devem preceder o uso real com dados da escola.

### Por que NÃO liberar hoje

1. **Fuga de dados possível e concreta:** um aluno autenticado pode ler CPF, telefone, e-mail e chave PIX de todos os professores (política legada confirmada na baseline do banco real, linha 2527). Em uma escola, isso é dado pessoal de colaboradores exposto a clientes menores de idade. Correção: 1 migration de `drop policy` (dias, não semanas).
2. **O bloqueio de chamada finalizada é contornável** pelas mesmas políticas legadas — o professor pode editar presença de chamada encerrada, o que compromete a integridade do repasse e do histórico.
3. **Privilégios excessivos** (TRUNCATE para authenticated; EXECUTE financeiro para anon) violam menor privilégio — hoje sem exploração direta via PostgREST, mas com risco real se qualquer credencial vazar.
4. **Dependência silenciosa de variáveis de ambiente** (`INTERNAL_EMAIL_SECRET`, `NUXT_PUBLIC_APP_URL`): faltando no deploy, o sistema opera "degradado sem avisar" (assinaturas sem e-mail de confirmação).

### Por que o veredito é positivo (com as correções)

- **Regras críticas no lugar certo:** matrícula, assinatura+12 parcelas, pagamento, estorno, repasse e exclusão são funções PostgreSQL transacionais com locks e validações — não escritas multi-tabela do cliente.
- **Segurança em camadas real, não cosmética:** middleware com falha fechada, `requireManagement` em todas as rotas admin, anon zerado, bucket privado, tokens de 256 bits com expiração e rate limit, logs sem PII.
- **Evidências jurídicas do contrato:** snapshot imutável com SHA-256, aceite com IP/UA/hash, consentimentos explícitos, bucket privado com URL assinada.
- **Qualidade verificada agora:** 217 testes aprovados, typecheck e lint limpos (0 erros), build aprovado.
- **Operação pensada:** fila de exclusão com reprocessamento, auditoria automática em 13 tabelas, backup real testado com restauração comprovada.

### Roteiro para o go-live (ordem sugerida)

1. **Migration de cleanup de segurança** (itens 1–4 do P0) + rodar `docs/sql/auditoria_final_supabase.sql` como prova.
2. Rotacionar token do `.mcp.json` e revisar variáveis obrigatórias na Vercel (itens 5–6).
3. Fix rápidos de app: `INTERNAL_EMAIL_SECRET` obrigatório, fotos da agenda, gráficos fake do dashboard (itens 6, 13, 16).
4. Aplicar migrations pendentes confirmadas + backup + teste de fumaça (roteiro do README).
5. **Homologação acompanhada com a escola:** 1 matrícula real, 1 assinatura real, 1 chamada, 1 pagamento, 1 repasse — com a responsável aprovando formalmente (checklist mestre, seção 17).
6. Depois do go-live, atacar P1 em sprints (CPF único, rate limits, CI) e P2 como melhoria contínua.

**Resumo em uma linha:** sistema tecnicamente sólido e bem arquitetado; libere para produção **somente depois** da migration de limpeza das políticas legadas (itens 1–4), da rotação do token exposto em arquivo local e da homologação acompanhada com a escola.
