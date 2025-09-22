import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
    // Development için SQLite, production için PostgreSQL kullan
    datasources: {
      db: {
        url: process.env.NODE_ENV === 'production'
          ? (process.env.DATABASE_URL ?? 'file:./prisma/dev.db')
          : 'file:./prisma/dev.db'
      }
    }
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db