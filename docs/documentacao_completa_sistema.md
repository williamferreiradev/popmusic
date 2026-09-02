# Manual Completo e Documentação Técnica do Sistema — Pop Music

**Academia de Música Pop Music**  
**CNPJ:** 12.811.326/0001-88  
**Endereço:** Quadra 498 Casa 08 B Pedregal - Novo Gama – GO  
**Chave PIX Oficial:** `william.ferreira.web@gmail.com`  
**Mensalidade Padrão:** R$ 180,00 / mês (4 aulas no mês / 1 por semana)  
**Versão do Sistema:** 2.0 (Nuxt 4 + Supabase + Tailwind CSS)

---

## 1. Visão Geral da Arquitetura e Tecnologias

O sistema Pop Music foi desenvolvido para oferecer gestão acadêmica, financeira, contratual e operacional de alta performance para a escola de música.

- **Frontend & Framework:** Nuxt 4 (SSR, Nitro 2.13, Vite 7, Vue 3.5).
- **Estilização:** Tailwind CSS com tema Dark/Neon (`#00E096` / `#050505`).
- **Banco de Dados & Backend:** Supabase (PostgreSQL com Row Level Security - RLS, Storage e Auth v2 com SSR Cookies).
- **Validação Biométrica / Facial:** Detecção de rosto em tempo real via WebCam no navegador.
- **Mecanismo de Impressão:** Renderização isolada em iframe invisível em formato A4, garantindo PDFs limpos sem poluição visual do dashboard.

---

## 2. Fluxo de Matrícula e Contrato Digital com Biometria Facial

### 2.1 Criação da Matrícula e Envio Automático do Link
1. No painel de **Alunos**, ao clicar em **"+ Nova Matrícula"**, os dados do aluno, responsável, modalidade e turma são preenchidos.
2. Ao salvar:
   - O registro do aluno é criado no banco de dados (`alunos`).
   - A matrícula na turma é vinculada (`matriculas_turma`).
   - O registro do contrato é gerado (`contratos`) com status `'pendente'` e um `token` único de assinatura.
   - É disparado automaticamente um e-mail para o responsável com o link exclusivo de assinatura digital (`/contrato/:token`).

### 2.2 Assinatura Facial e Regras de Validação
- **Captura Exclusiva ao Vivo:** O sistema bloqueia uploads manuais de arquivos para evitar fraudes, exigindo a captura direta pela câmera do dispositivo.
- **Validação Facial por IA:** Apenas imagens contendo um rosto humano visível e nítido são aceitas. Fotos inválidas são rejeitadas pelo validador.
- **Registro Jurídico Digital:**
  - `foto_assinatura_url`: Armazenada com segurança no Supabase Storage.
  - `aceite_hash`: Hash SHA-256 de integridade digital.
  - `data_aceite`: Timestamp exato da concordância dos termos.
  - `aceite_ip`: Endereço IP do signatário.
  - `token`: Código de validação do contrato.

### 2.3 Pós-Assinatura Automática
Imediatamente após o aceite do contrato pelo aluno/responsável:
1. O status do contrato muda para `'aceito'`.
2. As 12 cobranças mensais (R$ 180,00 cada) são geradas na tabela `cobrancas`.
3. O aluno é ativado na turma e incluído na grade da **Agenda** e no **Diário de Frequência**.
4. É disparado um e-mail de confirmação com os dados da matrícula e instruções de pagamento PIX.

### 2.4 Visualização no Perfil e Impressão Limpa A4
- Na listagem de alunos e no modal de perfil (**Ver Perfil** / **Ver Contrato**), o sistema carrega o documento com o carimbo oficial contendo a **foto facial do signatário**.
- O botão **"Imprimir / Salvar em PDF"** utiliza impressão isolada em folha A4 com folhas de estilo embutidas, eliminando qualquer interferência visual do dashboard.

---

## 3. Módulo Financeiro, Cobranças e Recibos

### 3.1 Painel Geral (Overview)
- **A Receber Este Mês:** Calcula estritamente as cobranças com vencimento no mês e ano correntes que estejam com status `'pendente'` (ex: R$ 180,00), impedindo a soma indevida das 12 parcelas do ano.
- **Recebido Este Mês:** Total de cobranças quitadas dentro do mês atual.
- **Em Atraso:** Mensalidades vencidas não pagas.
- **A Pagar Professores:** Total acumulado de repasses devidos aos professores no mês.
- **Saldo em Caixa:** Saldo inicial somado às movimentações de entrada menos saídas.

### 3.2 Visualização e Ordenação das Parcelas
Na aba **Cobranças / Mensalidades**:
- Filtros em pills: `Em Aberto / Mês Atual`, `Do Mês & Atrasadas`, `Pagas (Quitadas)`, `Pendentes Futuras`, `Atrasadas`, `Todas`.
- **Ordenação Inteligente:**
  1. Parcelas em atraso (prioridade de cobrança).
  2. Parcela do mês atual (vencendo).
  3. Parcelas futuras em ordem cronológica (1, 2, 3, 4, 5...).
  4. Parcelas quitadas.

### 3.3 Recibos Oficiais Timbrados Pop Music
Ao marcar qualquer cobrança como paga (via PIX, dinheiro, cartão, etc.):
- O recibo oficial é emitido automaticamente na aba **Recibos**.
- **Comprovante Timbrado:**
  - Cabeçalho timbrado oficial da *Pop Music Academia de Música*.
  - Dados completos: CNPJ, endereço, telefone, número do recibo.
  - Dados do pagador/aluno com CPF.
  - Valor formatado em R$ e por extenso gerado dinamicamente.
  - Forma de pagamento e data de quitação.
  - Chave PIX oficial: `william.ferreira.web@gmail.com`.
  - Autenticação digital única.
- **Ações Rápidas:**
  - **Imprimir / PDF:** Impressão timbrada isolada em 1 clique.
  - **WhatsApp:** Envio direto do comprovante com mensagem formatada.
  - **E-mail:** Reenvio do recibo para a caixa de entrada do aluno.

---

## 4. Repasses e Comissões dos Professores

- **Cálculo Dinâmico:**
  - O sistema cruza os alunos matriculados nas turmas ativas de cada professor com o total de aulas previstas no mês (padrão de 4 aulas = R$ 180,00 por aluno).
  - Comissões configuráveis por percentual (padrão 50% = R$ 90,00 por aluno) ou valor fixo por aula.
  - Considera as presenças registradas no Diário de Frequência.
- **Baixa e Quitação:**
  - No botão **"Marcar tudo como pago"**, o sistema cria o registro de pagamento em `repasses_professor` e lança automaticamente a saída correspondente no `fluxo_caixa`.

---

## 5. Diário de Frequência e Agenda de Turmas

### 5.1 Diário de Frequência
- **Filtros por Dia da Semana:** Abas rápidas para `Hoje`, `Segunda`, `Terça`, `Quarta`, `Quinta`, `Sexta`, `Sábado` e `Todas as Turmas`.
- **Cards Visuais de Turmas:** Cada card exibe a modalidade/instrumento, professor, dia/horário e quantidade de alunos ativos.
- **Chamada em 1 Clique:** Clicar no card carrega instantaneamente a lista de alunos para a data selecionada.
- **Ações da Chamada:**
  - `PRESENTE` / `FALTA` (com horário registrado).
  - `Marcar todos como presentes` para agilizar a rotina da turma.
  - `Justificar Falta` com registro do motivo e agendamento de reposição.
  - Integração com check-in automático via QR Code.

### 5.2 Agenda Semanal
- Exibição em grade visual sincronizada de segunda a sábado.
- Grade horária expandida das **08:00 às 21:00** para acomodar turmas matutinas, vespertinas e noturnas.
- Cores indicativas por status: Agendado (Azul), Concluído (Verde), Cancelado (Vermelho), Faltou (Laranja).

---

## 6. Estrutura do Banco de Dados (Supabase)

### Principais Tabelas:
| Tabela | Finalidade |
|---|---|
| `alunos` | Cadastro de alunos, responsáveis, CPF, contato, saúde e foto |
| `professores` | Cadastro de professores, contatos, tipo e valor de comissão |
| `modalidades` | Cursos/instrumentos (Violão, Canto, Teclado, Bateria) e mensalidade base |
| `turmas` | Grade de horários, dia da semana, sala, professor e capacidade |
| `matriculas_turma` | Vínculo entre aluno e turma com status da matrícula |
| `contratos` | Gestão de contratos, tokens, biometria facial, data de aceite, IP e hash |
| `cobrancas` | Mensalidades geradas, vencimentos, status e quitação |
| `presencas` | Registro de presença, faltas, justificativas e reposições |
| `repasses_professor` | Histórico e quitação de comissões pagas aos professores |
| `fluxo_caixa` | Entradas (mensalidades) e saídas (repasses e despesas) |
| `contas_financeiras` | Bancos e caixas físicos da escola |
| `feriados` | Calendário oficial de feriados para bloqueio de reposições |

---

## 7. Como Executar e Validar o Projeto

1. **Instalação de Dependências:**
   ```bash
   npm install
   ```

2. **Execução em Desenvolvimento:**
   ```bash
   npm run dev
   ```
   Acesse em: `http://localhost:3000`

3. **Build de Produção:**
   ```bash
   npm run build
   ```

---
*Documentação gerada e atualizada em Agosto/2026 para a Academia de Música Pop Music.*
