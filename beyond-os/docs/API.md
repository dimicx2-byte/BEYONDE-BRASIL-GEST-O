# BEYOND OS — Referência da API

Base: `/api`. Autenticação via `Authorization: Bearer <token>` ou cookie httpOnly `token`.
Respostas em JSON. Erros: `{ "error": "mensagem" }` com status HTTP adequado.

## Autenticação
| Método | Rota | Descrição |
|---|---|---|
| POST | `/auth/login` | `{email, password}` → `{token, user}` |
| POST | `/auth/logout` | encerra a sessão |
| GET | `/auth/me` | usuário atual + permissões do papel |
| PUT | `/auth/profile` | edita o próprio perfil (`name, phone, bio, photoUrl, department`) |
| PUT | `/auth/password` | troca a senha (`current, next`) |

## Usuários (somente Admin)
| Método | Rota | Descrição |
|---|---|---|
| GET | `/users` | lista usuários |
| POST | `/users` | cria usuário (`name,email,role,department,scope`) — retorna senha temporária |
| PUT | `/users/:id` | atualiza papel/status |
| DELETE | `/users/:id` | remove |

`role` ∈ `admin | socio | diretoria | dir_fin | equipe`.

## Recursos (gating por módulo + papel)
CRUD padrão: `GET /x`, `POST /x`, `PUT /x/:id`, `DELETE /x/:id`.

| Recurso | Rota base | Módulo |
|---|---|---|
| Clientes (CRM) | `/customers` | crm |
| Cursos (LMS) | `/courses` | universidade |
| Artes (Marketing) | `/assets` | marketing |
| Comunicados/Notícias/Destaque | `/announcements` | comunicados |
| Projetos | `/projects` | projetos |
| Agenda | `/events` | agenda |
| Crises | `/crises` | crise |
| Financeiro | `/financial` | financeiro (bloqueado p/ Diretoria e Equipe) |

### Funil de vendas — `/deals`
- `GET /deals?pipeline=&owner=` (filtros)
- `POST /deals` (gera evento "create")
- `PUT /deals/:id` (mudança de etapa gera evento "stage")
- `POST /deals/:id/events` `{type,text}` (nota, atividade, checkpoint, win, lose)

### Tickets — `/tickets`
- `GET /tickets` — admin vê todos; demais veem apenas onde são `resp` ou estão em `apoio`.
- `POST /tickets`, `PUT /tickets/:id`.

### Contratos — `/contracts` (alçada + GOV.BR)
- `POST /contracts` (rascunho) → `POST /contracts/:id/submit` (monta funil por valor)
- `POST /contracts/:id/approve` (aprova a próxima etapa se houver alçada)
- `POST /contracts/:id/sign` (envia ao GOV.BR após aprovado) → `POST /contracts/:id/signed`

Alçadas por valor: ≤ R$ 250 mil → Diretoria; ≤ R$ 1 mi → Diretoria + Diretoria Financeira; > R$ 1 mi → Diretoria Financeira → Sócios → Admin.

## Upload
- `POST /api/upload` (multipart, campo `file`) → `{url, name, size}`. Use a `url` retornada em anexos de contrato, artes de marketing e foto de perfil.

## Health
- `GET /api/health` → `{ ok: true }`

## Integrações externas (pontos de extensão)
- **Google Calendar**: OAuth 2.0 do usuário; sincronizar `/events` com a Calendar API. Guardar refresh token por usuário.
- **GOV.BR (assinatura digital ICP-Brasil)**: na etapa `sign`, chamar a API de assinatura GOV.BR e gravar o protocolo/URL do documento assinado em `Contract.signedAt`/anexos.
