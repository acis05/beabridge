import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();
const email = process.env.ADMIN_EMAIL || 'admin@beabridge.local';
const password = process.env.ADMIN_PASSWORD || 'ChangeMe123!';
const companyName = process.env.COMPANY_NAME || 'PT Contoh Industri';
let company = await prisma.company.findFirst();
if (!company) company = await prisma.company.create({ data: { name: companyName } });
const existing = await prisma.user.findUnique({ where: { email } });
if (!existing) {
  await prisma.user.create({ data: { email, passwordHash: await bcrypt.hash(password, 12), name: 'Administrator', role: 'ADMIN', companyId: company.id } });
  console.log(`Bootstrap admin created: ${email}`);
}
await prisma.warehouse.upsert({ where: { companyId_code: { companyId: company.id, code: 'MAIN' } }, update: {}, create: { companyId: company.id, code: 'MAIN', name: 'Gudang Utama' } });
await prisma.$disconnect();
