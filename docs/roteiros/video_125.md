# Vídeo 125 — Acesso sem servidor de e-mail

## Gancho

“Dá para ativar o painel de um professor sem enviar nenhum e-mail?”

## Desenvolvimento

**Fala:** “Ao cadastrar o professor, o backend cria a identidade no Supabase Auth, registra o papel, vincula o professor e gera um link criptográfico de uso único.”

**Tela:** modal com o link e botão de cópia, ocultando o token durante a gravação.

**Fala:** “A gestão copia o acesso e envia pelo canal que já usa, como WhatsApp. Também pode invalidar o fluxo anterior gerando um link novo.”

## Fechamento

**Fala:** “Assim a escola não depende de SMTP para começar a operar, sem abrir mão da autenticação segura.”

## Cuidados na gravação

- Nunca exibir um link de ativação real.
- Explicar que o link deve ser enviado somente ao titular da conta.
