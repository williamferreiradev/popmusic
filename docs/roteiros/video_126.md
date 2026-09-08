# Vídeo 126 — Chave pública não cria usuários

## Gancho

“O administrador está logado, mas recebe 403 ao criar o acesso do professor. Por quê?”

## Desenvolvimento

**Fala:** “A aplicação pública usa uma chave publicável, mas operações administrativas do Auth exigem a chave secreta no servidor.”

**Tela:** nomes das variáveis na Vercel, sempre com os valores ocultos.

**Fala:** “Se a secret key estiver ausente ou incorreta, o painel funciona, porém a criação segura de usuários é recusada. O backend agora diferencia falta de permissão de falha na configuração.”

## Fechamento

**Fala:** “Chave pública no navegador; chave secreta apenas no backend.”

## Cuidados na gravação

- Nunca revelar o valor das chaves.
- Não colocar a chave secreta em variável com prefixo público.
