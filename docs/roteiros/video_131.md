# Vídeo 131 — Confirmação real no cadastro em massa

## Gancho

Uma tela não pode dizer que criou três turmas quando o banco registrou apenas uma.

## Desenvolvimento

O cadastro em massa agora apresenta os dias escolhidos antes da confirmação e o banco insere cada dia explicitamente dentro da mesma transação. A interface compara a quantidade solicitada com a quantidade realmente devolvida pelo Supabase.

Se qualquer dia falhar, toda a transação é desfeita. Se a resposta não tiver exatamente a quantidade pedida, o sistema mostra erro em vez de um sucesso enganoso.

## Demonstração

1. Selecione segunda, terça e quarta.
2. Confira o resumo com os três dias.
3. Clique em **Criar 3 turmas**.
4. Mostre as três linhas criadas com o mesmo horário.

## Fechamento

Agora o que aparece como sucesso na tela corresponde exatamente ao que foi gravado no banco.
