# Vídeo 121 — O bug de layout duplicado no Nuxt

## Gancho

“Como uma única linha de configuração duplicou todo o menu lateral?”

## Desenvolvimento

**Tela:** página de Turmas com duas sidebars.

**Fala:** “A rota filha Turmas aplicava explicitamente o layout dashboard, mas a rota pai já fazia isso. O Nuxt montava o mesmo layout duas vezes.”

**Tela:** comparar os arquivos de Turmas e Modalidades.

**Fala:** “Removemos a segunda definição e padronizamos o wrapper com o de Modalidades. Agora existe uma sidebar e o conteúdo ocupa toda a área restante.”

## Fechamento

**Fala:** “Em rotas aninhadas, herdar o layout corretamente evita interface duplicada e espaço desperdiçado.”

## Cuidados na gravação

- Não mostrar dados sensíveis.
- Comparar as duas páginas na mesma resolução.
