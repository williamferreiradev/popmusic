# Vídeo 138 — Conta pronta com senha temporária segura

## Gancho

O professor precisa conseguir entrar mesmo quando a escola não possui domínio nem servidor de e-mail.

## Desenvolvimento

Ao cadastrar o professor, a gestão agora cria simultaneamente a identidade no Supabase Auth, o perfil com papel de professor e o vínculo entre os dois registros.

O primeiro acesso utiliza a senha temporária `PopMusic1234@`. O sistema marca essa identidade como temporária e impede o acesso ao dashboard até que o professor escolha uma senha pessoal.

A tela da gestão mostra o login, a senha temporária e o endereço do sistema em um único bloco que pode ser copiado e enviado pelo WhatsApp.

## Demonstração

1. Cadastre um professor pela gestão.
2. Copie as credenciais exibidas.
3. Entre com a senha temporária.
4. Mostre o redirecionamento obrigatório para troca de senha.
5. Defina a senha pessoal e abra o painel do professor.

## Fechamento

O acesso nasce pronto para uso, mas a senha compartilhada nunca continua válida depois do primeiro login.
