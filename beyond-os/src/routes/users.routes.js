import { Router } from 'express';
import { prisma } from '../prisma.js';
import { authenticate, requireAdmin, hashPassword } from '../auth.js';
import { ROLES } from '../rbac.js';

const r = Router();
r.use(authenticate, requireAdmin); // módulo Usuários: exclusivo do admin

// GET /api/users
r.get('/', async (_req, res) => {
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'asc' } });
  res.json(users.map(strip));
});

// POST /api/users  (somente admin pode incluir usuários)
r.post('/', async (req, res) => {
  const { name, email, role, department, scope, password } = req.body || {};
  if (!name || !email) return res.status(400).json({ error: 'Nome e e-mail são obrigatórios' });
  if (!ROLES[role]) return res.status(400).json({ error: 'Papel inválido' });
  const exists = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (exists) return res.status(409).json({ error: 'E-mail já cadastrado' });
  const tempPass = password || Math.random().toString(36).slice(2, 10) + 'A1!';
  const user = await prisma.user.create({
    data: { name, email: email.toLowerCase(), role, department, scope: scope || 'Brasil', status: 'Pendente', passwordHash: await hashPassword(tempPass) },
  });
  res.status(201).json({ user: strip(user), tempPassword: password ? undefined : tempPass });
});

// PUT /api/users/:id
r.put('/:id', async (req, res) => {
  const { name, role, department, scope, status } = req.body || {};
  const user = await prisma.user.update({ where: { id: req.params.id }, data: { name, role, department, scope, status } });
  res.json(strip(user));
});

// DELETE /api/users/:id
r.delete('/:id', async (req, res) => {
  await prisma.user.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

function strip(u) { const { passwordHash, ...rest } = u; return rest; }
export default r;
