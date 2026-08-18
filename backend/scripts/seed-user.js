#!/usr/bin/env node
/* eslint-disable no-console */
// Try to use the compiled generated Prisma client from the build output first,
// falling back to the installed package. This keeps the script working whether
// the project was built or not.
// Load environment variables from backend/.env so Prisma can read DATABASE_URL.
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

let PrismaClient;
try {
  // If the project was built, use the compiled client in `dist/generated/prisma`.
  PrismaClient = require('../dist/generated/prisma/client').PrismaClient;
} catch (e) {
  try {
    // Fallback to the runtime installed client
    PrismaClient = require('@prisma/client').PrismaClient;
  } catch (e2) {
    // As a last resort, try the generated TypeScript path (rarely usable at runtime)
    PrismaClient = require('../generated/prisma/client').PrismaClient;
  }
}
const bcrypt = require('bcryptjs');

async function main() {
  const prisma = new PrismaClient();
  const email = process.env.SEED_USER_EMAIL || 'admin@example.com';
  const password = process.env.SEED_USER_PASSWORD || 'Password123!';
  const hash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash: hash,
    },
    create: {
      firstName: 'Local',
      lastName: 'Admin',
      email,
      phone: '0000000000',
      role: 'ADMIN',
      passwordHash: hash,
    },
  });

  console.log('Seeded user:', { id: user.id, email: user.email });
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
