# Vídeo 107 — Publicando a versão de homologação na Vercel

## Gancho

“Código aprovado localmente não significa que o sistema está acessível na internet.”

## Desenvolvimento

**Tela:** histórico do Git com o commit mais recente e implantação da Vercel.

**Fala:** “Depois de validar 102 testes, tipos e lint, enviei a versão para a branch principal do GitHub. Como a Vercel está conectada ao repositório, cada push dispara uma nova implantação automaticamente.”

**Tela:** acessar `https://popmusic-beige.vercel.app/` e mostrar o redirecionamento para o login.

**Fala:** “A verificação pública retornou o redirecionamento esperado para `/login`, usando HTTPS, HSTS, proteção contra iframe e política restrita para câmera e microfone. Isso confirma que a aplicação está online e pronta para homologação.”

**Tela:** mostrar rapidamente o checklist de testes manuais.

**Fala:** “Publicar não encerra a entrega. Agora entram os testes com contas reais: matrícula, assinatura pelo celular, cobrança manual, recibo, repasse e chamada do professor.”

## Fechamento

**Fala:** “Deploy é o começo da validação em produção, não o fim do desenvolvimento.”

**CTA:** “Qual fluxo você testaria primeiro em um sistema de escola?”

## Cuidados na gravação

- Não mostrar variáveis da Vercel, chaves do Supabase ou credenciais.
- Borrar nomes de contas, e-mails e identificadores privados da implantação.
- Chamar esta versão de homologação até os fluxos reais serem aprovados.
