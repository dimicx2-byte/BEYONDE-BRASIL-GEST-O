import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.ADMIN_EMAIL || 'dimicx2@gmail.com').toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'Dimi@1008';
  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: { email },
    update: { role: 'admin', status: 'Ativo' },
    create: {
      name: process.env.ADMIN_NAME || 'Dimitri de Melo',
      email,
      passwordHash,
      role: 'admin',
      department: 'Diretoria',
      scope: 'Brasil',
      status: 'Ativo',
    },
  });

  console.log(`✓ Admin garantido: ${email}`);
  if (!process.env.ADMIN_PASSWORD) {
    console.log('⚠ Usando senha padrão. Defina ADMIN_PASSWORD no ambiente e troque no primeiro acesso.');
  }
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
