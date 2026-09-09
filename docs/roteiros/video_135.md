# Vídeo 135 — Exclusão administrativa sem depender do cache de RPC

## Gancho

Uma função pode existir no código e ainda assim não estar disponível no catálogo da API do banco.

## Desenvolvimento

A exclusão definitiva do aluno deixou de depender diretamente de uma RPC carregada pelo PostgREST. Agora a tela envia a solicitação para uma rota administrativa protegida do próprio sistema.

O servidor valida a sessão e confirma que o usuário possui papel de gestão. Somente então usa a credencial privada para remover repasses, comissões, presenças, recibos, caixa, cobranças, contratos, matrículas, cadastro e acesso do aluno.

A operação também registra uma auditoria antes da remoção principal. Nenhuma chave administrativa é exposta ao navegador.

## Demonstração

1. Entre como gestão.
2. Abra as ações de um aluno de teste.
3. Confirme **Excluir definitivamente**.
4. Mostre a remoção do aluno mesmo sem a RPC aparecer no cache do Supabase.

## Fechamento

O fluxo deixa de depender de um detalhe do catálogo da API sem abrir mão da autenticação administrativa.
