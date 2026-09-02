# Arquitetura de Segurança do Banco de Dados — Pop Music

**Versão:** 1.0
**Arquivos relacionados:** `01_schema.sql` · `02_rls_policies.sql` · `03_views_seguranca.sql`
**Ordem de execução no Supabase:** rodar os 3 arquivos nessa ordem, no SQL Editor do Supabase ou via `supabase db push`.

---

## 1. Princípio geral

Este sistema mexe com CPF, dado de saúde (tipo sanguíneo), endereço, e dinheiro (mensalidade, repasse de professor). A decisão de arquitetura mais importante foi: **a segurança não pode depender só da tela**. Se a segurança estivesse só no código do frontend (ex: "essa tela só mostra esse botão pra secretaria"), qualquer pessoa com conhecimento técnico poderia chamar a API do Supabase diretamente e ver dado de outro aluno. Por isso, toda regra de quem-vê-o-quê está no **próprio banco de dados**, via Row Level Security (RLS) do Postgres — o mecanismo nativo do Supabase pra isso.

Duas camadas trabalham juntas:

1. **RLS (linha):** decide quais *registros* uma pessoa pode ver. Ex: "professor só vê presenças das turmas dele".
2. **Views (coluna):** decide quais *campos* daquele registro aparecem. Ex: "professor vê o nome do aluno, mas nunca vê o CPF dele".

---

## 2. Os 4 papéis (`papel_usuario`)

| Papel | Quem é | Acesso |
|---|---|---|
| `gestao` | Dono/diretor da escola | Total — inclusive financeiro, configurações, edição de modelo de contrato |
| `professor` | Dá aula | Só enxerga as próprias turmas, os alunos delas (sem dado financeiro/CPF), o próprio repasse |
| `aluno` | Aluno ou responsável | Só enxerga o próprio registro: seu contrato, sua cobrança, sua frequência |

A tabela `usuarios` (que estende `auth.users` do Supabase) é a fonte da verdade de qual papel cada pessoa logada tem. Toda função de política (`meu_papel()`, `meu_professor_id()`, `meu_aluno_id()`) consulta essa tabela.

---

## 3. Os 3 dashboards e de onde cada um lê dado

### 3.1 Dashboard Gestão/Secretaria (já em construção)

Consulta as **tabelas diretamente** (`alunos`, `contratos`, `cobrancas`, etc.) — porque RLS já libera acesso total pra esses dois papéis, e eles precisam ver todos os campos, inclusive CPF e financeiro, pra fazer o trabalho operacional.

### 3.2 Dashboard do Professor (a construir)

Consulta **as views `vw_professor_*`**, nunca as tabelas base:
- `vw_professor_agenda` — a agenda dele, com ocupação de cada turma.
- `vw_professor_alunos` — lista de alunos das turmas dele, sem CPF/endereço/financeiro.
- `vw_professor_meu_repasse` — quanto ele tem a receber, sem ver repasse de outro professor.
- Tela de Chamada Rápida (já especificada em documento anterior) grava direto em `presencas`, protegida por RLS (só grava se a turma for dele).

**Estrutura sugerida do Dashboard do Professor:**
- Tela inicial: agenda do dia (`vw_professor_agenda` filtrada por hoje).
- Aba "Meus alunos": lista simples com nome/contato/frequência (`vw_professor_alunos`).
- Aba "Meu repasse": resumo do mês corrente e histórico (`vw_professor_meu_repasse`).
- Chamada Rápida: mesma tela já especificada no documento de Frequência, reaproveitada aqui.

### 3.3 Dashboard do Aluno (a construir)

Consulta as views `vw_aluno_*`:
- `vw_aluno_meu_perfil` — próprios dados de contato.
- `vw_aluno_minhas_turmas` — turmas em que está matriculado.
- `vw_aluno_minha_frequencia` — histórico de presença, pro aluno acompanhar o próprio desempenho.
- `vw_aluno_minhas_cobrancas` — mensalidades, pra ele conferir o que está pago/pendente.
- `vw_aluno_meu_contrato` — status do contrato e link pra baixar o PDF.

**Estrutura sugerida do Dashboard do Aluno:**
- Tela inicial: próxima aula + status da mensalidade (pago/pendente) em destaque.
- Aba "Minhas aulas": turmas e horários.
- Aba "Minha frequência": gráfico simples de presença (reaproveita o mesmo padrão visual já usado no Dossiê, seção 4.2 da Especificação de Telas).
- Aba "Financeiro": lista de cobranças, com botão de pagar (se pendente) e baixar recibo (se pago).
- Aba "Contrato": status e download.

---

## 4. Os dois fluxos que NÃO usam login (atenção especial de segurança)

Dois pontos do sistema já especificados em documentos anteriores são acessados **sem autenticação**: a tela de assinatura de contrato e o check-in por QR Code. Esses dois não podem simplesmente usar a `anon key` do Supabase com acesso direto às tabelas — isso abriria brecha pra alguém adivinhar um token e ver contrato de outra pessoa. A solução é usar **Supabase Edge Functions com `service_role`**, que rodam no servidor e validam a regra de negócio antes de tocar no banco.

### 4.1 Assinatura de contrato (link por WhatsApp/e-mail)

- O client anônimo (o navegador do aluno) **nunca** faz `select * from contratos`.
- Ele chama uma Edge Function (ex: `POST /contrato-por-token`), passando só o `token` que veio na URL.
- A função, rodando com `service_role` (que ignora RLS, mas só dentro desse código controlado por vocês), busca o contrato por `token`, valida `token_expira_em > now()`, e retorna **só os campos necessários pra exibir a tela** (texto do contrato, nome do aluno, status) — nunca a tabela inteira.
- Ao aceitar, outra Edge Function (`POST /contrato-aceitar`) recebe o token + os metadados (IP, user-agent, capturados no próprio servidor da function, não confiando no que o client manda) e grava o aceite.

### 4.2 Check-in por QR Code

- O QR Code na sala aponta pra uma URL com um identificador da turma+horário (não o ID direto da turma, algo como um token de sala temporário, renovado periodicamente, pra evitar que alguém fotografe o QR e reuse depois do horário).
- O client chama uma Edge Function (`POST /checkin`), que valida a janela de tempo (15 min antes/depois, conforme já configurado em Configurações → Frequência) e grava a presença com `origem = 'qr_code'`.
- Essa function também roda com `service_role`, e é o único caminho de escrita em `presencas` que não passa pelo usuário autenticado professor/gestão.

**Ponto de atenção para quem for implementar:** nunca deixar a `service_role key` exposta no frontend — ela só pode existir no ambiente de servidor da Edge Function. Isso é padrão do Supabase, mas vale reforçar porque é o tipo de erro que, se acontecer, derruba toda a arquitetura de segurança construída aqui.

---

## 5. Trilha de auditoria

A tabela `auditoria` (seção 15 do schema) guarda quem alterou o quê, em tabelas sensíveis. Ela não é gravada por policy de client — só por trigger de banco ou por Edge Function com `service_role`. Recomendo (próximo passo, não incluído neste pacote inicial) criar triggers `after insert/update/delete` nas tabelas `alunos`, `contratos` e `cobrancas` que gravam automaticamente em `auditoria`, guardando o `dados_antes`/`dados_depois` em JSON. Isso é especialmente relevante pra LGPD: se um dia precisar provar quem acessou ou alterou o dado de um aluno, a trilha já existe.

---

## 6. Checklist de segurança antes de ir para produção

- [ ] RLS habilitado em **todas** as tabelas que contêm dado de aluno, contrato ou financeiro.
- [ ] Nenhuma tabela sensível com policy `using (true)` sem filtro de papel.
- [ ] `service_role key` presente **apenas** em variáveis de ambiente do servidor.
- [ ] Dashboard do Professor consultando **só** as views.
- [ ] Dashboard do Aluno consultando **só** as views.
- [ ] Tela de assinatura de contrato e check-in QR passando por Edge Function.

---

## 7. Próximos passos sugeridos

1. Rodar os 3 arquivos SQL num projeto Supabase novo.
2. Criar o seed inicial de dados (`03_seed.sql`).
3. Implementar as duas Edge Functions descritas na seção 4.
4. Construir o Dashboard do Professor e do Aluno.
