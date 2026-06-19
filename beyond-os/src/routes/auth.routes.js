import { Router } from 'express';
import { prisma } from '../prisma.js';
import { signToken, verifyPassword, hashPassword, authenticate } from '../auth.js';
import { ROLES } from '../rbac.js';

const r = Router();

// POST /api/auth/login
r.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Informe e-mail e senha' });
  const user = await prisma.user.findUnique({ where: { email: String(email).toLowerCase() } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  const token = signToken(user);
  res.cookie?.('token', token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 12 * 3600 * 1000 });
  res.json({ token, user: publicUser(user) });
});

// POST /api/auth/logout
r.post('/logout', (req, res) => { res.clearCookie?.('token'); res.json({ ok: true }); });

// GET /api/auth/me
r.get('/me', authenticate, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  res.json({ user: publicUser(user), permissions: ROLES[user.role] });
});

// PUT /api/auth/profile  (editar próprio perfil)
r.put('/profile', authenticate, async (req, res) => {
  const { name, phone, bio, photoUrl, department } = req.body || {};
  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: { name, phone, bio, photoUrl, department },
  });
  res.json({ user: publicUser(user) });
});

// PUT /api/auth/password (trocar a própria senha)
r.put('/password', authenticate, async (req, res) => {
  const { current, next } = req.body || {};
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!(await verifyPassword(current || '', user.passwordHash))) return res.status(400).json({ error: 'Senha atual incorreta' });
  if (!next || next.length < 8) return res.status(400).json({ error: 'A nova senha deve ter ao menos 8 caracteres' });
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(next) } });
  res.json({ ok: true });
});

function publicUser(u) {
  return { id: u.id, name: u.name, email: u.email, role: u.role, department: u.department, scope: u.scope, phone: u.phone, bio: u.bio, photoUrl: u.photoUrl, status: u.status };
}

export default r;
