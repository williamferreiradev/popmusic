# Pop Music

Sistema de gestão para escola de música. A aplicação centraliza alunos, professores, modalidades, salas, turmas, agenda, frequência, contratos, cobranças manuais, repasses e relatórios. Também possui áreas autenticadas específicas para gestão, professor e aluno.

## Stack

- Nuxt 4, Vue 3 e TypeScript
- Supabase Auth, PostgreSQL, Row Level Security (RLS) e Storage
- Deploy da aplicação na Vercel

## Pré-requisitos

- Node.js compatível com o Nuxt 4
- npm
- Um projeto Supabase **já provisionado com o schema do Pop Music**

> Ainda não existe uma migration-base completa capaz de criar todo o banco a partir de um projeto Supabase vazio. As migrations atuais são incrementais e partem do schema já existente. Criar essa baseline é uma dívida técnica documentada do projeto.

## Configuração local

Instale as dependências:

```bash
npm install
```

Crie o arquivo `.env` a partir de `.env.example` e preencha:

```dotenv
NUXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NUXT_PUBLIC_SUPABASE_KEY=sb_publishable_SUA_CHAVE_PUBLICA
NUXT_SUPABASE_SECRET_KEY=sb_secret_SUA_CHAVE_SECRETA
NUXT_PUBLIC_APP_URL=http://localhost:3000
```

- `NUXT_PUBLIC_SUPABASE_URL`: URL pública do projeto Supabase.
- `NUXT_PUBLIC_SUPABASE_KEY`: chave publicável usada pelo navegador e protegida por RLS.
- `NUXT_SUPABASE_SECRET_KEY`: chave administrativa usada exclusivamente pelas rotas do servidor. Nunca use prefixo `NUXT_PUBLIC_` nessa variável e nunca a envie ao Git.
- `NUXT_PUBLIC_APP_URL`: URL pública da aplicação; em produção, use o domínio da Vercel.

Inicie o ambiente de desenvolvimento:

```bash
npm run dev
```

A aplicação ficará disponível em `http://localhost:3000`.

## Banco de dados e migrations

As alterações versionadas do banco ficam em [`supabase/migrations`](supabase/migrations) e devem ser aplicadas em ordem crescente pelo nome do arquivo. A migration obrigatória mais recente é:

```text
202609160045_acesso_usuarios_transacional.sql
```

Ela corrige o provisionamento administrativo de `gestao` e `professor`. A criação no Supabase Auth continua sendo uma chamada externa; perfil e vínculo do professor são gravados juntos em uma RPC PostgreSQL transacional, e o serviço trata repetição, timeout e conta preexistente de forma idempotente.

Antes de publicar uma versão:

1. Faça backup do banco de produção.
2. Confirme quais migrations ainda não foram aplicadas.
3. Execute antes o diagnóstico somente leitura em `supabase/manual/diagnostico_acessos_usuarios.sql`.
4. Aplique as migrations pendentes, na ordem, pelo fluxo controlado do Supabase (CLI vinculada ao projeto ou SQL Editor).
5. Execute os testes da aplicação.
6. Só então faça o deploy da aplicação.

**A Vercel não executa migrations do Supabase automaticamente.** Fazer deploy do código sem aplicar a migration correspondente pode deixar frontend, API e banco incompatíveis.

Os arquivos da raiz `03_seed.sql` e `04_user_trigger.sql` são legados e **não devem ser executados**. Eles não representam o schema atual e podem causar dados inválidos ou substituir regras mais novas.

A Edge Function `supabase/functions/convidar-usuario` também é legado e não deve ser implantada. O fluxo vigente sem SMTP é a rota Nuxt `server/api/admin/invite-user.post.ts`.

## Verificações

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

- `npm test`: valida regras de acesso, provisionamento, negócio, contratos do banco e RLS.
- `npm run typecheck`: valida os tipos TypeScript e Vue.
- `npm run lint`: verifica o padrão estático do código.
- `npm run build`: confirma que o bundle de produção pode ser gerado.

## Deploy na Vercel

Cadastre as quatro variáveis de ambiente descritas acima no projeto da Vercel. A chave `NUXT_SUPABASE_SECRET_KEY` deve ser uma variável secreta disponível somente no servidor; as variáveis com prefixo `NUXT_PUBLIC_` são expostas ao navegador por definição.

Após alterar variáveis ou aplicar migrations, gere um novo deploy. O fluxo recomendado é:

```text
backup -> migrations do Supabase -> testes -> build -> deploy da Vercel -> teste de fumaça
```

No teste de fumaça, valide ao menos: login de gestão, criação/reparo de acesso de professor, login do professor, dashboard do professor, matrícula de aluno, área do aluno, frequência e baixa manual de cobrança.

## Segurança e papéis

Os papéis válidos são `gestao`, `professor` e `aluno`. O frontend direciona cada perfil à sua área, mas a autorização real é reforçada no servidor e no PostgreSQL por RLS, funções transacionais e views com exposição limitada de dados.

Consulte [`docs/arquitetura_seguranca.md`](docs/arquitetura_seguranca.md) para os detalhes de acesso, dashboards, chaves e operação segura.
