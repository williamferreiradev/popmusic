# Vídeo 129 — Autorização consistente entre dashboard e API

## Gancho

“Por que o dashboard aceita a gestão enquanto o endpoint administrativo nega?”

## Desenvolvimento

**Fala:** “As duas partes consultavam o perfil em contextos diferentes. A interface usava a sessão e suas políticas RLS; a API usava o cliente administrativo.”

**Tela:** fluxo conceitual sessão → perfil → papel, sem exibir tokens.

**Fala:** “Unificamos a autorização no contexto da sessão validada. A chave secreta agora fica responsável apenas pela operação privilegiada de criar o usuário.”

## Fechamento

**Fala:** “A mesma identidade precisa produzir a mesma decisão de acesso em toda a aplicação.”

## Cuidados na gravação

- Não mostrar tokens ou chaves.
- Usar usuários fictícios na demonstração.
