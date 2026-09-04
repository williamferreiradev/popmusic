# Guia de produção e publicação — série Pop Music

## Objetivo

Transformar o desenvolvimento já realizado em autoridade técnica, prova de capacidade e conteúdo educativo. A narrativa central é: “Uma operação baseada em cadernos virou um sistema integrado, e aqui estão as decisões reais, inclusive os erros.”

## Ordem de publicação

Publique os episódios 1–10 primeiro para estabelecer contexto. Depois, alterne blocos técnicos e visuais:

| Semana | Episódios | Tema dominante |
|---|---:|---|
| 1 | 01–07 | problema, escopo e produto |
| 2 | 08–14 | processo, modelagem e transação |
| 3 | 15–21 | concorrência, integridade e acesso |
| 4 | 22–28 | autenticação, RLS e convites |
| 5 | 29–35 | privacidade e matrícula |
| 6 | 36–42 | comunicação, ciclo do aluno e token |
| 7 | 43–49 | captura facial e documento imutável |
| 8 | 50–56 | idempotência e financeiro manual |
| 9 | 57–63 | métricas, performance e configuração |
| 10 | 64–70 | e-mails, professor e chamada |
| 11 | 71–77 | fechamento e repasses |
| 12 | 78–84 | isolamento, catálogos e agenda |
| 13 | 85–91 | experiência, portais e deploy |
| 14 | 92–98 | segredos, SQL e qualidade |
| 15 | 99–100 | auditoria, entrega e roadmap |

Ritmo recomendado: um vídeo por dia. Para acelerar, publique dois em dias alternados: um de negócio às 12h e um técnico às 19h.

## Gravação em lote

1. Prepare dados fictícios consistentes: Ana (aluna), Carlos (responsável), João (professor), Teclado, Sala 1 e Segunda 14h.
2. Grave dez episódios por sessão, primeiro todas as falas e depois os screencasts.
3. Reaproveite planos de login, sidebar, matrícula, contrato, agenda, chamada, financeiro, Supabase, migrations, testes e deploy.
4. Cubra cortes com screencast e zoom. Nunca deixe código pequeno ocupando a tela inteira.

## Estrutura visual

- 0–2s: gancho escrito em até oito palavras.
- 2–7s: rosto e contexto da dor.
- 7–25s: uma transformação na tela.
- 25–38s: por que a decisão foi tomada.
- 38–45s: resultado e CTA.

Se o assunto couber em 30 segundos, termine antes. Retenção vale mais que preencher duração.

## Padrão de edição

- 1080 × 1920, 30 fps; legenda em até duas linhas.
- Destaque palavras principais em verde ou amarelo.
- Mantenha texto longe dos 250 px inferiores.
- Use música instrumental baixa e mudança visual a cada 2–4 segundos.
- Capa com consequência: “79 FALHAS?”, “24 COBRANÇAS?”, “A ÚLTIMA VAGA”.

## Fórmulas de legenda

**Negócio:** “Essa escola controlava [processo] no papel. O problema real era [causa]. Construí [solução] para gerar [resultado]. Qual etapa você automatizaria? #buildinpublic #automacao #software”

**Técnica:** “O bug: [problema]. A causa: [causa]. A correção: [decisão]. A proteção: [teste/regra]. Código bom transforma falha em aprendizado verificável. #programacao #nuxt #supabase #postgresql”

**Antes e depois:** “Antes: [processo manual]. Depois: [fluxo]. O ganho principal foi [tempo, segurança ou consistência].”

## Checklist antes de publicar

- [ ] O vídeo ensina apenas uma ideia e entrega exatamente o gancho?
- [ ] CPF, e-mail, telefone, token, senha e chaves estão borrados?
- [ ] Foi dito “captura facial como evidência”, sem alegar biometria?
- [ ] Pagamento foi descrito como manual?
- [ ] Nenhuma confirmação de WhatsApp automático foi mostrada?
- [ ] O resultado exibido existe no produto atual?
- [ ] A capa está legível e o CTA não repete o vídeo anterior?

## Conteúdos que devem esperar

Grave somente depois de implementados e homologados: Assistente OpenAI, áudio, WhatsApp automático, PIX automático, QR Code e reposição avançada. Hoje eles podem aparecer apenas como roadmap.

## Arquivos oficiais

- Roteiros: `docs/roteiros/serie_build_in_public_reverso.md`.
- Produção: `docs/roteiros/guia_de_producao_e_publicacao.md`.
- Evidência: checklist mestre, migrations e histórico do Git.
