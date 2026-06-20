import { Router } from 'express';
import { prisma } from '../prisma.js';
import { authenticate } from '../auth.js';
import { requireModule, contractApprovalChain, expenseApprovalChain, canApproveStep } from '../rbac.js';

const r = Router();
r.use(authenticate);

/* -------- Factory de CRUD simples, com gating por módulo -------- */
function crud(path, model, moduleId, { create = true } = {}) {
  const guard = moduleId ? [requireModule(moduleId)] : [];
  r.get(`/${path}`, ...guard, async (_req, res) => {
    res.json(await prisma[model].findMany({ orderBy: { createdAt: 'desc' } }));
  });
  if (create) {
    r.post(`/${path}`, ...guard, async (req, res) => {
      res.status(201).json(await prisma[model].create({ data: req.body || {} }));
    });
  }
  r.put(`/${path}/:id`, ...guard, async (req, res) => {
    res.json(await prisma[model].update({ where: { id: req.params.id }, data: req.body || {} }));
  });
  r.delete(`/${path}/:id`, ...guard, async (req, res) => {
    await prisma[model].delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  });
}

// Módulos abertos a todos os papéis (exceto onde houver deny):
crud('customers', 'customer', 'crm');
crud('courses', 'course', 'universidade');
crud('assets', 'asset', 'marketing');
crud('announcements', 'announcement', 'comunicados');
crud('projects', 'project', 'projetos');
crud('events', 'event', 'agenda');
crud('crises', 'crisis', 'crise');
// Financeiro (bloqueado para diretoria e equipe):
crud('financial', 'financialEntry', 'financeiro');

/* -------- Reembolso & Viagens (aprovação por alçada) -------- */
r.get('/expenses', requireModule('reembolso'), async (_req, res) => {
  res.json(await prisma.expense.findMany({ orderBy: { createdAt: 'desc' } }));
});
r.post('/expenses', requireModule('reembolso'), async (req, res) => {
  res.status(201).json(await prisma.expense.create({ data: { ...req.body, employee: req.body.employee || req.user.name, status: 'rascunho' } }));
});
r.post('/expenses/:id/submit', requireModule('reembolso'), async (req, res) => {
  const e = await prisma.expense.findUnique({ where: { id: req.params.id } });
  const approvals = expenseApprovalChain(e.amount || 0).map(s => ({ ...s, ok: false, by: null, when: null }));
  res.json(await prisma.expense.update({ where: { id: e.id }, data: { status: 'aprovacao', approvals } }));
});
r.post('/expenses/:id/approve', requireModule('reembolso'), async (req, res) => {
  const e = await prisma.expense.findUnique({ where: { id: req.params.id } });
  const approvals = e.approvals || [];
  const step = approvals.find(s => !s.ok);
  if (!step) return res.status(400).json({ error: 'Nada a aprovar' });
  if (!canApproveStep(req.user.role, step)) return res.status(403).json({ error: `Sem alçada: ${step.label}` });
  step.ok = true; step.by = req.user.name; step.when = new Date().toISOString();
  const status = approvals.every(s => s.ok) ? 'aprovado' : 'aprovacao';
  res.json(await prisma.expense.update({ where: { id: e.id }, data: { approvals, status } }));
});
r.post('/expenses/:id/pay', requireModule('reembolso'), async (req, res) => {
  if (!['dir_fin', 'admin'].includes(req.user.role)) return res.status(403).json({ error: 'Somente Diretoria Financeira pode reembolsar' });
  res.json(await prisma.expense.update({ where: { id: req.params.id }, data: { status: 'pago' } }));
});
r.post('/expenses/:id/reject', requireModule('reembolso'), async (req, res) => {
  res.json(await prisma.expense.update({ where: { id: req.params.id }, data: { status: 'reprovado' } }));
});
// Política de despesas (parâmetros)
r.get('/expense-policy', requireModule('reembolso'), async (_req, res) => {
  res.json(await prisma.expensePolicy.upsert({ where: { id: 'default' }, update: {}, create: { id: 'default' } }));
});
r.put('/expense-policy', requireModule('reembolso'), async (req, res) => {
  if (!['admin', 'dir_fin'].includes(req.user.role)) return res.status(403).json({ error: 'Sem permissão' });
  res.json(await prisma.expensePolicy.upsert({ where: { id: 'default' }, update: req.body || {}, create: { id: 'default', ...req.body } }));
});

/* -------- Deals (funil) -------- */
r.get('/deals', requireModule('funil'), async (req, res) => {
  const where = {};
  if (req.query.pipeline && req.query.pipeline !== 'todos') where.pipeline = req.query.pipeline;
  if (req.query.owner && req.query.owner !== 'todos') where.ownerId = req.query.owner;
  res.json(await prisma.deal.findMany({ where, include: { customer: true, owner: true }, orderBy: { createdAt: 'desc' } }));
});
r.post('/deals', requireModule('funil'), async (req, res) => {
  const deal = await prisma.deal.create({ data: req.body || {} });
  await prisma.dealEvent.create({ data: { dealId: deal.id, type: 'create', text: 'Negócio criado', author: req.user.name } });
  res.status(201).json(deal);
});
r.put('/deals/:id', requireModule('funil'), async (req, res) => {
  const prev = await prisma.deal.findUnique({ where: { id: req.params.id } });
  const deal = await prisma.deal.update({ where: { id: req.params.id }, data: req.body || {} });
  if (req.body?.stage && prev && req.body.stage !== prev.stage) {
    await prisma.dealEvent.create({ data: { dealId: deal.id, type: 'stage', text: `Etapa: ${prev.stage} → ${deal.stage}`, author: req.user.name } });
  }
  res.json(deal);
});
r.post('/deals/:id/events', requireModule('funil'), async (req, res) => {
  const { type, text } = req.body || {};
  res.status(201).json(await prisma.dealEvent.create({ data: { dealId: req.params.id, type: type || 'note', text: text || '', author: req.user.name } }));
});

/* -------- Tickets — cada usuário só vê os seus (resp/apoio); admin vê todos -------- */
r.get('/tickets', requireModule('tickets'), async (req, res) => {
  if (req.user.role === 'admin') return res.json(await prisma.ticket.findMany({ orderBy: { createdAt: 'desc' } }));
  const all = await prisma.ticket.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(all.filter(t => t.respId === req.user.id || (t.apoio || []).includes(req.user.email)));
});
r.post('/tickets', requireModule('tickets'), async (req, res) => {
  res.status(201).json(await prisma.ticket.create({ data: { ...req.body, requester: req.user.name } }));
});
r.put('/tickets/:id', requireModule('tickets'), async (req, res) => {
  res.json(await prisma.ticket.update({ where: { id: req.params.id }, data: req.body || {} }));
});

/* -------- Contratos — upload + funil de aprovação por alçada + GOV.BR -------- */
r.get('/contracts', requireModule('contratos'), async (_req, res) => {
  res.json(await prisma.contract.findMany({ orderBy: { createdAt: 'desc' } }));
});
r.post('/contracts', requireModule('contratos'), async (req, res) => {
  res.status(201).json(await prisma.contract.create({ data: { ...req.body, status: 'rascunho' } }));
});
r.post('/contracts/:id/submit', requireModule('contratos'), async (req, res) => {
  const c = await prisma.contract.findUnique({ where: { id: req.params.id } });
  if (!c) return res.status(404).json({ error: 'Contrato não encontrado' });
  if (!(c.attachments || []).length) return res.status(400).json({ error: 'Anexe a minuta antes de enviar' });
  const approvals = contractApprovalChain(c.value).map(s => ({ ...s, ok: false, by: null, when: null }));
  res.json(await prisma.contract.update({ where: { id: c.id }, data: { status: 'aprovacao', approvals } }));
});
r.post('/contracts/:id/approve', requireModule('contratos'), async (req, res) => {
  const c = await prisma.contract.findUnique({ where: { id: req.params.id } });
  const approvals = c.approvals || [];
  const step = approvals.find(s => !s.ok);
  if (!step) return res.status(400).json({ error: 'Nada a aprovar' });
  if (!canApproveStep(req.user.role, step)) return res.status(403).json({ error: `Sem alçada para a etapa: ${step.label}` });
  step.ok = true; step.by = req.user.name; step.when = new Date().toISOString();
  const status = approvals.every(s => s.ok) ? 'aprovado' : 'aprovacao';
  res.json(await prisma.contract.update({ where: { id: c.id }, data: { approvals, status } }));
});
r.post('/contracts/:id/sign', requireModule('contratos'), async (req, res) => {
  const c = await prisma.contract.findUnique({ where: { id: req.params.id } });
  if (c.status !== 'aprovado') return res.status(400).json({ error: 'Contrato precisa estar aprovado' });
  // Integração GOV.BR: enviar para assinatura digital ICP-Brasil (ver docs/API.md)
  res.json(await prisma.contract.update({ where: { id: c.id }, data: { status: 'assinatura' } }));
});
r.post('/contracts/:id/signed', requireModule('contratos'), async (req, res) => {
  res.json(await prisma.contract.update({ where: { id: req.params.id }, data: { status: 'assinado', signedAt: new Date() } }));
});

export default r;
