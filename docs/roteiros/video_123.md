# Vídeo 123 — Frontend novo e função antiga no Supabase

## Gancho

“Seu deploy funcionou, mas o Supabase diz que a função não existe. Como isso é possível?”

## Desenvolvimento

**Fala:** “A Vercel publica o frontend, mas não executa migrations no banco. O formulário começou a enviar a chave PIX enquanto a função remota ainda esperava os parâmetros antigos.”

**Tela:** migration de hotfix e mensagem de recarregamento do schema.

**Fala:** “Criamos uma atualização idempotente: ela preserva os professores, adiciona a coluna quando necessário, atualiza a função e manda o PostgREST recarregar o cache.”

## Fechamento

**Fala:** “Aplicação e banco precisam ser publicados como duas partes do mesmo release.”

## Cuidados na gravação

- Não exibir chaves ou tokens do Supabase.
- Não mostrar dados reais dos professores.
