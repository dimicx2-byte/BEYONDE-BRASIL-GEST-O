# Deploy no Render

> Para um guia sem terminal e para leigos, veja `PUBLICAR-PASSO-A-PASSO.md` na raiz.

## Opção A — Blueprint (recomendado, provisiona o banco junto)

1. Suba este repositório no GitHub.
2. No Render: **New → Blueprint** → selecione o repositório (ele lê o `render.yaml`) e cria:
   - o **Web Service** `beyond-os`
   - o **PostgreSQL** `beyond-os-db` (com `DATABASE_URL` injetado)
3. Em **Environment**, defina o secret **`ADMIN_PASSWORD`** (senha forte do admin).
4. Confirme. O build roda:
   ```
   npm install && npm run build      # prisma generate + db push + seed
   npm start
   ```
5. Acesse a URL gerada. Login: `ADMIN_EMAIL` / `ADMIN_PASSWORD`. Healthcheck em `/api/health`.

## Opção B — Serviços separados (manual)

1. **New → PostgreSQL** → copie a *Internal Connection String*.
2. **New → Web Service** apontando ao repositório:
   - Build: `npm install && npm run build`
   - Start: `npm start`
   - Env: `DATABASE_URL`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `NODE_ENV=production`.

## Banco de dados

O build usa `prisma db push`, que cria/atualiza as tabelas a partir de `prisma/schema.prisma` automaticamente — não é preciso gerar arquivos de migração manualmente. Ao alterar o schema, basta novo `git push`: o Render reaplica no próximo deploy.

## Pós-deploy
- Faça login e **troque a senha do administrador** (menu do avatar → Segurança).
- Cadastre os demais usuários (módulo Usuários, exclusivo do admin).
- Configure as integrações Google Calendar e GOV.BR (ver `docs/API.md`).

## Notas
- Uploads ficam em disco efêmero por padrão. Para produção, configure um **Render Disk** persistente (defina `UPLOAD_DIR`) ou um bucket S3.
- Plano gratuito: o serviço "hiberna" após inatividade e leva alguns segundos para acordar no primeiro acesso.
