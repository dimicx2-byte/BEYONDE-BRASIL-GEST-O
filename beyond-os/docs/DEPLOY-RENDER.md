# Deploy no Render

## Opção A — Blueprint (recomendado, provisiona o banco junto)

1. Crie um repositório no GitHub e suba o conteúdo desta pasta:
   ```bash
   git init && git add . && git commit -m "BEYOND OS"
   git branch -M main
   git remote add origin https://github.com/<seu-usuario>/beyond-os.git
   git push -u origin main
   ```
2. No Render: **New → Blueprint** → selecione o repositório. Ele lê o `render.yaml` e cria:
   - o **Web Service** `beyond-os`
   - o **PostgreSQL** `beyond-os-db` (com `DATABASE_URL` injetado)
3. Em **Environment**, defina o secret **`ADMIN_PASSWORD`** (senha forte do admin).
4. Confirme o deploy. O build roda:
   ```
   npm install && npm run build      # prisma generate + migrate deploy + seed
   npm start
   ```
5. Acesse a URL gerada. Login: `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

> O healthcheck usa `/api/health`.

## Opção B — Serviços separados (manual)

1. **New → PostgreSQL** → copie a *Internal Connection String*.
2. **New → Web Service** apontando ao repositório:
   - Build: `npm install && npm run build`
   - Start: `npm start`
   - Env: `DATABASE_URL`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `NODE_ENV=production`.

## Pós-deploy
- Faça login e **troque a senha do administrador** (menu do avatar → Segurança).
- Cadastre os demais usuários (módulo Usuários, exclusivo do admin).
- Configure as integrações Google Calendar e GOV.BR (ver `docs/API.md`).

## Notas
- Uploads ficam no disco efêmero por padrão. Para produção, configure um **Render Disk** persistente (defina `UPLOAD_DIR`) ou um bucket S3.
- Migrations: ao alterar `prisma/schema.prisma`, gere com `npx prisma migrate dev` localmente e faça commit da pasta `prisma/migrations` (o build usa `migrate deploy`).
