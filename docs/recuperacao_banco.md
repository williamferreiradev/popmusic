# Recuperação do banco — 29/10/2026

## O que foi comprovado

Foi gerada uma baseline sem dados pessoais em `supabase/baseline/20261029_schema.sql`, com estrutura atual e correções 048/049. Ela exige um projeto Supabase novo, com Auth e Storage já instalados; recusa um schema público ocupado. Não reaplicar migrations históricas anteriores à baseline sobre ela.

O teste automatizado recria a estrutura, verifica políticas, chaves estrangeiras, relatórios e exclusão transacional. Há também ensaio de cópia e recuperação de um banco PostgreSQL local descartável.

Sem conhecer ou redefinir a senha PostgreSQL do cliente, foi feito um backup lógico pelo SQL Editor já autenticado, usando exportador temporário restrito à chave de serviço. Após a cópia, as funções temporárias foram removidas do projeto.

O backup real foi restaurado em PostgreSQL local descartável (PGlite): 60 tabelas, 204 registros e 3 arquivos. Foram conferidos contagens, hashes das senhas do Auth, integridade referencial, bloqueio de leitura anônima e hashes dos arquivos copiados. O resultado privado está em `ensaio-resultado.json`, dentro da pasta do backup.

**Ainda não foi homologada restauração em outro projeto Supabase**, nem login usando o serviço Auth do destino, acesso aos arquivos pelo serviço Storage ou configurações externas. A cópia local dos arquivos comprova conteúdo recuperável, sem validar o serviço de armazenamento do destino.

## Onde fica a cópia

`.data/ultimo-backup-studio.txt` aponta para a pasta privada. Ela contém `database.json`, `schema.sql`, `manifest.json`, arquivos do Storage e resultado do ensaio. `.data` está ignorada pelo Git. O backup contém dados pessoais e material sensível do Auth; nunca anexar em issue, commit ou servidor de preview. A pasta está dentro do workspace no OneDrive: providenciar uma cópia protegida e independente, com retenção definida pelo responsável do cliente.

## Repetir o backup sem senha PostgreSQL

1. No SQL Editor do projeto de origem, executar `supabase/manual/exportar_backup_recuperacao.sql`. O acesso à exportação é exclusivo de `service_role`; não conceder a `anon` ou `authenticated`.
2. Com as variáveis Supabase de servidor já configuradas no `.env`, executar `node --env-file=.env scripts/backup-via-studio.mjs`. O manifesto só recebe `complete: true` após copiar banco e arquivos.
3. Remover imediatamente a função temporária: `drop function if exists public.exportar_backup_recuperacao(); notify pgrst, 'reload schema';`. Remover também `exportar_estrutura_recuperacao()` se criada para atualizar a baseline.
4. Executar `node scripts/testar-backup-logico.mjs CAMINHO_DA_PASTA`. Omitir o argumento usa o último backup. O ensaio escreve SQL privado e confere checksums antes de restaurar em uma instância descartável.

Fazer a exportação em janela sem gravações: cada consulta e download ocorre separadamente, portanto não há snapshot único cobrindo banco e arquivos. O backup não inclui configurações do painel, provedores OAuth, SMTP, funções Edge, segredos externos, logs do provedor ou objetos de serviços fora dos schemas exportados. Conferir essas configurações separadamente.

## Recuperação em outro Supabase

Usar somente projeto novo e isolado. Aplicar a baseline, conferir compatibilidade das versões de Auth/Storage e revisar o SQL lógico privado gerado pelo ensaio. Esse SQL verifica tipos de colunas e tabelas vazias e deve ser executado integralmente em transação. Nunca executá-lo no projeto original. Restaurar os arquivos por API do Storage e conferir SHA-256; não basta restaurar seus metadados SQL.

O caminho alternativo com `scripts/backup-database.mjs` e `scripts/restore-database.mjs` requer ferramentas PostgreSQL e conexão direta ou session pooler (porta 5432), configurada privadamente. Ele usa o formato `data.dump`, diferente do backup JSON do Studio, e ainda não foi executado neste ambiente. A restauração exige referência explícita de outro projeto, destino vazio e credenciais próprias do Storage. Não usar transaction pooler na porta 6543.

Antes de apontar a aplicação ao destino, homologar login de gestor/professor, renovação de sessão, políticas entre usuários, fotos, matrícula, contratos, mensalidade, repasse e estorno. Conferir SMTP, URLs permitidas, chaves do aplicativo e funções Edge. Manter a origem preservada até concluir a validação.
