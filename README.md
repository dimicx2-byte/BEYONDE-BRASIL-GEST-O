# BEYOND OS

Sistema operacional de gestão centralizada da **BEYOND Hospitality** — 16 módulos em um só ambiente: Console, Dashboard (BI), Gestão de Projetos, Funil de Vendas, CRM B2C, Expansão B2B, Tickets/Chamados, Gestão Financeira, Marketing (repositório de artes), Comunicados, Universidade BEYOND, Agenda (Google), Contratos (assinatura GOV.BR), Gestão de Crise, **Reembolso & Viagens** e Usuários — além de Chat flutuante.

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

> O frontend incluso (`public/index.html`) é o app completo da interface. Os endpoints REST já existem para conectar cada módulo ao banco — veja `docs/API.md`.

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

## Publicar (passo a passo para leigos)

Veja **`PUBLICAR-PASSO-A-PASSO.md`** — guia com GitHub Desktop + Render, sem terminal.
Resumo: suba a pasta no GitHub → no Render use **New → Blueprint** apontando ao repositório → defina o secret `ADMIN_PASSWORD`. O Render provisiona o PostgreSQL, roda o build (`npm run build`) e publica.

---

## Papéis e acesso (RBAC)

| Categoria | Módulos | Gestão Financeira | Usuários |
|---|---|---|---|
| Admin | Completo | ✓ | ✓ |
| Sócios | Completo | ✓ | ✗ |
| Diretoria | Completo | ✗ | ✗ |
| Diretoria Financeira | Completo | ✓ | ✗ |
| Equipe Brasil | Completo | ✗ | ✗ |

- **Tickets**: cada usuário vê apenas chamados em que é responsável ou apoio.
- **Contratos**: aprovação por alçada conforme o valor antes da assinatura GOV.BR.
- **Reembolso & Viagens**: aprovação por alçada (≤ R$ 2 mil → Diretoria; ≤ R$ 10 mil → + Diretoria Financeira; > R$ 10 mil → Diretoria Financeira → Sócios); reembolso liberado só para Diretoria Financeira/Admin.

---

## Documentação

- `PUBLICAR-PASSO-A-PASSO.md` — como subir no GitHub e Render (leigo)
- `CHANGELOG.md` — histórico de versões
- `docs/ARQUITETURA.md` — visão técnica e modelo de dados
- `docs/API.md` — referência dos endpoints
- `docs/DEPLOY-RENDER.md` — detalhes de publicação

## Segurança

Senhas com hash **bcrypt** (custo 12), JWT com expiração, RBAC por papel. Em produção, habilite 2FA e troque a senha do admin no primeiro acesso. Integrações Google Calendar e GOV.BR exigem credenciais próprias (ver `docs/API.md`).

---

© 2026 BEYOND Hospitality Group. Software proprietário — ver `LICENSE`.
