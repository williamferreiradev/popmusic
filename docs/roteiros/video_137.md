# Vídeo 137 — Criando acesso sem servidor de e-mail

## Gancho

Como entregar acesso seguro a um professor sem contratar domínio ou configurar SMTP?

## Desenvolvimento

A gestão cria o professor e o backend valida o token da sessão antes de consultar o papel `gestao`. Depois, o Supabase cria a identidade e devolve um link seguro para definir a senha, que pode ser copiado e enviado pelo WhatsApp.

Se o e-mail já existir no Auth, o fluxo não trava: a conta é reaproveitada, vinculada ao cadastro do professor e recebe um novo link de recuperação. A chave administrativa continua somente no servidor.

## Demonstração

1. Entre como gestão e cadastre um professor com e-mail.
2. Copie o link exibido pelo sistema.
3. Abra o link em uma janela anônima e defina a senha.
4. Faça login e mostre o redirecionamento para o painel do professor.

## Fechamento

Sem SMTP e sem senha improvisada: a gestão cria o acesso e o professor escolhe a própria senha com um link temporário.
