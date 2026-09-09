# Vídeo 134 — Exclusão completa sem deixar dados órfãos

## Gancho

Excluir somente o nome do aluno e deixar contratos, cobranças e presenças no banco cria um problema invisível que aparece depois.

## Desenvolvimento

A exclusão definitiva do aluno acontece em uma função protegida no banco. Somente a gestão pode executá-la e toda a operação ocorre na mesma transação.

Primeiro são removidos repasses, comissões, presenças, recibos, lançamentos financeiros, cobranças, contratos e vínculos com turmas. Depois o cadastro do aluno e, se existir, o acesso de autenticação são excluídos.

O cache da API do Supabase também é atualizado ao instalar a função, evitando o erro de função não encontrada logo após a implantação.

## Demonstração

1. Abra o menu de ações de um aluno de teste.
2. Escolha **Excluir definitivamente**.
3. Confirme o aviso de operação irreversível.
4. Mostre que o aluno desapareceu e que seus dados vinculados não ficaram órfãos.

## Fechamento

Uma exclusão segura não significa apenas apagar uma linha: significa remover todo o grafo daquele aluno sem afetar os demais.
