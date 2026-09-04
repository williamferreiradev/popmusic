# ARQUIVO HISTÓRICO — use `serie_build_in_public_reverso.md`

# 🎬 ROTEIRO MAGNÉTICO — VÍDEO 04 (35 Segundos)
> **Tema:** A Modelagem do Banco de Dados no PostgreSQL (Supabase) & Segurança RLS  
> **Objetivo:** Mostrar autoridade em arquitetura de dados e integridade relacional.  
> **Formato:** Vertical 9:16  
> **Duração Alvo:** 30 a 35 segundos  

---

## 🧠 Psicologia & Gatilhos Mentais
- **Autoridade de Backend:** Provar que você sabe estruturar banco relacional sem gambiarras.
- **Segurança Real:** Explicar Row Level Security (RLS) de forma simples para leigos e devs.

---

## ⏱️ Roteiro Segundo a Segundo (Timeline 00:00 - 00:35)

```
[00:00 - 00:04] GANCHO
```
- **O que você fala:**  
  *"Se você errar a modelagem do banco de dados, seu sistema quebra na primeira semana de uso real. Dia 4."*
- **O que você mostra na tela:**  
  - Tabela do Supabase no navegador com o Table Editor aberto e as relações entre as tabelas.
- **Legenda:**  
  **"Como NÃO quebrar o banco de dados 💥 (Dia 4)"**

---

```
[00:04 - 00:15] A ESTRUTURA DAS TABELAS
```
- **O que você fala:**  
  *"Pra escola de música do meu amigo, separei tudo em entidades claras: Alunos, Turmas com limite de vagas, Contratos vinculados por token criptográfico e a tabela de Cobranças."*
- **O que você mostra na tela:**  
  - Zoom nas tabelas `alunos`, `turmas`, `contratos`, `cobrancas` e `presencas` no Supabase.
- **Legenda:**  
  *"PostgreSQL Relacional: Chaves Estrangeiras + Índices 🗄️"*

---

```
[00:15 - 00:25] A SEGURANÇA COM RLS (ROW LEVEL SECURITY)
```
- **O que você fala:**  
  *"E pra garantir que nenhum aluno consiga ver dados financeiros de outros alunos, ativei políticas de RLS direto no PostgreSQL. A segurança fica no nível do banco, e não apenas no frontend."*
- **O que você mostra na tela:**  
  - Código SQL das políticas RLS no VS Code (`07_politicas_publicas_contratos.sql`).

---

```
[00:25 - 00:35] CTA DE RETENÇÃO
```
- **O que você fala:**  
  *"No próximo vídeo vou te mostrar a função mais insana desse projeto: o contrato digital com biometria facial ao vivo. Segue pra não perder!"*
- **O que você mostra na tela:**  
  - Flash rápido da tela de captura da WebCam com o círculo de biometria.
- **Legenda:**  
  **"Amanhã: Contrato com Biometria Facial ao Vivo! 📸"**
