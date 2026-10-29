# Endereço completo do aluno

Cadastro e edição agora exigem logradouro (rua/avenida/quadra), número/lote ou S/N, bairro/setor, cidade, UF e CEP. Complemento é opcional. O perfil exibe o endereço cadastrado.

A migration `202610290050_endereco_completo_aluno.sql` adiciona as colunas estruturadas sem apagar os cadastros existentes. O campo antigo `endereco` permanece preenchido com logradouro, número e complemento para compatibilidade com o contrato. As novas operações `criar_matricula_com_endereco` e `salvar_aluno_com_endereco` reutilizam as regras transacionais de matrícula e edição e salvam o endereço na mesma transação. UF e CEP são normalizados e validados no navegador e no banco. Somente gestão pode executar as operações.

O texto inicial do contrato recebe o endereço antes de ser criado. Ao assinar, o snapshot inclui os campos estruturados; edições posteriores do aluno não modificam o endereço do contrato já assinado. Cadastros antigos devem ter o endereço completado manualmente na edição. Não foram inventados endereços para alunos existentes nem alterados contratos assinados.

A migration foi aplicada no projeto Supabase atual pelo SQL Editor; a presença das colunas e da função foi confirmada pela API. A baseline de recuperação também inclui a migration 050.

Validação: 217 testes passaram. O teste de PostgreSQL criou matrícula com endereço, assinou o contrato e alterou o cadastro, verificando que o snapshot manteve o endereço original. Também verificou rollback para endereço inválido e bloqueio de operação administrativa para professor. Typecheck passou; lint dos arquivos alterados sem erros. O formulário e a máscara de CEP foram conferidos no navegador sem salvar dados fictícios na base real.
