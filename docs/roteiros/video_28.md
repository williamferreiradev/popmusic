# Vídeo 28 — Convite de professor sem criar usuário órfão

> Série: Build in Public Reverso — Sistema Pop Music
> Formato: Instagram Reels / TikTok / YouTube Shorts
> Duração sugerida: 30–50 segundos

**Gancho:** “E se o login for criado, mas o perfil falhar?”

**Fala:** “O endpoint cria o acesso e tenta vincular ao professor. Se o vínculo falha, executa compensação e remove o usuário de autenticação recém-criado. Não é uma transação única entre sistemas, então implementei rollback lógico.”

**Tela:** endpoint de convite e bloco de compensação. **CTA:** “Falha parcial também precisa de projeto.”

