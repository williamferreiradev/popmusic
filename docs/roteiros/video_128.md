# Vídeo 128 — O 403 causado por `id` versus `sub`

## Gancho

“O usuário é gestão no banco, está ativo e mesmo assim recebe 403.”

## Desenvolvimento

**Fala:** “A sessão completa identifica o usuário em `id`, enquanto os claims validados podem trazer o mesmo UUID em `sub`. O backend consultava somente uma das formas.”

**Tela:** comparação conceitual entre os dois formatos, usando UUIDs fictícios.

**Fala:** “Normalizamos o identificador validado antes de consultar o perfil. Assim, cookie SSR e token explícito autorizam exatamente a mesma conta.”

## Fechamento

**Fala:** “Autenticação correta também exige normalizar a estrutura das credenciais.”

## Cuidados na gravação

- Usar identificadores fictícios.
- Não mostrar cookies ou tokens reais.
