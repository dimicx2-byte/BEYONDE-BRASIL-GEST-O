import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { authenticate } from './auth.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/users.routes.js';
import resourceRoutes from './routes/resources.routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || true, credentials: true }));
app.use(express.json({ limit: '5mb' }));
app.use(cookieParser());

// --- Uploads (anexos de contratos, artes de marketing, fotos de perfil) ---
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
const upload = multer({ dest: UPLOAD_DIR, limits: { fileSize: 25 * 1024 * 1024 } });
app.post('/api/upload', authenticate, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });
  res.json({ url: `/uploads/${req.file.filename}`, name: req.file.originalname, size: req.file.size });
});
app.use('/uploads', express.static(UPLOAD_DIR));

// --- API ---
app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'beyond-os', ts: Date.now() }));
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api', resourceRoutes);

// --- Frontend estático ---
const PUBLIC = path.join(__dirname, '..', 'public');
app.use(express.static(PUBLIC));
app.get('*', (_req, res) => res.sendFile(path.join(PUBLIC, 'index.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`BEYOND OS rodando na porta ${PORT}`));
