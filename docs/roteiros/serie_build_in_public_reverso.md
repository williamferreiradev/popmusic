# Build in public reverso — Pop Music

Série de 100 vídeos verticais sobre a construção real do sistema. Cada roteiro foi escrito para 30–50 segundos e segue: gancho, desenvolvimento, prova visual e CTA. A história pode ser contada agora, mesmo com o produto já construído: abra com “Eu construí…” ou apresente como episódios da retrospectiva.

## Regras editoriais

- Diga “captura facial como evidência”, nunca “biometria” ou “reconhecimento facial”.
- Pagamentos e baixas são manuais; não prometa PIX automático.
- O canal real implementado é e-mail. WhatsApp automático e Assistente OpenAI são roadmap.
- Mostre dados fictícios ou borrados. Nunca grave CPF, token, e-mail, chave ou senha real.
- Grave em 9:16, com cortes a cada 2–4 segundos, legenda grande e zoom na ação citada.
- Use o resultado de negócio como gancho e o código apenas como prova.

## Temporada 1 — Da dor ao produto

### 01. Três cadernos viraram um sistema

**Gancho:** “Uma escola de música usava até três cadernos para acompanhar cada aluno. Eu transformei isso em um sistema.”

**Fala:** “Cadastro, turma, contrato, mensalidade e presença ficavam espalhados. Antes de escrever código, eu desenhei um único fluxo: o aluno entra uma vez e todas as etapas passam a conversar. O objetivo não era criar mais uma tela bonita; era devolver horas de trabalho para a escola.”

**Tela:** papéis cenográficos → dashboard → aluno → contrato → financeiro. **CTA:** “Qual processo manual mais rouba tempo no seu negócio?”

### 02. O erro de começar pela tecnologia

**Gancho:** “Se eu tivesse começado escolhendo framework, esse projeto teria dado errado.”

**Fala:** “Primeiro mapeei quem trabalha, quais decisões toma e onde repete informação. Só depois defini os módulos: gestão, professor, aluno, matrícula, contrato e financeiro. Software bom começa entendendo operação, não abrindo o VS Code.”

**Tela:** escopo → fluxograma → estrutura do projeto. **CTA:** “Você começa pelo código ou pelo problema?”

### 03. O MVP que parecia pequeno

**Gancho:** “Era ‘só cadastrar alunos’. Até eu abrir o fluxo completo.”

**Fala:** “Cadastrar um aluno envolve maioridade, responsável, turma com vaga, contrato, vencimento, cobrança e acesso. O MVP não ficou gigante por excesso de recursos; ficou consistente porque cada etapa precisava terminar sem deixar dado pela metade.”

**Tela:** formulário passando pelas etapas. **CTA:** “Salva para lembrar: formulário simples pode esconder uma regra enorme.”

### 04. Por que Nuxt e Supabase

**Gancho:** “Eu precisava entregar rápido sem transformar velocidade em dívida técnica.”

**Fala:** “Usei Nuxt para interface e servidor no mesmo projeto, e Supabase para PostgreSQL, autenticação e storage. A vantagem não foi escrever menos código apenas; foi concentrar regras críticas no banco e manter segredo somente no servidor.”

**Tela:** `nuxt.config.ts`, pasta `server`, migrations. **CTA:** “Quer um vídeo só sobre essa arquitetura?”

### 05. Um sistema para três públicos

**Gancho:** “O mesmo login não pode mostrar o mesmo sistema para todo mundo.”

**Fala:** “A gestão vê operação e financeiro. O professor vê suas turmas, alunos e repasse. O aluno vê apenas aulas, frequência, cobranças e contrato próprios. Eu tratei perfil como regra de segurança, não como um menu escondido.”

**Tela:** três logins fictícios e três destinos. **CTA:** “No próximo eu mostro por que esconder botão não protege nada.”

### 06. O design precisava reduzir cliques

**Gancho:** “Interface bonita não resolve uma operação cansativa.”

**Fala:** “O visual escuro ajuda na identidade, mas a decisão importante foi colocar alunos, professores, salas, modalidades e agenda no menu lateral. A pessoa encontra o que usa todo dia sem atravessar cinco telas de configuração.”

**Tela:** menu recolhido/expandido e rotas principais. **CTA:** “Quantos cliques você tolera para uma tarefa diária?”

### 07. Como transformei pedidos falados em escopo

**Gancho:** “O cliente não entrega requisitos; ele conta histórias do dia a dia.”

**Fala:** “Quando ouvi ‘eu uso três cadernos’, traduzi para entidades e regras. Quando ouvi ‘o professor recebe por aluno’, traduzi para competência, mensalidade paga e repasse. Saber programar é importante; saber interpretar a operação é o que cria o produto certo.”

**Tela:** frase do problema → item do escopo → tela pronta. **CTA:** “Comenta ‘escopo’ se quer meu método de diagnóstico.”

### 08. O checklist que impediu uma entrega falsa

**Gancho:** “Tela pronta não significa sistema pronto.”

**Fala:** “Criei um checklist com banco, acesso, contrato, financeiro, segurança, responsividade, deploy e homologação. Isso revelou tarefas invisíveis: backup, restauração, sessão expirada e erro de provedor. Entrega de verdade é comportamento validado, não screenshot bonito.”

**Tela:** checklist mestre rolando. **CTA:** “Quer que eu publique a estrutura desse checklist?”

### 09. Build in public ao contrário

**Gancho:** “Eu esqueci de gravar enquanto construía. Então criei um build in public reverso.”

**Fala:** “Usei commits, migrations e checklists para reconstruir cada decisão real. Isso é melhor do que fingir uma jornada: eu consigo mostrar o problema, a primeira solução, o bug e a correção com evidência.”

**Tela:** `git log` → migration → tela. **CTA:** “Acompanhe: serão 100 decisões reais desse projeto.”

### 10. O que eu decidi não automatizar

**Gancho:** “Automatizar tudo teria piorado a primeira versão.”

**Fala:** “A escola queria controle imediato. Mantivemos pagamento manual e deixamos WhatsApp e Assistente OpenAI para depois. Primeiro garantimos matrícula, contrato, cobrança, chamada e repasse confiáveis. Roadmap bom também sabe dizer ‘ainda não’.”

**Tela:** checklist ‘agora’ versus ‘depois’. **CTA:** “Qual recurso você cortaria de um MVP?”

## Temporada 2 — Modelagem e integridade

### 11. O aluno não é a matrícula

**Gancho:** “Misturar aluno e matrícula na mesma tabela destrói o histórico.”

**Fala:** “O aluno é a pessoa. A matrícula é o vínculo dele com uma turma e pode começar, trancar, trocar ou terminar. Separando isso, eu preservo o passado sem duplicar cadastro e consigo responder onde ele estudou em cada período.”

**Tela:** `alunos` ↔ `matriculas_turma` ↔ `turmas`. **CTA:** “Modelagem simples, histórico preservado.”

### 12. Contrato e cobrança são coisas diferentes

**Gancho:** “Um contrato assinado não é um pagamento.”

**Fala:** “O contrato define valor, vencimento e vigência. As cobranças representam cada competência. Quando o aceite acontece, uma função transacional gera doze parcelas sem duplicar. Assim a escola pode cancelar uma cobrança sem apagar o documento jurídico.”

**Tela:** contrato → RPC → 12 cobranças. **CTA:** “Quer ver a proteção contra duplicidade?”

### 13. Por que usei migrations

**Gancho:** “Editar banco só pelo painel funciona até ninguém saber o que está em produção.”

**Fala:** “Cada mudança virou uma migration versionada: segurança, presença, cobrança, repasse, views e auditoria. O Git passa a contar também a história do banco. Se algo falha, eu sei qual regra entrou e em qual ordem.”

**Tela:** pasta `supabase/migrations` em ordem. **CTA:** “Seu banco também está versionado?”

### 14. Matrícula atômica

**Gancho:** “O pior cadastro é aquele que salva metade.”

**Fala:** “A matrícula cria aluno, vínculos e contrato dentro de uma função SQL. Se a turma lotou ou o CPF já existe, tudo volta atrás. Sem transação, a falha no último passo deixaria aluno órfão e contrato inconsistente.”

**Tela:** função `criar_matricula_com_contrato`. **CTA:** “Transação não é luxo; é proteção operacional.”

### 15. A vaga que duas pessoas tentam ocupar

**Gancho:** “Duas secretárias clicam na última vaga ao mesmo tempo. Quem entra?”

**Fala:** “Validar só no frontend não resolve concorrência. A função bloqueia a turma durante a matrícula, reconta os vínculos ativos e só então confirma. Uma pessoa entra; a outra recebe erro claro. É assim que se evita turma superlotada.”

**Tela:** duas janelas → uma confirmação → um bloqueio. **CTA:** “Esse bug só aparece quando o sistema cresce.”

### 16. CPF duplicado em requisições simultâneas

**Gancho:** “O botão desabilitado não impede cadastro duplicado.”

**Fala:** “Dois pedidos podem chegar ao servidor quase juntos. Por isso a unicidade do CPF vive no PostgreSQL, e a interface apenas melhora a experiência. A última palavra sobre integridade sempre precisa estar no banco.”

**Tela:** índice/constraint e mensagem do modal. **CTA:** “Frontend orienta; banco garante.”

### 17. Conflito de sala e professor

**Gancho:** “A mesma sala não pode receber duas aulas às 14h.”

**Fala:** “A tela avisa antes, mas uma trigger também compara dia e intervalo de horário. Usei lock transacional para impedir que duas turmas concorrentes escapem da validação. A regra protege sala e professor.”

**Tela:** tentativa conflitante no modal e SQL. **CTA:** “Você validaria isso só com horário inicial?”

### 18. Capacidade da turma versus capacidade da sala

**Gancho:** “Não adianta criar uma turma de dez numa sala que comporta quatro.”

**Fala:** “O modal mostra o limite imediatamente e o banco valida novamente. Se a turma já tem alunos, também não deixo reduzir a capacidade abaixo do total matriculado. UX rápida com integridade forte.”

**Tela:** sala capacidade 4 → turma 5 → bloqueio. **CTA:** “Duas camadas, um dado confiável.”

### 19. Nomes duplicados no catálogo

**Gancho:** “Violão e ‘ violão ’ parecem diferentes para um formulário mal feito.”

**Fala:** “Normalizei espaços e criei índice único ignorando maiúsculas. Modalidades e salas não podem nascer duplicadas por variação de digitação. Antes de ativar a regra, uma auditoria verifica se o banco antigo já tem conflito.”

**Tela:** índice com `lower(btrim(nome))`. **CTA:** “Dados limpos começam em detalhes pequenos.”

### 20. Inativar sem apagar

**Gancho:** “Excluir um professor pode apagar a história financeira da escola.”

**Fala:** “Troquei exclusão por inativação. Modalidade, sala, professor e aluno continuam no histórico, mas deixam de aparecer em novos cadastros. Se ainda existe turma ativa, a operação é bloqueada até realocar os vínculos.”

**Tela:** botão inativar, badge e histórico preservado. **CTA:** “Apagar é fácil; preservar contexto é engenharia.”

## Temporada 3 — Segurança e acesso

### 21. Esconder o menu não é segurança

**Gancho:** “Se eu esconder ‘Financeiro’ do professor, ele continua podendo digitar a URL.”

**Fala:** “Protegi em três pontos: middleware de rota, políticas RLS e funções SQL que verificam o papel. Mesmo chamando o Supabase fora da interface, o professor não acessa dados da gestão.”

**Tela:** menu sem item → URL negada → policy. **CTA:** “Segurança precisa sobreviver sem o frontend.”

### 22. Falha fechada no login

**Gancho:** “Um usuário sem perfil nunca pode virar administrador por acidente.”

**Fala:** “Removi o fallback perigoso. Se o perfil não existe, está inativo ou tem papel desconhecido, o sistema encerra a sessão. Em autorização, dúvida significa negar, não liberar.”

**Tela:** middleware com validação. **CTA:** “Esse padrão se chama fail closed.”

### 23. Sessão em cache não é sessão válida

**Gancho:** “O navegador dizia que estava logado; o servidor dizia que não.”

**Fala:** “Antes de liberar rota interna, confirmo o usuário com o servidor. Sessão expirada redireciona ao login e limpa o estado local. Isso evita telas abertas com credencial que já perdeu validade.”

**Tela:** `auth.getUser()` e redirecionamento. **CTA:** “Já encontrou esse bug em SSR?”

### 24. Row Level Security explicada sem jargão

**Gancho:** “O banco pergunta ‘de quem é este dado?’ em toda consulta.”

**Fala:** “RLS são regras aplicadas pelo PostgreSQL. O aluno só lê linhas ligadas ao próprio usuário; o professor só vê suas turmas; gestão tem operações específicas. Não depende de o desenvolvedor lembrar um filtro em cada tela.”

**Tela:** policy e dois resultados diferentes. **CTA:** “Esse é o cinto de segurança do Supabase.”

### 25. As 79 permissões anônimas

**Gancho:** “Minha auditoria encontrou 79 privilégios anônimos em tabelas sensíveis.”

**Fala:** “RLS estava ligada, mas privilégio desnecessário ainda aumentava a superfície de ataque. Revoguei acesso de `anon` e `public`, rodei novamente a auditoria e o resultado caiu para zero. Segurança é verificar, corrigir e provar.”

**Tela:** relatório ERRO 79 → migration → OK 0. **CTA:** “O melhor antes e depois desse projeto foi uma tabela de auditoria.”

### 26. Views seguras para o portal

**Gancho:** “Uma view pode furar sua RLS sem você perceber.”

**Fala:** “As views do aluno e professor usam `security_invoker`: elas executam com os privilégios de quem chamou, não do criador. Depois revoguei acesso público e liberei somente usuários autenticados. A conveniência da view não pode contornar a segurança.”

**Tela:** migration das views e teste. **CTA:** “Revise suas views no Supabase.”

### 27. Service role nunca vai para o navegador

**Gancho:** “Essa chave dá poder total no banco. Um vazamento seria catastrófico.”

**Fala:** “A chave pública pode ir ao cliente porque a RLS protege os dados. A secret key fica apenas nas rotas do servidor. Contrato público usa token, mas operações privilegiadas são executadas no backend e validadas antes.”

**Tela:** variáveis Vercel borradas e pasta `server/api`. **CTA:** “Nunca prefixe segredo com variável pública.”

### 28. Convite de professor sem criar usuário órfão

**Gancho:** “E se o login for criado, mas o perfil falhar?”

**Fala:** “O endpoint cria o acesso e tenta vincular ao professor. Se o vínculo falha, executa compensação e remove o usuário de autenticação recém-criado. Não é uma transação única entre sistemas, então implementei rollback lógico.”

**Tela:** endpoint de convite e bloco de compensação. **CTA:** “Falha parcial também precisa de projeto.”

### 29. Recuperação de senha sem vazar contas

**Gancho:** “A mensagem ‘e-mail não cadastrado’ ajuda um atacante.”

**Fala:** “A recuperação responde de forma neutra, exista ou não a conta. O usuário legítimo recebe o link; quem tenta enumerar e-mails não aprende nada. Pequena escolha de texto, grande diferença de segurança.”

**Tela:** fluxo de recuperação. **CTA:** “Segurança também mora na mensagem.”

### 30. Auditoria sem copiar dados pessoais

**Gancho:** “Logar tudo pode virar outro vazamento.”

**Fala:** “Criei auditoria para operações sensíveis, mas removi token, foto, CPF e contato das cópias. O log precisa responder quem fez, quando e qual operação — não duplicar o banco inteiro.”

**Tela:** trigger e campos mascarados. **CTA:** “Observabilidade com minimização de dados.”

## Temporada 4 — Matrícula e responsável

### 31. Maioridade calculada corretamente

**Gancho:** “Ano de nascimento não basta para saber se alguém tem 18.”

**Fala:** “Calculo usando data completa e o dia atual. Até o dia anterior ao aniversário, o aluno continua menor. Também rejeito data futura e inválida. Essa decisão muda quem aparece como contratante.”

**Tela:** testes do aniversário de 18 anos. **CTA:** “Um dia muda todo o contrato.”

### 32. Contrato do menor

**Gancho:** “No contrato do menor, quem assume a obrigação é o responsável.”

**Fala:** “O aluno continua identificado como beneficiário, mas nome e CPF do contratante vêm do responsável. O cadastro torna esses campos obrigatórios e o documento usa a mesma regra. Tela e contrato não podem discordar.”

**Tela:** formulário menor → contrato. **CTA:** “Regra jurídica precisa atravessar o sistema inteiro.”

### 33. Modalidade primeiro, turma depois

**Gancho:** “Mostrar cinquenta horários de uma vez confundia a matrícula.”

**Fala:** “Coloquei um dropdown de modalidade. Ao escolher teclado, aparecem apenas cards de teclado com dia, hora, professor, sala e vagas. A interface segue a decisão natural da secretaria.”

**Tela:** escolher teclado → cards filtrados. **CTA:** “Boa UX reduz opções no momento certo.”

### 34. Por que só aparecia uma modalidade

**Gancho:** “O banco tinha várias modalidades, mas o dropdown mostrava uma.”

**Fala:** “Investiguei query, status ativo e relacionamento, em vez de preencher opção manualmente. Corrigir a origem mantém o catálogo dinâmico: qualquer modalidade nova passa a aparecer sem alterar código.”

**Tela:** Supabase → query → dropdown completo. **CTA:** “Nunca resolva dado faltando com opção hardcoded.”

### 35. Dia de vencimento por matrícula

**Gancho:** “Nem todo aluno consegue pagar no mesmo dia.”

**Fala:** “Adicionei vencimento de 1 a 28 no cadastro e passei o valor até o contrato transacional. As doze mensalidades nascem usando essa escolha. Evitei 29, 30 e 31 para não criar datas impossíveis em fevereiro.”

**Tela:** seletor → contrato → cobranças. **CTA:** “Regra pequena que evita manutenção mensal.”

### 36. Mensagem de sucesso que mentia

**Gancho:** “A matrícula funcionava, mas a tela dizia que o e-mail foi enviado mesmo quando não foi.”

**Fala:** “Separei dois resultados: cadastro concluído e entrega do e-mail. Se o provedor falhar, o sistema mostra o link para copiar e avisa o operador. Nunca transforme falha externa em sucesso visual.”

**Tela:** estados `emailSent` verdadeiro e falso. **CTA:** “Sucesso parcial precisa ser explícito.”

### 37. Editar sem apagar matrícula

**Gancho:** “Atualizar telefone não pode destruir o vínculo com a turma.”

**Fala:** “A edição altera dados pessoais sem recriar aluno ou matrícula. Relacionamentos acadêmicos têm ciclo próprio. Separar responsabilidades evita que uma mudança simples apague histórico.”

**Tela:** editar telefone → turma permanece. **CTA:** “CRUD genérico nem sempre serve para regra real.”

### 38. Troca de turma com histórico

**Gancho:** “Mover um aluno não é trocar um ID.”

**Fala:** “Encerramos o vínculo anterior com data e criamos um novo após validar vaga. Assim agenda atual reflete a troca, mas relatórios antigos continuam sabendo onde ele estava.”

**Tela:** vínculo antigo encerrado → novo ativo. **CTA:** “Histórico é dado, não lixo.”

### 39. Trancar e destrancar

**Gancho:** “Trancar não é cancelar.”

**Fala:** “No trancamento, preservo aluno, contrato e histórico, interrompo o vínculo e registro motivo e período. Ao destrancar, valido se a turma ainda existe e tem vaga. Estados diferentes precisam de regras diferentes.”

**Tela:** modal de trancamento e retorno. **CTA:** “Seu sistema distingue pausa de encerramento?”

### 40. Cancelamento sem fidelidade

**Gancho:** “Se não há fidelidade, o que acontece com as cobranças futuras?”

**Fala:** “Pagamentos ficam pagos. Vencidos continuam devidos. O mês com aula realizada é preservado. Cobranças futuras elegíveis são canceladas e matrícula e contrato são encerrados sem apagar histórico.”

**Tela:** regra antes/depois. **CTA:** “Regra financeira clara evita discussão depois.”

## Temporada 5 — Contrato digital

### 41. Token criptográfico, não número aleatório

**Gancho:** “Um link de contrato previsível expõe dados pessoais.”

**Fala:** “O token nasce com bytes criptográficos no banco e expira em sete dias. Não usei `Math.random()`. O link funciona como uma credencial temporária e precisa ser tratado com o mesmo cuidado de uma senha.”

**Tela:** `gen_random_bytes` com token borrado. **CTA:** “Aleatório não significa seguro.”

### 42. Link expirado não é contrato inexistente

**Gancho:** “Esses dois erros parecem iguais, mas exigem respostas diferentes.”

**Fala:** “Contrato inexistente orienta conferir o link. Expirado ou cancelado orienta pedir novo envio. Falha temporária manda tentar novamente. Modelei status HTTP e mensagens separadas para o usuário agir certo.”

**Tela:** três estados da página. **CTA:** “Mensagem de erro também é produto.”

### 43. Captura facial sem vender ‘biometria’

**Gancho:** “Tirar uma foto não é fazer reconhecimento facial.”

**Fala:** “O sistema captura uma imagem ao vivo como evidência do aceite, mas não compara identidade com documento. Por isso a interface usa ‘foto facial’, não ‘biometria’. Precisão técnica protege o cliente e a confiança do usuário.”

**Tela:** captura e texto de consentimento. **CTA:** “Tecnologia boa não precisa de promessa exagerada.”

### 44. Câmera recusada no celular

**Gancho:** “A melhor assinatura digital falha se a câmera não abrir.”

**Fala:** “Tratei permissão negada, câmera ocupada, ausência de dispositivo e interrupção. Cada erro recebe instrução prática em vez de um código técnico. No celular, recuperação vale tanto quanto o caminho feliz.”

**Tela:** simular permissão negada e mensagem. **CTA:** “Teste o que acontece quando o usuário diz não.”

### 45. Validando a imagem no servidor

**Gancho:** “O atributo `accept=image` não protege seu backend.”

**Fala:** “Valido tamanho, base64, assinatura real de JPEG/PNG, dimensões e qualidade mínima no servidor. O nome do arquivo e o MIME enviados pelo navegador não são prova do conteúdo.”

**Tela:** `imageMetadata` e tentativa inválida. **CTA:** “Nunca confie apenas na extensão.”

### 46. Consentimento separado do aceite

**Gancho:** “Concordar com o contrato não é automaticamente autorizar a foto.”

**Fala:** “Usei duas confirmações: aceite das cláusulas e autorização específica para captura e armazenamento da evidência. O servidor exige `photoConsent=true` e a função registra o consentimento junto da assinatura.”

**Tela:** dois checkboxes e botão bloqueado. **CTA:** “Consentimento precisa ser explícito.”

### 47. Storage privado e URL temporária

**Gancho:** “A foto do contrato nunca deveria ter um link público eterno.”

**Fala:** “O bucket é privado. No banco guardo o caminho; quando alguém autorizado visualiza, o servidor cria uma URL assinada válida por poucos minutos. Isso reduz exposição de uma evidência sensível.”

**Tela:** bucket privado e `createSignedUrl`. **CTA:** “Privado por padrão.”

### 48. Assinatura atômica

**Gancho:** “Foto salva e contrato não assinado é uma falha perigosa.”

**Fala:** “Depois do upload, uma RPC bloqueia o contrato, valida token novamente, registra aceite e gera cobranças idempotentes. Se a assinatura falha, removo a foto enviada. Cada compensação evita lixo e inconsistência.”

**Tela:** upload → RPC → remoção em erro. **CTA:** “Pense sempre no passo que falha no meio.”

### 49. Documento imutável

**Gancho:** “E se a escola editar o modelo depois que o aluno assinou?”

**Fala:** “No aceite, congelo um snapshot com aluno, responsável, escola, turmas e cláusulas e gero hash SHA-256. A visualização futura usa essa cópia histórica, não os dados atuais.”

**Tela:** snapshot JSON e hash borrado. **CTA:** “Documento assinado não pode ser uma tela viva.”

### 50. Doze cobranças sem duplicar

**Gancho:** “Dois cliques na assinatura não podem criar 24 mensalidades.”

**Fala:** “O banco bloqueia a linha do contrato e usa unicidade por contrato e vencimento. A segunda requisição encontra o aceite concluído e para. Idempotência é o que torna uma operação segura para repetir.”

**Tela:** duas chamadas → total continua 12. **CTA:** “Todo botão crítico merece idempotência.”

## Temporada 6 — Financeiro manual confiável

### 51. Por que o pagamento ficou manual

**Gancho:** “Nem toda automação financeira deve entrar no primeiro lançamento.”

**Fala:** “A escola recebe por canais diferentes e queria controle imediato. Mantive a baixa manual com data, forma, conta e observação. O objetivo foi substituir o caderno sem impor um gateway novo à operação.”

**Tela:** modal de baixa manual. **CTA:** “Automação deve acompanhar a maturidade do processo.”

### 52. Cobrança pendente versus atrasada

**Gancho:** “Pendente não significa inadimplente.”

**Fala:** “Uma cobrança só fica atrasada quando está pendente e o vencimento passou. As futuras continuam pendentes. Essa diferença alimenta filtros e indicadores sem assustar a gestão com inadimplência inexistente.”

**Tela:** três datas e três badges. **CTA:** “Status é regra, não apenas cor.”

### 53. Baixa duplicada bloqueada

**Gancho:** “Dois cliques no pagamento não podem gerar duas entradas no caixa.”

**Fala:** “A RPC bloqueia a cobrança, confirma que ainda está aberta e grava pagamento, recibo e fluxo de caixa na mesma transação. Se já foi paga, a segunda tentativa é recusada.”

**Tela:** duplo clique → uma entrada. **CTA:** “Financeiro não aceita ‘quase certo’.”

### 54. Recibo só depois do dinheiro

**Gancho:** “Gerar recibo antes da baixa cria uma prova falsa.”

**Fala:** “O recibo nasce somente dentro da transação que confirma o pagamento. Ele herda valor, data, forma e responsável. Se o caixa falhar, nada é confirmado.”

**Tela:** baixa → recibo → caixa. **CTA:** “A ordem dos eventos protege a verdade financeira.”

### 55. Estorno não apaga história

**Gancho:** “Estornar não é deletar o pagamento.”

**Fala:** “O estorno registra motivo, responsável e movimento inverso no caixa, preservando recibo e auditoria. Assim a escola consegue explicar o que aconteceu meses depois.”

**Tela:** pagamento → estorno → lançamentos. **CTA:** “Histórico financeiro precisa ser rastreável.”

### 56. Cancelar cobrança com trava

**Gancho:** “Uma parcela paga não pode simplesmente virar cancelada.”

**Fala:** “A função bloqueia a linha e valida o status. Cancelamento serve para cobrança aberta e guarda motivo. Para pagamento confirmado existe estorno, com outro fluxo e outra evidência.”

**Tela:** tentativa em paga → bloqueio. **CTA:** “Ações parecidas podem ter impactos totalmente diferentes.”

### 57. O bug do ‘a receber’ anual

**Gancho:** “Doze parcelas fizeram o dashboard parecer doze vezes mais rico.”

**Fala:** “Somar todo status pendente misturava competências futuras com o mês atual. Levei o cálculo para uma função SQL que filtra o período certo. Indicador bonito com regra errada é desinformação.”

**Tela:** valor errado → query por mês → valor correto. **CTA:** “Sempre pergunte qual período uma métrica representa.”

### 58. Resumos calculados no banco

**Gancho:** “Baixar milhares de cobranças para somar no navegador não escala.”

**Fala:** “Criei RPCs para resumo financeiro, cobranças, contratos e fluxo de caixa. O PostgreSQL agrega perto dos dados e devolve poucos números. A interface fica rápida e o cálculo consistente.”

**Tela:** RPC e cards carregando. **CTA:** “Mande a computação para onde os dados estão.”

### 59. Paginação de verdade

**Gancho:** “Esconder linhas com `slice` não é paginação.”

**Fala:** “Alunos, contratos, cobranças, recibos e caixa usam `range` no Supabase e contagem total. O navegador recebe apenas a página atual. Isso reduz memória, rede e tempo de renderização.”

**Tela:** request com range e paginação. **CTA:** “Sua tabela pagina no servidor ou só na tela?”

### 60. Paginação quando o total diminui

**Gancho:** “Você está na página cinco, apaga o filtro e a tabela fica vazia.”

**Fala:** “Quando o total muda, recalculo a última página válida e corrijo o índice. Também bloqueio ‘Próximo’ com `>=`, não apenas igualdade. É um detalhe pequeno que evita um falso estado vazio.”

**Tela:** página alta → filtro → ajuste automático. **CTA:** “Edge cases vivem nas bordas da paginação.”

### 61. Busca sem atacar o banco a cada tecla

**Gancho:** “Digitar ‘William’ não precisa disparar sete consultas.”

**Fala:** “Adicionei debounce de 350 milissegundos. A busca espera uma pequena pausa e consulta nome, CPF ou e-mail no servidor. A interface continua responsiva e o banco trabalha menos.”

**Tela:** rede antes/depois. **CTA:** “Performance também é evitar trabalho desnecessário.”

### 62. Erro não é lista vazia

**Gancho:** “O banco caiu e a tela disse ‘nenhum aluno cadastrado’.”

**Fala:** “Esse era um padrão perigoso: capturar erro e retornar array vazio. Separei loading, erro e vazio em alunos, catálogos e portais. Agora o operador não toma decisão com base numa mentira visual.”

**Tela:** três estados lado a lado. **CTA:** “Nunca esconda falha como ausência de dados.”

### 63. Chave PIX configurável

**Gancho:** “Chave PIX hardcoded vira problema na primeira troca de conta.”

**Fala:** “Removi valores fixos e centralizei dados oficiais da escola em configuração: nome, CNPJ, contato, remetente e PIX. Contrato, e-mail e recibo consultam a mesma fonte.”

**Tela:** configuração → três documentos. **CTA:** “Dado institucional não pertence espalhado no código.”

### 64. E-mail de recibo real

**Gancho:** “Abrir um alerta ‘enviado’ não significa que o provedor aceitou o e-mail.”

**Fala:** “O endpoint valida destinatário, chama o Resend, verifica `response.ok` e registra entrega ou falha. A interface só confirma quando recebe sucesso real.”

**Tela:** log de entrega e estados. **CTA:** “Integração externa precisa de evidência.”

### 65. Logs de e-mail sem expor destinatário

**Gancho:** “Observabilidade não precisa vazar o e-mail do aluno.”

**Fala:** “Registro tipo de mensagem, status, código de erro e destinatário mascarado. Isso ajuda suporte e auditoria sem copiar contato completo para logs.”

**Tela:** tabela de comunicações mascarada. **CTA:** “Logue o necessário, não tudo.”

## Temporada 7 — Professor, chamada e repasse

### 66. Dashboard separado do professor

**Gancho:** “Professor não precisa navegar pelo financeiro da escola para fazer chamada.”

**Fala:** “Criei um portal mobile com aulas, alunos, chamada e repasse próprios. Menos opções tornam a tarefa diária mais rápida e reduzem o risco de acesso indevido.”

**Tela:** sidebar do professor no celular. **CTA:** “Interface também deve respeitar o papel.”

### 67. Turmas reais, sem mock

**Gancho:** “A tela estava linda, mas os alunos eram inventados.”

**Fala:** “Substituí os cards simulados por views filtradas pelo professor autenticado. Modalidade, sala, capacidade e matrículas vêm do banco. Mock ajuda a desenhar; precisa sair antes da entrega.”

**Tela:** dados fake → query real. **CTA:** “Qual mock ainda está escondido no seu projeto?”

### 68. Chamada em poucos cliques

**Gancho:** “A aula não pode começar com cinco minutos de burocracia.”

**Fala:** “O professor abre a turma, marca todos presentes e altera apenas as exceções. Cada presença é vinculada a aluno, turma e data. Reabrir a aula carrega o que já foi salvo.”

**Tela:** marcar todos → uma falta → recarregar. **CTA:** “O melhor fluxo otimiza o caso mais comum.”

### 69. Presença duplicada

**Gancho:** “Recarregar a tela não pode contar o mesmo aluno duas vezes.”

**Fala:** “Além do controle na interface, o banco tem unicidade para o registro de presença da aula. Repetição vira atualização controlada ou erro, não uma segunda linha silenciosa.”

**Tela:** constraint e recarga. **CTA:** “Duplicidade se bloqueia na origem.”

### 70. Finalizar chamada

**Gancho:** “Salvar e finalizar são ações diferentes.”

**Fala:** “Durante a aula, o professor pode ajustar. Ao finalizar, crio um fechamento com data e responsável. Depois disso, a chamada deixa de ser rascunho e passa a ser registro operacional.”

**Tela:** botão finalizar e badge. **CTA:** “Estado explícito torna o fluxo auditável.”

### 71. Bloqueio depois da finalização

**Gancho:** “Desabilitar o botão não impedia alteração direta no banco.”

**Fala:** “A migration 034 adiciona políticas que impedem insert e update do professor quando existe fechamento ativo. A gestão pode reabrir com motivo; o professor não consegue contornar pelo cliente.”

**Tela:** UI bloqueada → tentativa direta negada. **CTA:** “Regra crítica pertence ao banco.”

### 72. Reabertura com motivo

**Gancho:** “Corrigir um erro não deveria apagar que o erro aconteceu.”

**Fala:** “Somente a gestão reabre uma chamada finalizada, informando motivo. O histórico guarda fechamento e reabertura. Correção é permitida, mas deixa trilha.”

**Tela:** modal de motivo e auditoria. **CTA:** “Flexibilidade com responsabilidade.”

### 73. Presença não libera repasse

**Gancho:** “O aluno foi à aula, mas ainda não pagou. O professor recebe?”

**Fala:** “A regra acordada usa mensalidade paga como base. Presença é informativa e não libera dinheiro sozinha. Separei o fato acadêmico do gatilho financeiro para não misturar duas verdades diferentes.”

**Tela:** presença registrada + cobrança pendente + repasse ausente. **CTA:** “Regra de negócio precisa ser explícita.”

### 74. Percentual ou valor fixo

**Gancho:** “Nem todo professor recebe do mesmo jeito.”

**Fala:** “O cadastro permite percentual da mensalidade ou valor fixo por aluno pago. O cálculo congela tipo, base e valor da competência, para uma alteração futura não reescrever o passado.”

**Tela:** duas formas de repasse. **CTA:** “Configuração atual não pode alterar fechamento antigo.”

### 75. Repasse vinculado à mensalidade

**Gancho:** “Como provar de qual pagamento saiu cada comissão?”

**Fala:** “Cada item de repasse aponta para cobrança e turma. O extrato mostra professor, aluno, modalidade, competência e regra aplicada. Transparência reduz discussão no fechamento.”

**Tela:** demonstrativo detalhado. **CTA:** “Todo total financeiro deveria ser explicável.”

### 76. Repasse complementar

**Gancho:** “Uma mensalidade atrasada foi paga depois do fechamento. E agora?”

**Fala:** “O sistema permite gerar item complementar para pagamentos que chegaram depois, sem pagar novamente o que já entrou no repasse anterior. Unicidade por cobrança e turma evita duplicação.”

**Tela:** competência fechada → pagamento tardio → complemento. **CTA:** “O mundo real não fecha exatamente à meia-noite.”

### 77. Pagar professor e lançar no caixa

**Gancho:** “Marcar o professor como pago sem registrar a saída quebra o saldo.”

**Fala:** “A quitação registra data, conta e responsável e cria a saída financeira na mesma operação. Depois atualizo repasses, caixa e resumo em conjunto para a tela não ficar contraditória.”

**Tela:** pagar → saída → saldo. **CTA:** “Módulos integrados precisam atualizar juntos.”

### 78. Professor só vê o próprio repasse

**Gancho:** “Trocar um filtro no navegador não pode revelar o salário do colega.”

**Fala:** “A view e a RLS relacionam o usuário autenticado ao professor. Mesmo tentando outro ID, o banco devolve apenas os próprios itens. Privacidade salarial não pode depender de parâmetro do frontend.”

**Tela:** dois perfis e respostas isoladas. **CTA:** “Teste autorização alterando IDs.”

## Temporada 8 — Agenda e catálogos

### 79. Modalidades no menu lateral

**Gancho:** “Uma configuração usada todo dia estava escondida em vários cliques.”

**Fala:** “Levei modalidades, salas e professores para o menu principal. O ganho não foi técnico: foi reduzir o caminho mental da secretaria. Configuração operacional merece acesso operacional.”

**Tela:** caminho antigo versus novo. **CTA:** “Arquitetura de informação também economiza tempo.”

### 80. CRUD reversível de modalidades

**Gancho:** “A escola parou de oferecer bateria. Eu apago a modalidade?”

**Fala:** “Não. Ela fica inativa e some de novas matrículas, mas permanece em contratos e históricos. Para reativar, um clique devolve a opção. O banco impede inativar enquanto houver turma ativa.”

**Tela:** inativar, bloquear e reativar. **CTA:** “Reversível é mais seguro que destrutivo.”

### 81. Salas com modalidade padrão

**Gancho:** “Uma sala de bateria pode sugerir a configuração certa sem limitar o uso.”

**Fala:** “A sala guarda capacidade e uma modalidade padrão opcional. Isso acelera cadastro, mas ‘uso geral’ continua disponível. Sugestão de interface não vira restrição de negócio sem necessidade.”

**Tela:** cadastro da sala e dropdown. **CTA:** “Padrão bom ajuda sem aprisionar.”

### 82. O bug da edição de turma

**Gancho:** “A agenda mostrava os nomes, mas editar abria campos vazios.”

**Fala:** “A query carregava relações de modalidade, professor e sala, porém não os IDs estrangeiros usados pelo formulário. Adicionei os três campos explicitamente e um teste para impedir regressão.”

**Tela:** antes vazio → select SQL → depois preenchido. **CTA:** “Dado visível nem sempre é dado editável.”

### 83. Agenda em dia, semana e mês

**Gancho:** “A mesma grade precisa responder três perguntas diferentes.”

**Fala:** “Dia mostra a rotina imediata; semana ajuda distribuir horários; mês dá visão de calendário. As três visualizações usam as mesmas turmas recorrentes e navegação de período.”

**Tela:** alternar Dia/Semana/Mês. **CTA:** “Qual visão você usaria mais?”

### 84. Popup da aula com contexto real

**Gancho:** “Quantidade de alunos não basta para preparar a aula.”

**Fala:** “Ao clicar na turma, a gestão vê modalidade, professor, sala, capacidade, foto contratual e situação financeira de cada matriculado. Reuni contexto sem abrir cinco telas.”

**Tela:** popup com dados fictícios. **CTA:** “Contexto certo reduz navegação.”

### 85. Agenda não cria presença

**Gancho:** “Estar agendado não significa ter comparecido.”

**Fala:** “Removi a criação de presenças futuras na assinatura. A agenda vem do vínculo com a turma; presença só nasce quando o professor faz chamada. Planejado e realizado são dados diferentes.”

**Tela:** turma recorrente versus chamada. **CTA:** “Não antecipe fatos no banco.”

## Temporada 9 — Portais e experiência

### 86. Portal do aluno

**Gancho:** “O aluno não precisa perguntar toda semana qual é o horário.”

**Fala:** “O portal reúne aulas, frequência, financeiro e contrato. As views identificam o aluno pelo usuário autenticado e retornam somente os dados próprios.”

**Tela:** quatro rotas do aluno. **CTA:** “Autonomia reduz mensagens para a secretaria.”

### 87. Responsividade não é encolher desktop

**Gancho:** “Uma tabela de mensalidades não cabe em 360 pixels.”

**Fala:** “Ajustei padding, navegação e rolagem horizontal controlada. No celular, o conteúdo continua acessível sem cortar valor ou status. Responsividade é decidir como usar o espaço, não apenas adicionar breakpoint.”

**Tela:** viewport 360 px. **CTA:** “Teste sempre no menor aparelho suportado.”

### 88. Loading, vazio e erro

**Gancho:** “Três telas visualmente parecidas contam histórias opostas.”

**Fala:** “Loading significa aguarde. Vazio significa não existe registro. Erro significa não conseguimos consultar. Separei esses estados no portal, agenda, catálogos e alunos para ninguém interpretar uma falha como verdade.”

**Tela:** comparação tripla. **CTA:** “Seu sistema distingue os três?”

### 89. Menu recolhido

**Gancho:** “No notebook, a navegação não pode roubar metade da tela.”

**Fala:** “O menu lateral reduz para ícones e expande quando necessário. Cada perfil recebe seus próprios itens. Isso preserva espaço para tabelas e agenda sem perder orientação.”

**Tela:** transição do sidebar. **CTA:** “Ícone sozinho precisa de tooltip.”

### 90. Tema claro e escuro

**Gancho:** “Dark mode não é inverter preto e branco.”

**Fala:** “Defini superfícies, bordas, contraste, estados e cor primária para os dois temas. O usuário alterna a preferência e cada componente mantém hierarquia visual.”

**Tela:** transição dos temas. **CTA:** “Qual versão combina mais com uma escola de música?”

## Temporada 10 — Testes, deploy e bastidores

### 91. O primeiro 500 na Vercel

**Gancho:** “Local funcionava; produção respondia 500.”

**Fala:** “O problema estava na configuração de variáveis do Nuxt e da Vercel. Alinhei nomes públicos e privados, mantive a secret key só no servidor e redeployei. Deploy não termina quando o build fica verde.”

**Tela:** log 500 borrado → variáveis → login 200. **CTA:** “Sempre teste a URL de produção.”

### 92. `.env` não vai para o GitHub

**Gancho:** “Um commit errado pode entregar seu banco para a internet.”

**Fala:** “Revisei `.gitignore`, mantive apenas um modelo sem valores e configurei segredos direto na Vercel. Aspas no `.env` são opcionais em valores simples; proteção do arquivo não é.”

**Tela:** `.gitignore` e `.env.example`. **CTA:** “Cheque seu histórico antes do push.”

### 93. SQL aplicado manualmente e versionado

**Gancho:** “Executar no editor do Supabase sem salvar o arquivo cria dois bancos diferentes.”

**Fala:** “Cada script aplicado também existe como migration no repositório. Assim consigo auditar até qual versão a produção chegou e repetir a estrutura em homologação.”

**Tela:** SQL Editor e arquivo correspondente. **CTA:** “Painel executa; Git documenta.”

### 94. A view que não aceitava trocar coluna

**Gancho:** “O PostgreSQL recusou: ‘cannot change name of view column’.”

**Fala:** “`CREATE OR REPLACE VIEW` não permite renomear colunas dessa forma. A correção foi recriar a view mantendo ordem e nomes compatíveis, ou renomear explicitamente. Erro de migration também ensina contrato de esquema.”

**Tela:** mensagem 42P16 e correção. **CTA:** “Leia o hint do PostgreSQL; ele costuma dizer o caminho.”

### 95. A coluna `mt.status` que não existia

**Gancho:** “Uma query inteira caiu por assumir uma coluna que o modelo nunca teve.”

**Fala:** “Matrícula ativa era representada por `data_fim is null`, não por `status='ativa'`. Corrigi a SQL para falar a linguagem real do schema. Nome intuitivo não substitui inspeção do banco.”

**Tela:** erro 42703 → schema → condição correta. **CTA:** “Nunca escreva migration por memória.”

### 96. Testes de contrato sem tocar produção

**Gancho:** “Como testar integrações SQL sem apagar dado real?”

**Fala:** “Criei testes que inspecionam contratos essenciais do código e das migrations: RPC usada, parâmetros, RLS, idempotência e regras críticas. Eles não substituem homologação, mas detectam regressões antes do deploy.”

**Tela:** execução dos testes. **CTA:** “Teste automatizado e UAT têm papéis diferentes.”

### 97. De zero a 84 testes

**Gancho:** “Cada bug importante virou uma trava permanente.”

**Fala:** “Maioridade, vencimento, repasse, matrícula, assinatura, segurança, paginação, agenda e estados de erro agora têm cobertura. O número importa menos que as regras protegidas.”

**Tela:** suítes passando. **CTA:** “Teste o risco, não só a função fácil.”

### 98. Typecheck e lint como gate

**Gancho:** “Compilar no navegador não significa que o projeto está saudável.”

**Fala:** “Adicionei typecheck e ESLint ao fluxo. Zerei erros e mantive avisos legados mapeados para evolução gradual. Antes de cada publicação, testes, tipos e lint precisam passar.”

**Tela:** três comandos verdes. **CTA:** “Seu deploy tem quais gates?”

### 99. Auditoria final com zero problemas

**Gancho:** “Eu queria uma prova melhor que ‘acho que está seguro’.”

**Fala:** “A SQL final verifica duplicidades, índices, RLS, privilégios anônimos, views seguras e bucket privado. Depois das correções, todas as linhas voltaram `OK` e zero problemas.”

**Tela:** tabela final de auditoria. **CTA:** “Transforme requisito em consulta verificável.”

### 100. O que eu entregaria e o que deixaria para depois

**Gancho:** “Depois de 100 decisões, o sistema está pronto? A resposta honesta é esta.”

**Fala:** “O núcleo está construído e validado tecnicamente. Antes da entrega definitiva ainda existem homologação com usuários reais, backup, URLs de autenticação, e-mail de produção e treinamento. Assistente, áudio e WhatsApp automático ficam no roadmap. Produto responsável separa pronto, pendente e futuro.”

**Tela:** checklist em três colunas. **CTA:** “Quer acompanhar a homologação real e a entrega para a escola?”

## Encerramentos alternativos para não repetir CTA

1. “Salva este vídeo para revisar no seu próximo projeto.”
2. “Comenta o nome do seu negócio que eu sugiro uma automação.”
3. “Você faria diferente? Quero ler sua solução.”
4. “Segue para ver o bug que apareceu na próxima etapa.”
5. “Manda para alguém que ainda controla isso no papel.”
6. “Comenta ‘parte 2’ que eu abro o código.”
7. “Qual seria seu próximo teste?”
8. “Quer a migration explicada linha por linha?”
9. “Você confiaria esse fluxo aos seus dados?”
10. “Amanhã eu mostro o antes e depois na prática.”
