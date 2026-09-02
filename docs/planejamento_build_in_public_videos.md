# 🚀 Planejamento Estratégico de Conteúdo: Build in Public — Sistema Pop Music
> **História & Estratégia Real:** Criando um **software sob medida do zero** para salvar a operação da escola de música de um amigo (Academia Pop Music), que estava 100% no manual (papelada, planilhas perdidas, contratos impressos e cálculo manual de comissões). 
> 
> Mostrado em formato de **jornada em vídeos curtos (30 a 50 segundos)** para TikTok, Instagram Reels, YouTube Shorts, X e LinkedIn, simulando o passo a passo desde o "Dia 1" de desenvolvimento até a entrega final.

---

## 📊 Visão Geral do Plano de Conteúdo

- **História Principal (Storytelling):** *"Meu amigo tem uma escola de música e estava enlouquecendo com processos manuais. Decidi criar um sistema completo sob medida pra organizar e automatizar tudo pra ele."*
- **Total de Vídeos Mapeados:** **40 Vídeos Curtos** (30s a 45s cada)
- **Frequência Sugerida:** 1 vídeo por dia (renderá mais de 1 mês de conteúdo diário)
- **Formatos:** 
  - *Talking Head + Screencast* (Você falando e cortando rápido para a tela do sistema/código).
  - *Screencast Dinâmico com Legendas* (Zoom no design neon, nas animações e nos cliques rápidos).
- **Estrutura de Retenção (Fórmula dos 30 Segundos):**
  1. **Gancho (0-3s):** A dor real do amigo ou o choque visual do sistema.
  2. **O Problema Manual (3-10s):** O caos que existia antes (papel, perda de dinheiro, confusão).
  3. **A Solução no Código/Tela (10-25s):** O sistema em ação com visual moderno Dark/Neon.
  4. **CTA (25-30s):** Pergunta para engajar a audiência ou convite para acompanhar o próximo episódio.

---

## 🎬 TEMPORADA 1: A Ideia, O Diagnóstico & O Design System Neon
*Foco: A história do amigo, o diagnóstico do caos manual, a escolha da stack e o visual que impressiona.*

---

### 🟢 Vídeo 01 (30s) — O Início da Jornada: Salvando a Escola de Música de um Amigo
- **Duração:** 30 segundos
- **Gancho:** *"Um amigo meu é dono de uma escola de música e a gestão dele tava 100% no papel. Decidi criar um sistema do zero pra salvar a empresa dele. Dia 1."*
- **Na Tela:** Tela do VS Code abrindo com Nuxt 4, terminal rodando e cortando para uma foto de planilha antiga ou mesa cheia de papel.
- **Roteiro/Voz:** *"Ele tava perdendo controle de mensalidades, chamadas no papel e contratos impressos. Falei: 'Deixa comigo, vou programar um sistema sob medida pra você'. Essa é a stack: Nuxt 4, Supabase com PostgreSQL e Tailwind CSS. Me segue pra ver como ficou essa transformação!"*
- **CTA:** *"Comenta aí: o que você acha que não pode faltar num sistema desse?"*

---

### 🟢 Vídeo 02 (30s) — A Stack Escolhida: Por que Nuxt 4 + Supabase?
- **Duração:** 30 segundos
- **Gancho:** *"A melhor combinação de tecnologias para criar um sistema sob medida rápido e seguro."*
- **Na Tela:** Arquivo `nuxt.config.ts`, estrutura de pastas limpa do Nuxt 4 e o painel do Supabase.
- **Roteiro/Voz:** *"Pra entregar um sistema ultra-rápido pro meu amigo, usei Nuxt 4 no frontend e Supabase no backend. O Supabase já me dá PostgreSQL, autenticação e armazenamento de fotos em minutos, sem precisar subir servidor do zero."*
- **CTA:** *"Você prefere criar backend próprio ou usar BaaS como Supabase?"*

---

### 🟢 Vídeo 03 (35s) — O Design Neon/Dark que deixou meu amigo de queixo caído
- **Duração:** 35 segundos
- **Gancho:** *"Mostrei a primeira tela do sistema pro meu amigo e a reação dele foi surreal."*
- **Na Tela:** Mostrando o `tailwind.config.ts` com o verde `#00E096` e o dashboard com efeito Glassmorphism e Dark Mode.
- **Roteiro/Voz:** *"Ele achava que ia receber um sistema feio e cinza estilo repartição pública. Criei um design escuro moderno com detalhes em verde neon e cards com transparência. Dá gosto de abrir o sistema todo dia de manhã."*
- **CTA:** *"Dá uma nota de 0 a 10 pra essa interface!"*

---

### 🟢 Vídeo 04 (30s) — Modelagem do Banco no PostgreSQL (Supabase)
- **Duração:** 30 segundos
- **Gancho:** *"Como estruturei o banco de dados para nunca mais perder dados de alunos."*
- **Na Tela:** Diagrama / Table Editor do Supabase com as tabelas: `alunos`, `turmas`, `contratos`, `cobrancas`, `presencas`.
- **Roteiro/Voz:** *"Mapeei todo o fluxo da escola: cadastro de alunos, matrículas em turmas, contratos digitais com hash e tabela de cobranças. Tudo amarrado por chaves estrangeiras com segurança a nível de linha (RLS)."*
- **CTA:** *"Quer que eu libere o script SQL? Comenta 'SQL'!"*

---

### 🟢 Vídeo 05 (35s) — Três Acessos Diferentes: Admin, Professor e Aluno
- **Duração:** 35 segundos
- **Gancho:** *"Como fazer 3 públicos diferentes usarem o mesmo sistema sem misturar informações confidenciais."*
- **Na Tela:** Tela de Login (`/login`), mostrando o login do gestor indo para o financeiro e o do professor indo direto para a chamada.
- **Roteiro/Voz:** *"O dono da escola tem acesso ao financeiro completo. O professor só enxerga as turmas dele pra fazer chamada. E o aluno só acessa as próprias aulas e faturas. Tudo controlado pelo Supabase Auth."*
- **CTA:** *"Segue pra ver a tela de matrícula no próximo vídeo!"*

---

### 🟢 Vídeo 06 (35s) — O Dashboard do Gestor: Todas as Métricas em 1 Segundo
- **Duração:** 35 segundos
- **Gancho:** *"Antes ele demorava 2 horas pra saber quanto a escola faturou no mês. Agora leva 1 segundo."*
- **Na Tela:** Cards do Dashboard (Alunos Ativos, Total a Receber, Inadimplência e Aulas Hoje).
- **Roteiro/Voz:** *"Esse é o painel que o dono da escola abre todo dia. Ele bate o olho e já sabe quantos alunos ativos tem, quanto dinheiro entrou no PIX e se tem alguém em atraso."*
- **CTA:** *"Qual métrica você acharia mais importante se fosse o dono?"*

---

## 🎬 TEMPORADA 2: Gestão Acadêmica, Alunos, Turmas & Grade de Horários
*Foco: Como acabar com as pastas de fichas físicas e planilhas de salas lotadas.*

---

### 🟢 Vídeo 07 (30s) — Cadastro Inteligente de Alunos e Responsáveis
- **Duração:** 30 segundos
- **Gancho:** *"O formulário de matrícula que aposentou as fichas de papel da escola."*
- **Na Tela:** Modal `StudentCreateModal.vue` preenchendo os dados do aluno e ativando o switch 'Menor de idade'.
- **Roteiro/Voz:** *"Se o aluno for menor, o sistema obriga o preenchimento dos dados do responsável com CPF e WhatsApp validados. Tudo em menos de 40 segundos."*
- **CTA:** *"Quer ver o que acontece com o contrato logo após o cadastro? Segue aí!"*

---

### 🟢 Vídeo 08 (35s) — Cursos e Instrumentos: Violão, Canto, Teclado e Bateria
- **Duração:** 35 segundos
- **Gancho:** *"Configurando instrumentos e mensalidades personalizadas."*
- **Na Tela:** Tela de Configurações adicionando modalidades com a mensalidade base de R$ 180,00 e professores vinculados.
- **Roteiro/Voz:** *"Cada instrumento tem sua mensalidade e seus professores especialistas. O sistema já organiza as turmas automaticamente por instrumento e nível."*
- **CTA:** *"Se você fosse fazer aula hoje, qual instrumento escolheria?"*

---

### 🟢 Vídeo 09 (40s) — Grade de Horários com Trava Anti-Lotação de Sala
- **Duração:** 40 segundos
- **Gancho:** *"Resolvendo o maior problema da escola do meu amigo: alunos sem lugar na sala."*
- **Na Tela:** Criando uma turma com limite de 4 alunos e tentando adicionar o 5º, com o sistema alertando 'Turma Lotada'.
- **Roteiro/Voz:** *"Antes acontecia de colocarem mais alunos do que cabia na sala de bateria. Coloquei uma trava no sistema: quando atinge a capacidade máxima, o sistema bloqueia e sugere outro horário."*
- **CTA:** *"Trava simples que evita dor de cabeça diária!"*

---

### 🟢 Vídeo 10 (35s) — Perfil do Aluno com Histórico 360°
- **Duração:** 35 segundos
- **Gancho:** *"Tudo o que a secretaria precisa saber sobre o aluno num modal só."*
- **Na Tela:** `StudentProfileModal.vue` alternando abas: Matrículas, Histórico de Faltas, Financeiro e Contrato.
- **Roteiro/Voz:** *"Em vez de procurar em 3 pastas diferentes, a secretaria clica no aluno e vê todas as mensalidades pagas, faltas justificadas e observações de saúde."*
- **CTA:** *"Praticidade é o que transforma a rotina de uma empresa!"*

---

### 🟢 Vídeo 11 (40s) — Agenda Semanal Visual das 08:00 às 21:00
- **Duração:** 40 segundos
- **Gancho:** *"Substituindo o quadro branco da parede por uma agenda digital interativa."*
- **Na Tela:** Navegando em `dashboard/agenda.vue`, trocando os dias da semana e mostrando os blocos coloridos por professor e sala.
- **Roteiro/Voz:** *"Criamos uma grade semanal sincronizada com horários matutinos, vespertinos e noturnos. Cores intuitivas mostram se a aula está confirmada, cancelada ou se o aluno compareceu."*
- **CTA:** *"Curtiu o visual dessa agenda?"*

---

## 🎬 TEMPORADA 3: O Ponto Alto — Contrato Digital com Biometria Facial ao Vivo
*Foco: O recurso mais impressionante do projeto, que substituiu a impressão de papel e filas por assinatura via câmera.*

---

### 🟢 Vídeo 12 (30s) — O Fim do Contrato Impresso: Link com Token Seguro
- **Duração:** 30 segundos
- **Gancho:** *"Meu amigo gastava centenas de reais em papel e tinta imprimindo contratos. Zerei esse custo."*
- **Na Tela:** Ao salvar a matrícula, é gerado o contrato com token criptográfico e enviado para o WhatsApp/E-mail do responsável.
- **Roteiro/Voz:** *"Assim que o aluno é matriculado, o sistema gera um contrato digital com token exclusivo e dispara o link para o celular do responsável assinar."*
- **CTA:** *"Segue pra ver como funciona a assinatura com câmera no próximo vídeo!"*

---

### 🟢 Vídeo 13 (45s) — A Página de Assinatura Mobile: Sem Senhas, Direto no Celular
- **Duração:** 45 segundos
- **Gancho:** *"Como fazer o pai do aluno assinar o contrato da escola em 30 segundos pelo celular."*
- **Na Tela:** Abrindo a tela `/assinar/[token]` no smartphone, rolando os termos e clicando em 'Assinar com Biometria'.
- **Roteiro/Voz:** *"O responsável abre o link no WhatsApp, confere as cláusulas, o valor de R$ 180 mensais e autoriza a câmera do celular para confirmar a assinatura."*
- **CTA:** *"Experiência do cliente levada a outro nível!"*

---

### 🟢 Vídeo 14 (45s) — Validação Biométrica Facial: Bloqueando Fotos Falsas
- **Duração:** 45 segundos
- **Gancho:** *"Como garantir que a foto da assinatura é real e não uma imagem fake baixada da internet?"*
- **Na Tela:** Interface da WebCam com círculo guia facial em verde, capturando a foto em tempo real.
- **Roteiro/Voz:** *"Para garantir validade jurídica, bloqueamos o upload de arquivos da galeria. A foto precisa ser tirada ao vivo pela câmera, validando o enquadramento facial no navegador."*
- **CTA:** *"O que você acha dessa camada de segurança?"*

---

### 🟢 Vídeo 15 (40s) — Carimbo Jurídico Digital com Hash SHA-256 e IP
- **Duração:** 40 segundos
- **Gancho:** *"A criptografia que torna esse contrato 100% à prova de fraudes."*
- **Na Tela:** Trecho de código gerando o hash SHA-256 combinando a foto, o endereço IP, a data/hora e o texto do contrato.
- **Roteiro/Voz:** *"Ao confirmar a foto, o sistema grava o IP do signatário, a data e hora exata e gera uma hash SHA-256. Se qualquer vírgula do contrato for alterada depois, a hash invalida."*
- **CTA:** *"Segurança jurídica de ponta em um sistema sob medida!"*

---

### 🟢 Vídeo 16 (35s) — Automação no Banco: Contrato Aceito = 12 Parcelas Geradas
- **Duração:** 35 segundos
- **Gancho:** *"A automação que economiza 15 minutos em cada matrícula da escola."*
- **Na Tela:** O contrato sendo aceito e a tabela `cobrancas` recebendo instantaneamente as 12 parcelas do ano.
- **Roteiro/Voz:** *"Assim que o pai confirma o contrato, o sistema já gera as 12 cobranças mensais do ano todo, ativa a vaga do aluno na turma e inclui o nome dele no diário do professor."*
- **CTA:** *"Automação é o coração de um bom software!"*

---

### 🟢 Vídeo 17 (40s) — Impressão A4 Perfeita em PDF com Foto do Signatário
- **Duração:** 40 segundos
- **Gancho:** *"Como gerar um PDF timbrado e limpo direto do navegador sem desconfigurar o layout."*
- **Na Tela:** Clicando em 'Imprimir / PDF' no modal do contrato e mostrando o documento formatado em A4 com a foto no rodapé.
- **Roteiro/Voz:** *"Usamos um iframe invisível para isolar o documento do resto do dashboard. O PDF sai com o cabeçalho timbrado oficial da escola, os dados do aluno e a foto biométrica no carimbo."*
- **CTA:** *"Salva esse vídeo pra usar essa técnica nos seus projetos!"*

---

## 🎬 TEMPORADA 4: Financeiro, Cobranças, PIX & Recibos Automáticos
*Foco: Como organizar o dinheiro da escola, evitar contas erradas e emitir recibos timbrados.*

---

### 🟢 Vídeo 18 (35s) — O Erro Financeiro que quase distorceu as contas da escola
- **Duração:** 35 segundos
- **Gancho:** *"Quase passei um susto enorme no dono da escola por causa desse detalhe no código."*
- **Na Tela:** Componente `FinanceiroOverview.vue` mostrando o cálculo de 'A Receber Este Mês'.
- **Roteiro/Voz:** *"Quando o sistema gera 12 parcelas do ano, se você somar tudo que tá pendente, vai parecer que a escola tem R$ 50 mil pra receber no mês! Tive que calibrar o filtro para considerar apenas os vencimentos do mês atual."*
- **CTA:** *"Atenção redobrada com regras de negócio financeiras!"*

---

### 🟢 Vídeo 19 (40s) — Lista de Mensalidades com Ordenação Prioritária
- **Duração:** 40 segundos
- **Gancho:** *"Como organizar centenas de mensalidades pra quem opera o caixa não se perder."*
- **Na Tela:** Tabela `FinanceiroCharges.vue` com as pills de status e as faturas atrasadas no topo em vermelho.
- **Roteiro/Voz:** *"Criamos uma ordenação estratégica: quem tá devendo (atrasado) aparece no topo pra cobrança imediata, depois quem vence este mês e por último as parcelas futuras."*
- **CTA:** *"UX pensada para o trabalho do dia a dia!"*

---

### 🟢 Vídeo 20 (35s) — Baixa de Pagamento no Balcão em 2 Segundos
- **Duração:** 35 segundos
- **Gancho:** *"Dando baixa em mensalidade sem preencher canhotos manuais."*
- **Na Tela:** Clicando no botão 'Dar Baixa', escolhendo a forma de pagamento (PIX / Dinheiro / Cartão) e confirmando.
- **Roteiro/Voz:** *"O aluno pagou na recepção? A secretária clica em dar baixa, escolhe a forma de pagamento e a parcela é quitada na hora, alimentando o caixa e gerando o recibo."*
- **CTA:** *"Adeus caderninho de anotações de pagamento!"*

---

### 🟢 Vídeo 21 (45s) — Gerador de Recibos Timbrados com Valor por Extenso
- **Duração:** 45 segundos
- **Gancho:** *"Criando um emissor de recibos oficiais com valor por extenso automático em TypeScript."*
- **Na Tela:** `ViewReceiptModal.vue` exibindo o recibo com o logotipo da escola, CNPJ, dados do pagador e 'Cento e oitenta reais'.
- **Roteiro/Voz:** *"Construí uma função que escreve qualquer valor em reais por extenso automaticamente. O recibo sai timbrado com os dados da Pop Music, autenticação digital e chave PIX."*
- **CTA:** *"Quer o código dessa função de valor por extenso? Comenta aqui!"*

---

### 🟢 Vídeo 22 (35s) — Envio do Comprovante pelo WhatsApp em 1 Clique
- **Duração:** 35 segundos
- **Gancho:** *"O recurso que a secretária da escola mais agradeceu até hoje."*
- **Na Tela:** Clicando no botão verde do WhatsApp no recibo e abrindo o chat com a mensagem já pré-formatada.
- **Roteiro/Voz:** *"Assim que o pagamento é confirmado, a secretária clica no botão do WhatsApp e o sistema já abre a conversa com o pai enviando os dados do recibo e a confirmação de quitação."*
- **CTA:** *"Pequenas automações que geram um valor gigante pro cliente!"*

---

### 🟢 Vídeo 23 (40s) — Fluxo de Caixa: Entradas, Saídas e Saldo Consolidado
- **Duração:** 40 segundos
- **Gancho:** *"O controle financeiro que faltava para a escola saber o lucro real do mês."*
- **Na Tela:** Tela `FinanceiroCashflow.vue` mostrando entradas verdes, contas pagas em vermelho e saldo final.
- **Roteiro/Voz:** *"Mensalidades recebidas entram automaticamente. Contas de luz, aluguel e comissões dos professores entram como saída. O saldo do caixa bate centavo por centavo."*
- **CTA:** *"Você prefere controlar financeiro no sistema ou na planilha?"*

---

## 🎬 TEMPORADA 5: Comissões dos Professores & Automação de Repasses
*Foco: Como acabar com o estresse do fechamento de mês e cálculo manual de porcentagem.*

---

### 🟢 Vídeo 24 (40s) — A Matemática dos Repasses: 50% por Aluno Ativo
- **Duração:** 40 segundos
- **Gancho:** *"Antes meu amigo gastava o último domingo do mês calculando comissão de professor na calculadora. Olha como ficou agora."*
- **Na Tela:** `FinanceiroTeachers.vue` mostrando os professores com a quantidade de alunos e o valor a pagar.
- **Roteiro/Voz:** *"Cada aluno paga R$ 180 (4 aulas no mês). O sistema multiplica os alunos ativos de cada professor pela porcentagem acordada (padrão 50% = R$ 90) e dá o valor exato a ser pago a cada um."*
- **CTA:** *"Fechamento de mês em 10 segundos!"*

---

### 🟢 Vídeo 25 (35s) — O Botão 'Marcar Tudo Como Pago' e Lançamento no Caixa
- **Duração:** 35 segundos
- **Gancho:** *"Um clique para pagar os professores e registrar a saída no financeiro."*
- **Na Tela:** Clicando em 'Marcar tudo como pago' no professor e vendo a saída sendo lançada no Fluxo de Caixa.
- **Roteiro/Voz:** *"Ao quitar o repasse, o sistema já marca o professor como pago e debita o valor do caixa da escola. Zero chance de esquecer de registrar a despesa."*
- **CTA:** *"Tudo integrado sem retrabalho!"*

---

### 🟢 Vídeo 26 (35s) — Extrato Detalhado do Professor
- **Duração:** 35 segundos
- **Gancho:** *"Acabando com as dúvidas dos professores sobre o valor do pagamento."*
- **Na Tela:** `TeacherStatementModal.vue` com a lista nominal de alunos de cada turma e o valor repassado por cada um.
- **Roteiro/Voz:** *"O professor tem acesso ao demonstrativo com os nomes dos seus alunos e os valores correspondentes. Transparência total que evita qualquer ruído na equipe."*
- **CTA:** *"Organização gera confiança!"*

---

## 🎬 TEMPORADA 6: Diário de Chamada em 1 Clique & Acessos Dedicados
*Foco: A rotina da sala de aula, chamada ultra-rápida e portais exclusivos.*

---

### 🟢 Vídeo 27 (35s) — Chamada da Turma em Menos de 5 Segundos
- **Duração:** 35 segundos
- **Gancho:** *"Nenhum professor quer perder tempo de aula fazendo chamada no diário de papel."*
- **Na Tela:** `dashboard/frequencia.vue`, selecionando a turma de Terça-feira e clicando em 'Marcar todos como presentes'.
- **Roteiro/Voz:** *"O professor abre a turma do dia, clica em 'Marcar todos como presentes' e pronto. Se alguém faltou, basta 1 clique no card do aluno pra marcar falta."*
- **CTA:** *"Simples, rápido e sem enrolação!"*

---

### 🟢 Vídeo 28 (40s) — Justificativa de Falta e Reposição sem Conflito de Feriados
- **Duração:** 40 segundos
- **Gancho:** *"O que acontece quando o aluno traz atestado médico na escola de música?"*
- **Na Tela:** `JustifyAbsenceModal.vue` preenchendo o motivo da falta e selecionando a data de reposição na grade.
- **Roteiro/Voz:** *"O sistema registra o motivo da ausência e permite agendar a aula de reposição, conferindo automaticamente se a nova data não cai em um feriado cadastrado na escola."*
- **CTA:** *"Regra de negócio pensada na realidade da escola!"*

---

### 🟢 Vídeo 29 (35s) — O Portal Exclusivo do Professor no Celular
- **Duração:** 35 segundos
- **Gancho:** *"Como o professor usa o sistema direto da sala de aula pelo smartphone."*
- **Na Tela:** Acessando a rota `/professor` no modo responsivo mobile, visualizando as turmas e a chamada.
- **Roteiro/Voz:** *"O professor não tem acesso às contas da escola. Ele entra com o login dele pelo celular, vê a lista de alunos da aula atual e faz a chamada na hora."*
- **CTA:** *"Interface mobile limpa e focada no essencial!"*

---

### 🟢 Vídeo 30 (35s) — O Portal do Aluno: Aulas e Recibos na Palma da Mão
- **Duração:** 35 segundos
- **Gancho:** *"Como os alunos e pais acompanham tudo direto pelo celular."*
- **Na Tela:** Rota `/aluno` mostrando as próximas aulas, histórico de presença e o botão de baixar o contrato assinado.
- **Roteiro/Voz:** *"Os pais dos alunos podem consultar os horários das aulas, verificar as mensalidades e pegar a 2ª via do contrato assinado quando precisarem."*
- **CTA:** *"A escola ganhou cara de empresa profissional de grande porte!"*

---

## 🎬 TEMPORADA 7: Relatórios Dinâmicos, Segurança & Entrega do Projeto
*Foco: Os relatórios para tomada de decisão, segurança no banco e a entrega final.*

---

### 🟢 Vídeo 31 (40s) — Construtor de Relatórios Dinâmico: Escolha as Colunas e Exporte
- **Duração:** 40 segundos
- **Gancho:** *"Criei um gerador de relatórios flexível onde o dono da escola escolhe o que quer ver."*
- **Na Tela:** `RelatoriosConstrutor.vue` selecionando colunas (Nome, Instrumento, Status, Mensalidade) e gerando a tabela na hora.
- **Roteiro/Voz:** *"Em vez de relatórios fixos, ele pode marcar as colunas que precisa, filtrar por modalidade ou status e exportar a tabela pronta."*
- **CTA:** *"Comenta 'RELATORIO' se você quer ver como programei esse construtor!"*

---

### 🟢 Vídeo 32 (35s) — Relatórios Prontos: Inadimplência e Turmas Mais Rentáveis
- **Duração:** 35 segundos
- **Gancho:** *"Os relatórios que ajudam o dono da escola a tomar decisões estratégicas."*
- **Na Tela:** `RelatoriosProntos.vue` mostrando a taxa de inadimplência e o gráfico de alunos por instrumento.
- **Roteiro/Voz:** *"Com 1 clique ele descobre quais modalidades dão mais lucro, quais turmas estão perto da lotação e quem são os alunos com pagamentos pendentes."*
- **CTA:** *"Dados claros transformam qualquer negócio!"*

---

### 🟢 Vídeo 33 (35s) — Segurança RLS no PostgreSQL (Supabase)
- **Duração:** 35 segundos
- **Gancho:** *"Como garantir que um aluno nunca veja os dados confidenciais da escola."*
- **Na Tela:** Políticas RLS do Supabase (`07_politicas_publicas_contratos.sql`).
- **Roteiro/Voz:** *"Configuramos Row Level Security diretamente no PostgreSQL. Mesmo se alguém tentar consultar o banco via API, o banco só devolve os dados que pertencem ao usuário logado."*
- **CTA:** *"Segurança deve ser prioridade em qualquer software!"*

---

### 🟢 Vídeo 34 (45s) — A Reação do Meu Amigo com a Escola 100% Automatizada
- **Duração:** 45 segundos
- **Gancho:** *"Entreguei o sistema funcionando na escola do meu amigo. Olha o resultado."*
- **Na Tela:** O sistema rodando completo em produção (Desktop + Mobile), mostrando a tela de login com o logotipo da Pop Music e o dashboard ativo.
- **Roteiro/Voz:** *"Ele saiu do papel, das pastas rasgadas e das horas perdidas na calculadora para uma gestão 100% digital com contrato por biometria e baixa no WhatsApp. Se você também é dev, desenvolver software sob medida para negócios locais é uma das melhores formas de gerar valor real."*
- **CTA:** *"Gostou dessa jornada? Deixa seu like e segue o perfil para os próximos projetos!"*

---

## 💡 Dicas de Gravação e Produção em Lote

1. **Grave em Lotes (Batch Recording):**
   - Como o sistema já está 100% funcional, você consegue gravar a tela de 5 a 10 vídeos em uma única tarde.
2. **Mostre a Dor Real:**
   - Em vídeos de software sob medida, citar a dor do cliente real (*"Ele perdia o domingo fechando comissão", "O pai esquecia de assinar o papel"*) retém 3x mais audiência do que falar apenas de código puro.
3. **Mantenha a Linha Cronológica:**
   - Ao publicar, siga a sequência do "Dia 1", "Dia 2", "Semana 1", construindo uma narrativa contínua que faz as pessoas quererem seguir o perfil para ver o desfecho.
