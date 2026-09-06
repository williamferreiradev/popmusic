# Vídeo 108 — Como testar um sistema escolar do início ao fim

## Gancho

“Ter 102 testes automatizados não significa que o produto está homologado.”

## Desenvolvimento

**Tela:** plano de teste dividido por papéis e fluxos.

**Fala:** “Automação protege contratos técnicos, mas a entrega precisa simular a operação da escola. Organizei o teste na mesma ordem do trabalho real: configuração, professor, turma, matrícula, assinatura, cobrança, recibo, repasse e chamada.”

**Tela:** destacar o fluxo do aluno maior, menor e assinatura pelo celular.

**Fala:** “Cada fluxo tem resultado esperado e também um cenário de erro: responsável ausente, turma cheia, câmera negada, contrato usado, clique duplicado e perda de internet.”

**Tela:** mostrar a troca de usuários entre administrador, professor e aluno.

**Fala:** “A homologação também verifica isolamento. O administrador não entra no portal pessoal, o professor vê somente suas turmas e o aluno jamais acessa dados de outra pessoa.”

## Fechamento

**Fala:** “Software só está pronto quando o fluxo completo funciona nas mãos de quem vai usar.”

**CTA:** “Você testa somente o caminho feliz ou também tenta quebrar o sistema?”

## Cuidados na gravação

- Usar exclusivamente dados fictícios de homologação.
- Borrar e-mails, telefones, CPF, tokens, fotos e valores.
- Não mostrar senhas, variáveis da Vercel ou chaves do Supabase.
