# Changelog — BEYOND OS

Todas as mudanças relevantes do projeto.

## [1.1.0] — 2026-06
### Adicionado
- **Módulo Reembolso & Viagens**: despesas com categoria, valor, data, centro de custo e upload de recibo; solicitações de viagem (destino, datas, adiantamento, diárias).
- Funil de **aprovação por alçada** das despesas/viagens (≤ R$ 2 mil → Diretoria; ≤ R$ 10 mil → Diretoria + Diretoria Financeira; > R$ 10 mil → Diretoria Financeira → Sócios). Reembolso liberado só para Diretoria Financeira/Admin.
- **Parâmetros (políticas)**: diária nacional/internacional, valor por km, prazo de prestação de contas e tetos por categoria (com alerta de excedente).
- Backend: modelos `Expense` e `ExpensePolicy`, rotas `/expenses` (submit/approve/pay/reject) e `/expense-policy`.

### Corrigido
- Cadastro de usuário passou a ter **campo de senha + confirmação** (mín. 8 caracteres) e o novo usuário já fica habilitado para login.

### Operação
- Build do Render simplificado para `prisma db push` (sem necessidade de arquivos de migração) — mais simples para publicar.

## [1.0.0] — 2026-06
- Versão inicial: 15 módulos (Console, Dashboard/BI, Projetos, Funil, CRM, Expansão B2B, Tickets, Financeiro, Marketing, Comunicados, Universidade, Agenda, Contratos, Crise, Usuários), chat flutuante, RBAC por 5 categorias, perfil editável, PDF do dashboard, backend Node + Prisma + PostgreSQL e deploy via Render Blueprint.
