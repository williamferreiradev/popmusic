# Vídeo 104 — Reenvio de recibo sem fingir WhatsApp

## Gancho

“Este botão dizia que abriu o WhatsApp, mas não abria absolutamente nada.”

## Desenvolvimento

**Tela:** lista de recibos e modal de reenvio.

**Fala:** “O recibo por e-mail já possui endpoint, valida o usuário, busca o pagamento no banco e registra o resultado do provedor. Porém, o segundo botão apenas fechava o modal e mostrava uma mensagem de WhatsApp aberto.”

**Tela:** mostrar o modal atualizado com a única opção ‘Reenviar por e-mail’.

**Fala:** “Retirei o canal falso. Durante o envio, o botão fica bloqueado e mostra o progresso. O modal só fecha depois que o servidor confirma o envio.”

**Tela:** demonstrar uma falha controlada e a mensagem preservando o modal.

**Fala:** “Se o e-mail estiver inválido ou o provedor falhar, a tela mantém o contexto e mostra o erro real. O envio manual pelo WhatsApp continua disponível na visualização do recibo, onde ele realmente abre o aplicativo com a mensagem pronta.”

## Fechamento

**Fala:** “Integração confiável começa quando a interface para de prometer o que não aconteceu.”

**CTA:** “Você prefere menos botões funcionando ou mais botões de enfeite?”

## Cuidados na gravação

- Borrar nome, telefone, e-mail, valor e número do recibo.
- Não mostrar a chave do Resend nem variáveis da Vercel.
- Explicar que o WhatsApp deste fluxo é manual, não automático.
