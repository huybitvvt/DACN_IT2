import { PrismaClient } from '@prisma/client';
import { env } from '../config/env.js';

// Singleton Prisma Client. Trong dev, tránh tạo nhiều kết nối khi hot-reload
// bằng cách lưu instance vào globalThis.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.isProduction ? ['error'] : ['query', 'warn', 'error'],
  });

if (!env.isProduction) {
  globalForPrisma.prisma = prisma;
}
