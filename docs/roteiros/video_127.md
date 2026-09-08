# Vídeo 127 — Corrigindo sessão divergente em endpoint administrativo

## Gancho

“O painel reconhece o administrador, mas a API responde 403. Como as duas coisas podem acontecer?”

## Desenvolvimento

**Fala:** “O navegador conhecia a sessão, mas o endpoint dependia exclusivamente do cookie SSR, que podia estar ausente ou desatualizado.”

**Tela:** requisição com o cabeçalho de autorização ocultado.

**Fala:** “Passamos a enviar o token explicitamente. No servidor, o Supabase valida esse token antes de consultar o papel de gestão e executar a ação privilegiada.”

## Fechamento

**Fala:** “O token nunca é confiado diretamente: ele sempre é validado pelo provedor de autenticação.”

## Cuidados na gravação

- Ocultar completamente o cabeçalho Authorization.
- Nunca copiar tokens reais para exemplos.
