[README.md](https://github.com/user-attachments/files/29147496/README.md)
# BEYOND OS

Sistema operacional de gestão centralizada da **BEYOND Hospitality** — 15 módulos em um só ambiente: Console, Dashboard (BI), Gestão de Projetos, Funil de Vendas, CRM B2C, Expansão B2B, Tickets/Chamados, Gestão Financeira, Marketing (repositório de artes), Comunicados, Universidade BEYOND, Agenda (Google), Contratos (assinatura GOV.BR), Gestão de Crise e Usuários — além de Chat flutuante.

Identidade de luxo (preto/off-white/dourado champanhe), controle de acesso por papéis (RBAC) e API com PostgreSQL.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Backend | Node.js + Express (ESM) |
| Banco | PostgreSQL + Prisma ORM |
| Auth | JWT + bcrypt (hash de senha) |
| Uploads | Multer (anexos, artes, fotos) |
| Frontend | App single-page (`public/index.html`) servido pelo backend |
| Deploy | Render (Blueprint `render.yaml`) |

> O frontend incluso (`public/index.html`) é o app completo da interface. Os endpoints REST já existem para conectar cada módulo ao banco — veja `docs/API.md` para o contrato e o ponto de integração.

---

## Rodando localmente

Pré-requisitos: Node 18+ e PostgreSQL.

```bash
git clone <seu-repo> beyond-os && cd beyond-os
cp .env.example .env          # edite DATABASE_URL, JWT_SECRET e ADMIN_PASSWORD
npm install
npm run prisma:push           # cria as tabelas
npm run seed                  # cria o administrador
npm start                     # http://localhost:3000
```

Login inicial: o e-mail/senha definidos em `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

---

## Deploy no Render (1 clique via Blueprint)

1. Suba este repositório no GitHub.
2. No Render: **New → Blueprint** e aponte para o repositório (ele lê o `render.yaml`).
3. Defina o secret **`ADMIN_PASSWORD`** no painel do serviço.
4. O Render provisiona o PostgreSQL, roda `npm run build` (migrations + seed) e sobe o app.

Detalhes em `docs/DEPLOY-RENDER.md`.

---

## Papéis e acesso (RBAC)

| Categoria | Módulos | Gestão Financeira | Usuários |
|---|---|---|---|
| Admin | Completo | ✓ | ✓ |
| Sócios | Completo | ✓ | ✗ |
| Diretoria | Completo | ✗ | ✗ |
| Diretoria Financeira | Completo | ✓ | ✗ |
| Equipe Brasil | Completo | ✗ | ✗ |

Em **Tickets**, cada usuário vê apenas chamados em que é responsável ou apoio. Em **Contratos**, há funil de aprovação por alçada conforme o valor antes da assinatura GOV.BR.

---

## Documentação

- `docs/ARQUITETURA.md` — visão técnica e modelo de dados
- `docs/API.md` — referência dos endpoints
- `docs/DEPLOY-RENDER.md` — passo a passo de publicação

## Segurança

Senhas com hash **bcrypt** (custo 12), JWT com expiração, RBAC por papel. Em produção, habilite 2FA e troque a senha do admin no primeiro acesso. Integrações Google Calendar e GOV.BR exigem credenciais próprias (ver `docs/API.md`).

---

© 2026 BEYOND Hospitality Group. Software proprietário — ver `LICENSE`.
