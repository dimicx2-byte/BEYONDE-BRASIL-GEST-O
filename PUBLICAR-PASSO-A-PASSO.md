# Como publicar o BEYOND OS no GitHub e no Render (passo a passo para leigos)

Você só precisa fazer isto **uma vez**. Depois, toda atualização é automática.
Tempo estimado: ~15 minutos. Não precisa saber programar.

---

## Parte 1 — Colocar o código no GitHub (com o GitHub Desktop)

O GitHub Desktop é um programa com botões — não precisa de terminal.

1. **Crie uma conta** em https://github.com (se ainda não tiver). É grátis.
2. **Baixe e instale** o GitHub Desktop: https://desktop.github.com
3. Abra o GitHub Desktop e **faça login** com sua conta GitHub.
4. No menu, clique em **File → Add Local Repository**.
5. Em "Local path", clique em **Choose...** e selecione a pasta:
   `Documentos → beyond-os` (ou seja, `~/Documents/beyond-os`).
6. Vai aparecer um aviso de que a pasta "não é um repositório Git".
   - Clique no link **"create a repository"** (criar um repositório).
   - Em "Name" deixe `beyond-os`. Clique em **Create Repository**.
   > (Se eu já tiver rodado o `git init` para você, este passo aparece diferente: ele já reconhece a pasta — pode pular para o item 7.)
7. No canto inferior esquerdo, escreva uma mensagem em "Summary", ex.: `versão inicial`.
   Clique no botão azul **Commit to main**.
8. No topo, clique em **Publish repository**.
   - Escolha se quer **Private** (privado, recomendado) ou público.
   - Clique em **Publish repository**.

✅ Pronto. Seu código está no GitHub.

> **Atualizar no futuro:** sempre que eu mexer nos arquivos, abra o GitHub Desktop,
> escreva um resumo, clique **Commit to main** e depois **Push origin**. Só isso.

---

## Parte 2 — Publicar online no Render

O Render hospeda o sistema e cria o banco de dados automaticamente.

1. **Crie uma conta** em https://render.com e clique em **"Get Started"** →
   escolha **"Sign in with GitHub"** (entrar com o GitHub) e autorize.
2. No painel do Render, clique em **New +** (canto superior direito) → **Blueprint**.
3. Selecione o repositório **beyond-os** na lista e clique em **Connect**.
   - O Render lê o arquivo `render.yaml` e já monta tudo: o site + o banco PostgreSQL.
4. Ele vai pedir para preencher uma variável secreta:
   - **`ADMIN_PASSWORD`** → digite a senha que você quer usar para entrar no sistema
     (a senha do administrador `dimicx2@gmail.com`). Use uma senha forte.
5. Clique em **Apply** (ou **Create**). Aguarde o build (uns 2–4 minutos).
6. Quando aparecer **"Live"**, clique na URL gerada (algo como
   `https://beyond-os.onrender.com`). É o seu sistema no ar!

**Login:** e-mail `dimicx2@gmail.com` e a senha que você definiu no passo 4.

> **Atualizar no futuro:** depois que você der "Push" no GitHub Desktop (Parte 1),
> o Render atualiza o site sozinho em poucos minutos. Não precisa fazer mais nada.

---

## Dicas e problemas comuns

- **A página não atualizou?** Pressione `Cmd + Shift + R` (Mac) para recarregar sem cache.
- **Esqueci a senha do admin:** no Render, abra o serviço → **Environment** → mude
  `ADMIN_PASSWORD` → **Save** (faça um novo deploy). O sistema regrava o admin no próximo build.
- **Plano gratuito do Render:** o site "dorme" após um tempo sem uso e demora alguns
  segundos para acordar no primeiro acesso. Para uso real, considere o plano pago (Starter).
- **Onde ficam meus dados:** no banco PostgreSQL do Render. Os cadastros feitos pela
  interface ficam salvos lá (diferente do protótipo local, que era só na memória).

---

## Resumo de bolso

| Quero... | Faço assim |
|---|---|
| Subir o código | GitHub Desktop → Commit → Push |
| Publicar online | Render → New → Blueprint → escolher o repo |
| Atualizar tudo | GitHub Desktop → Commit → Push (o Render atualiza sozinho) |
| Entrar no sistema | URL do Render → e-mail + senha do admin |
