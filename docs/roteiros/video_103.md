# Vídeo 103 — Salvar contrato sem perder a versão anterior

## Gancho

“O sistema dizia que salvou o contrato até quando o banco dava erro.”

## Desenvolvimento

**Tela:** editor do modelo de contrato e botão Salvar modelo.

**Fala:** “Antes, a tela disparava duas operações separadas: desativava o modelo atual e tentava inserir o novo. Além disso, mostrava sucesso sem aguardar o Supabase. Uma falha no meio podia deixar a escola sem modelo ativo.”

**Tela:** mostrar a função SQL `salvar_modelo_contrato` e destacar a transação, validação e bloqueio para gestão.

**Fala:** “Agora uma função transacional valida o tamanho do documento, bloqueia gravações concorrentes, cria a próxima versão e só então desativa as anteriores. Se qualquer etapa falhar, o banco desfaz tudo.”

**Tela:** clicar em salvar e mostrar o estado “Salvando...” e a mensagem final dentro da página.

**Fala:** “O botão evita cliques repetidos e a interface só confirma depois da resposta real do banco. Também removi controles de formatação que pareciam funcionar, mas não alteravam o texto.”

## Fechamento

**Fala:** “Em documentos jurídicos, histórico e confirmação real não são detalhes.”

**CTA:** “Quer ver como o contrato preenchido fica congelado depois da assinatura?”

## Cuidados na gravação

- Usar um texto de homologação, nunca o contrato ou os dados pessoais reais.
- Não mostrar tokens, CPF, assinatura ou fotografia.
- Informar que o texto jurídico ainda precisa de aprovação da responsável e de orientação profissional.
