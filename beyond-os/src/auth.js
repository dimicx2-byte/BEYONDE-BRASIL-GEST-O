import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma.js';

const SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const EXPIRES = '12h';

export function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role, email: user.email }, SECRET, { expiresIn: EXPIRES });
}

export async function hashPassword(plain) {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

// Middleware de autenticação (Bearer token ou cookie httpOnly).
export async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const bearer = header.startsWith('Bearer ') ? header.slice(7) : null;
    const token = bearer || req.cookies?.token;
    if (!token) return res.status(401).json({ error: 'Não autenticado' });
    const payload = jwt.verify(token, SECRET);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.status === 'Inativo') return res.status(401).json({ error: 'Sessão inválida' });
    req.user = { id: user.id, role: user.role, email: user.email, name: user.name };
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Exclusivo do administrador' });
  next();
}
