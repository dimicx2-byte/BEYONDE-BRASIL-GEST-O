# BEYOND OS — Blueprint de Arquitetura

**Sistema Operacional de Gestão Centralizada · BEYOND Hospitality (Brasil)**
Documento técnico para evolução do protótipo funcional a uma plataforma de produção escalável.
Versão 1.0 · Junho/2026

---

## 1. Visão e princípios

O **BEYOND OS** consolida, em um único console, as nove frentes de gestão da operação: Gestão de Projetos, CRM B2C, Funil de Vendas, Tickets/Chamados, Marketing, Comunicados, Expansão B2B, Dashboard e Universidade BEYOND. O conceito segue o modelo de plataforma "tudo em um lugar" do SULTS, mas reposicionado para o segmento de **luxo / sports hospitality**, com identidade visual sóbria (preto, off-white e dourado champanhe) coerente com a marca BEYOND ("We redefine remarkable").

Princípios de engenharia (padrão sênior):

- **Modular por domínio (Domain-Driven Design):** cada um dos 9 apps é um *bounded context* independente, com seu próprio modelo, serviço e rotas. Permite evoluir/escalar cada módulo isoladamente.
- **API-first:** todo o front-end consome uma API versionada (`/api/v1`). Isso habilita futuros clientes (app mobile BEYOND, integrações de parceiros).
- **Multi-tenant desde o início:** isolamento lógico por `organization` (BEYOND Brasil, UK, etc.) e por `unit` — essencial para escalar internacionalmente.
- **Segurança como base, não como camada final:** RBAC, hash de senha, auditoria e criptografia em repouso/trânsito.
- **Observabilidade:** logs estruturados, métricas e tracing distribuído.

---

## 2. Stack tecnológico recomendado

| Camada | Tecnologia | Justificativa |
|---|---|---|
| Front-end | **React 18 + TypeScript + Vite** | Ecossistema maduro, tipagem segura, build rápido. |
| UI / Design System | **Tailwind CSS + Radix UI** + tokens BEYOND | Componentização consistente; tokens replicam o protótipo. |
| Estado / dados | **TanStack Query** + Zustand | Cache de servidor + estado de UI desacoplados. |
| Gráficos | **Recharts** ou Chart.js | Dashboards executivos. |
| Back-end | **Node.js + NestJS (TypeScript)** | Estrutura modular nativa (ideal para DDD), DI, guards de RBAC. |
| Banco relacional | **PostgreSQL 16** | Transacional, JSONB para campos flexíveis, robustez. |
| ORM | **Prisma** | Migrations versionadas, type-safety ponta a ponta. |
| Cache / filas | **Redis** + BullMQ | Sessões, rate-limit, jobs (e-mails, notificações). |
| Busca | **OpenSearch / Meilisearch** | Busca global do topo do sistema. |
| Auth | **JWT (access curto + refresh)** + Argon2id | Padrão seguro; suporte a SSO/SAML futuro. |
| Arquivos | **AWS S3** (ou compatível) | Vouchers, anexos de chamados, materiais da Universidade. |
| Infra | **Docker + AWS ECS/Fargate** ou Kubernetes | Escalabilidade horizontal, deploy isolado por serviço. |
| CI/CD | **GitHub Actions** | Lint, testes, build e deploy automatizados. |
| Observabilidade | **OpenTelemetry + Grafana/Loki + Sentry** | Logs, métricas, alertas e rastreio de erros. |

> O protótipo entregue (`beyond-os.html`) implementa a **camada de apresentação e UX** com dados de exemplo (`localStorage`/in-memory). A migração para esta stack preserva 100% do design system e da navegação.

---

## 3. Arquitetura de alto nível

```
                ┌──────────────────────────────────────────┐
   Navegador →  │  SPA React (BEYOND OS) — Design System     │
   App mobile → │  Console central + 9 módulos               │
                └───────────────┬──────────────────────────┘
                                │  HTTPS / REST (JWT)  /api/v1
                ┌───────────────▼──────────────────────────┐
                │            API Gateway / BFF               │
                │   Auth · RBAC · Rate-limit · Audit log     │
                └───────────────┬──────────────────────────┘
        ┌───────────┬───────────┼───────────┬───────────────┐
        ▼           ▼           ▼           ▼               ▼
   ┌────────┐ ┌────────┐  ┌─────────┐  ┌────────┐    ┌───────────┐
   │Projetos│ │ CRM    │  │ Vendas/ │  │Tickets │ …  │Universidade│   (módulos NestJS)
   │        │ │ B2C    │  │ Funil   │  │ SLA    │    │  LMS       │
   └───┬────┘ └───┬────┘  └────┬────┘  └───┬────┘    └─────┬─────┘
       └──────────┴───────┬────┴───────────┴───────────────┘
                          ▼
            ┌───────────────────────────┐   ┌──────────┐   ┌──────────┐
            │    PostgreSQL (multi-tenant)│   │  Redis   │   │   S3     │
            └───────────────────────────┘   └──────────┘   └──────────┘
                          │
                  ┌───────▼────────┐
                  │ Workers (BullMQ)│  e-mail, notificações, relatórios
                  └────────────────┘
```

---

## 4. Modelo de dados (núcleo)

Entidades centrais compartilhadas + entidades por módulo. Todas carregam `organization_id` (multi-tenant) e campos de auditoria (`created_at`, `updated_at`, `created_by`).

### 4.1 Identidade e acesso

```
User(id, name, email, password_hash, status, last_login_at, organization_id)
Role(id, name, description)                         -- ex.: Admin, Diretor, Comercial, Operações, Atendente
Permission(id, resource, action)                    -- ex.: ("funil","create"), ("tickets","resolve")
UserRole(user_id, role_id, unit_id?)
RolePermission(role_id, permission_id)
Organization(id, name, country)                     -- BEYOND Brasil, UK…
Unit(id, name, organization_id)                     -- praças/eventos
AuditLog(id, user_id, action, entity, entity_id, payload_diff, ip, created_at)
```

### 4.2 Por módulo (resumo)

```
-- Gestão de Projetos
Project(id, name, event, status, due_date, owner_id)
Task(id, project_id, title, status, progress, assignee_id, due_date)

-- CRM B2C
Customer(id, name, company, tier, email, phone, ltv, status, owner_id)
Interaction(id, customer_id, type, notes, user_id, created_at)

-- Funil de Vendas (B2C) e Expansão (B2B) — mesma base, pipelines distintos
Pipeline(id, name, type)                            -- 'b2c' | 'b2b'
Stage(id, pipeline_id, name, order)
Deal(id, pipeline_id, stage_id, title, value, probability, customer_id, owner_id, days_in_stage)

-- Tickets / Chamados
Ticket(id, code, subject, department, requester_id, assignee_id, status, sla_due, priority)
TicketMessage(id, ticket_id, author_id, body, attachments[])

-- Marketing
Campaign(id, name, channel, status, budget, leads, roas, start_at, end_at)

-- Comunicados
Announcement(id, title, body, audience, author_id, published_at)
AnnouncementRead(announcement_id, user_id, read_at)

-- Universidade BEYOND (LMS)
Course(id, title, description, modules_count, hours, mandatory)
Enrollment(id, course_id, user_id, progress, completed_at, certificate_url)

-- Gestão Financeira
Account(id, name, type, balance)                    -- contas/caixa
FinancialEntry(id, account_id, kind, category, description, party, amount, due_date, paid_at, status)  -- kind: 'receivable' | 'payable'
Invoice(id, customer_id, deal_id, amount, status, due_date)
DREPeriod(id, period, gross_revenue, taxes, cogs, opex, ebitda, net_income)  -- DRE consolidada
```

> O módulo **Gestão Financeira** é o sistema de registro de contas a pagar/receber, fluxo de caixa, DRE e indicadores (margem, EBITDA, runway, inadimplência). Integra-se ao Funil/CRM (faturas geradas a partir de negócios ganhos) e exige permissões dedicadas (`financeiro:read`, `financeiro:manage`) restritas a perfis financeiros e C-level.

---

## 5. Controle de acesso (RBAC)

Modelo **papel → permissões**, avaliado por *guards* no NestJS. Sugestão inicial de papéis:

| Papel | Escopo típico |
|---|---|
| **Administrador Principal** | Acesso total ao sistema, gestão de usuários e configurações. *(dimicx2@gmail.com)* |
| Diretor / C-level | Leitura ampla + Dashboard + aprovações. |
| Comercial | Funil, CRM, Expansão (criar/editar próprios negócios). |
| Operações | Projetos, Tickets. |
| Atendimento | Tickets (responder, resolver). |
| Marketing | Campanhas, Comunicados. |
| Pessoas & Cultura | Universidade, Comunicados. |
| Colaborador | Consumo de Comunicados e Universidade. |

Cada permissão é um par `(recurso, ação)` — ex.: `funil:create`, `tickets:resolve`, `users:manage`. Decorator `@RequirePermission('funil','create')` protege cada endpoint.

---

## 6. Segurança — observação importante sobre as credenciais

No protótipo, o usuário administrador foi pré-configurado conforme solicitado:

- **E-mail:** `dimicx2@gmail.com`
- **Papel:** Administrador Principal

> ⚠️ **Recomendação de segurança (boa prática Apple/sênior):** a senha **não deve trafegar nem ser armazenada em texto puro** em produção. No protótipo ela existe apenas em memória no navegador para fins de demonstração. Na plataforma real:
> 1. A senha é enviada via HTTPS e **nunca persistida em claro** — guarda-se apenas o `password_hash` com **Argon2id** (ou bcrypt custo ≥ 12).
> 2. Habilite **2FA/MFA** para contas administrativas.
> 3. Force **troca da senha no primeiro acesso** e política de rotação.
> 4. Considere **SSO corporativo** (Google Workspace / SAML), eliminando senhas locais.
>
> Em resumo: deixei o login funcional no protótipo, mas trate a senha atual como **temporária** e substitua-a por um fluxo seguro antes de qualquer uso real.

Demais controles: rate-limiting de login, bloqueio progressivo após tentativas, tokens de refresh rotativos, CORS restrito, headers de segurança (CSP, HSTS), criptografia em repouso (RDS/S3) e em trânsito (TLS 1.3), e trilha de auditoria imutável (`AuditLog`).

---

## 7. Roadmap de implementação

| Fase | Entrega | Duração estim. |
|---|---|---|
| **0 — Protótipo (concluído)** | UX/UI, navegação e 9 módulos com dados de exemplo. | ✅ |
| **1 — Fundação** | Monorepo, design system em React, API NestJS, Postgres, Auth + RBAC, módulo de Usuários. | 3–4 sem. |
| **2 — Núcleo comercial** | Funil B2C, CRM, Expansão B2B, Dashboard com dados reais. | 4–5 sem. |
| **3 — Operação** | Projetos, Tickets/SLA, notificações e workers. | 4 sem. |
| **4 — Crescimento & pessoas** | Marketing, Comunicados, Universidade (LMS + certificados). | 4 sem. |
| **5 — Escala & integrações** | Multi-tenant completo, busca global, app mobile, integrações (e-mail, pagamentos, ERP). | contínuo |

---

## 8. Estrutura de pastas sugerida (monorepo)

```
beyond-os/
├── apps/
│   ├── web/                 # React + Vite (front-end)
│   └── api/                 # NestJS (back-end)
├── packages/
│   ├── ui/                  # Design System BEYOND (tokens, componentes)
│   ├── types/               # contratos TypeScript compartilhados
│   └── config/              # eslint, tsconfig, tailwind preset
├── infra/                   # Docker, IaC (Terraform), CI/CD
└── docs/                    # este blueprint + ADRs
```

---

## 9. Próximos passos imediatos

1. Validar a UX do protótipo com a diretoria e ajustar branding/fluxos.
2. Aprovar a stack e provisionar o repositório + ambiente de desenvolvimento.
3. Implementar a **Fase 1 (Fundação)** começando por Auth + RBAC + gestão de usuários.
4. Migrar o design system do protótipo para `packages/ui`.
5. Definir e substituir o fluxo seguro de credenciais do administrador.

---

*Documento gerado como parte da entrega inicial do BEYOND OS. Acompanha o protótipo funcional `beyond-os.html`.*
