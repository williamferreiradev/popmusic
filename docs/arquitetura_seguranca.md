# Arquitetura de segurança — Pop Music

**Estado documentado:** setembro de 2026
**Aplicação:** Nuxt 4 + Supabase + Vercel

## 1. Princípio de segurança

O Pop Music trata dados pessoais, contratos, frequência e informações financeiras. A ocultação de telas e botões melhora a experiência, mas não é uma barreira de segurança. A autorização é aplicada em camadas:

1. Supabase Auth identifica o usuário.
2. A tabela `public.usuarios` guarda o papel e o estado ativo do perfil.
3. Row Level Security limita quais linhas cada papel pode acessar.
4. Views seguras reduzem as colunas expostas aos dashboards de professor e aluno.
5. Funções transacionais concentram operações com várias escritas relacionadas.
6. Rotas administrativas do Nuxt validam a sessão da gestão antes de usar a chave secreta no servidor.

As migrations que implementam essas regras estão em `supabase/migrations`. Não existem mais arquivos isolados `01_schema.sql`, `02_rls_policies.sql` ou `03_views_seguranca.sql` como fonte válida de instalação.

## 2. Papéis de usuário

| Papel | Escopo esperado |
|---|---|
| `gestao` | Administração operacional, cadastros, contratos, financeiro, relatórios e criação/reparo de acessos |
| `professor` | Próprias turmas, agenda, alunos vinculados, frequência e próprio repasse |
| `aluno` | Próprias aulas, frequência, cobranças e contrato |

O papel persistido usa o valor sem acento `gestao`. Comparações com `gestão` estão incorretas.

O vínculo de identidade segue esta cadeia:

```text
auth.users.id -> public.usuarios.id -> professores.usuario_id ou alunos.usuario_id
```

A migration `202609160045_acesso_usuarios_transacional.sql` é obrigatória para o fluxo atual. Ela protege o trigger, mantém perfis administrativos inativos até a validação, serializa reparos e grava perfil mais vínculo do professor na mesma transação PostgreSQL. A identidade no Auth é criada por uma API separada; por isso o serviço confirma o estado após timeouts e reutiliza com segurança uma conta parcial em nova tentativa, sem apagá-la automaticamente.

## 3. Chaves e variáveis de ambiente

| Variável | Onde pode ser usada | Finalidade |
|---|---|---|
| `NUXT_PUBLIC_SUPABASE_URL` | Navegador e servidor | URL do projeto Supabase |
| `NUXT_PUBLIC_SUPABASE_KEY` | Navegador e servidor | Chave publicável; o acesso continua limitado por RLS |
| `NUXT_SUPABASE_SECRET_KEY` | Somente servidor | Operações administrativas, como provisionar usuários |
| `NUXT_PUBLIC_APP_URL` | Navegador e servidor | URL canônica da aplicação e redirecionamentos |

Regras obrigatórias:

- Nunca prefixar a chave secreta com `NUXT_PUBLIC_`.
- Nunca gravar uma chave real em código, documentação, commit ou log.
- Nunca criar um cliente administrativo no frontend.
- Rotas que usam `NUXT_SUPABASE_SECRET_KEY` devem validar primeiro a sessão e o papel `gestao` do solicitante.
- A chave publicável não substitui RLS; todas as tabelas expostas pela API precisam de políticas adequadas.

## 4. Migrations e estado do banco

As migrations são versionadas em `supabase/migrations` e aplicadas em ordem lexicográfica. A mais recente e obrigatória neste estado do projeto é:

```text
202609160045_acesso_usuarios_transacional.sql
```

A Vercel publica o código Nuxt, mas **não aplica migrations no Supabase**. O operador deve aplicar as migrations pendentes antes do deploy correspondente e confirmar o resultado no banco.

Os arquivos abaixo são históricos e não devem ser executados:

- `03_seed.sql`: seed antigo, incompatível com identificadores e colunas do schema atual.
- `04_user_trigger.sql`: versão antiga do trigger de usuário, substituída pelas migrations de segurança e provisionamento.

Também não se deve seguir documentação antiga que manda executar `01_schema.sql`, `02_rls_policies.sql` e `03_views_seguranca.sql`: esses arquivos não existem no fluxo atual.

### Limitação conhecida: banco vazio

O repositório ainda não contém uma migration-base completa que construa o schema inteiro em um projeto Supabase vazio. As migrations disponíveis são incrementais e pressupõem o banco histórico já existente. Até uma baseline ser criada e testada, a instalação segura é suportada apenas sobre o projeto existente ou sobre um backup validado dele.

Essa dívida impede afirmar que `supabase db push` sozinho provisiona um ambiente novo do zero.

## 5. RLS, views e dashboards

### Gestão

O dashboard administrativo acessa os recursos operacionais permitidos ao papel `gestao`. Ações privilegiadas, como criar acesso de professor, passam por endpoints do servidor e validam explicitamente o usuário autenticado e seu papel ativo.

### Professor

O dashboard do professor está implementado e consulta views restritas:

- `vw_professor_agenda`: agenda e ocupação das próprias turmas.
- `vw_professor_alunos`: alunos vinculados às próprias turmas, sem expor o conjunto completo de dados administrativos.
- `vw_professor_meu_repasse`: valores do próprio professor.

A marcação de frequência permanece condicionada ao vínculo do professor com a turma e às regras de chamada aplicadas pelo banco.

### Aluno

A área do aluno está implementada sobre views restritas:

- `vw_aluno_meu_perfil`
- `vw_aluno_minhas_turmas`
- `vw_aluno_minha_frequencia`
- `vw_aluno_minhas_cobrancas`
- `vw_aluno_meu_contrato`

Cada view usa a identidade autenticada para limitar o resultado ao próprio aluno. Conceder `SELECT` a `authenticated` não torna os dados globais quando o filtro seguro da view e as políticas correspondentes estão corretos.

## 6. Operações sem sessão administrativa

Links públicos de contrato usam token e endpoints do servidor. O navegador não recebe a chave secreta e não consulta livremente as tabelas. O servidor valida token, validade, estado do contrato e campos aceitos antes de ler ou gravar.

Qualquer novo fluxo público deve seguir o mesmo padrão:

```text
navegador sem privilégio -> endpoint controlado -> validação -> cliente administrativo no servidor -> resposta mínima
```

Tokens devem ser imprevisíveis, expirar, ter uso limitado e nunca aparecer em logs desnecessários.

## 7. Auditoria e integridade

As migrations atuais incluem trilha automática de auditoria e restrições de integridade para operações sensíveis. Funções transacionais são preferidas quando uma ação altera várias entidades, por exemplo:

- matrícula, contrato e cobranças;
- baixa manual e repasse;
- criação do perfil, vínculo e reparo de acesso;
- cancelamento e exclusão definitiva.

Uma falha não deve produzir vínculos contraditórios. Como Auth e PostgreSQL não compartilham uma transação, uma identidade incompleta pode permanecer recuperável quando o estado remoto é incerto; a repetição da operação deve concluir o mesmo acesso, nunca criar outro ou excluir uma conta válida. O provisionamento deve ser testado verificando simultaneamente `auth.users`, `public.usuarios` e a coluna `usuario_id` do perfil correspondente.

## 8. Checklist operacional de produção

- [ ] Backup recente e restaurável do Supabase.
- [ ] Todas as migrations pendentes aplicadas em ordem, incluindo `202609160045`.
- [ ] RLS habilitado nas tabelas sensíveis e sem privilégios indevidos para `anon`.
- [ ] Views de professor e aluno usando segurança e filtros esperados.
- [ ] `NUXT_SUPABASE_SECRET_KEY` configurada somente no ambiente de servidor da Vercel.
- [ ] URL e chave publicável apontando para o mesmo projeto Supabase.
- [ ] `npm test`, `npm run typecheck`, `npm run lint` e `npm run build` aprovados.
- [ ] Login e redirecionamento testados para `gestao`, `professor` e `aluno`.
- [ ] Criação e reparo de acesso testados sem registros órfãos.
- [ ] Teste de leitura cruzada confirma que professor e aluno não veem dados de terceiros.
- [ ] Logs de produção não contêm senha temporária, token ou chave secreta.

## 9. Próxima melhoria estrutural

Criar uma migration-base única, revisada e reproduzível, que permita provisionar um projeto Supabase vazio. Depois disso, validar uma restauração completa em ambiente descartável e manter apenas seeds compatíveis, idempotentes e sem dados pessoais reais.
