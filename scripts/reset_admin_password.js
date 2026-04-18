// scripts/reset_admin_password.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const email = process.env.ADMIN_EMAIL || 'admin@example.com';
const password = process.env.NEW_PASSWORD;

if (!password) {
  console.error('Set NEW_PASSWORD environment variable and re-run.');
  process.exit(1);
}

(async () => {
  const prisma = new PrismaClient();
  try {
    const hash = await bcrypt.hash(password, 10);

    await prisma.user.upsert({
      where: { email },
      update: { password: hash, role: 'SUPER_ADMIN' },
      create: { email, password: hash, role: 'SUPER_ADMIN', name: 'Owner' },
    });

    console.log('Superadmin password set for', email);
  } finally {
    await prisma.$disconnect();
  }
  process.exit(0);
})().catch(err => { console.error(err); process.exit(1); });
