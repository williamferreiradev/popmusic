# Vídeo 95 — A coluna `mt.status` que não existia

> Série: Build in Public Reverso — Sistema Pop Music
> Formato: Instagram Reels / TikTok / YouTube Shorts
> Duração sugerida: 30–50 segundos

**Gancho:** “Uma query inteira caiu por assumir uma coluna que o modelo nunca teve.”

**Fala:** “Matrícula ativa era representada por `data_fim is null`, não por `status='ativa'`. Corrigi a SQL para falar a linguagem real do schema. Nome intuitivo não substitui inspeção do banco.”

**Tela:** erro 42703 → schema → condição correta. **CTA:** “Nunca escreva migration por memória.”

