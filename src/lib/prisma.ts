import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

let prismaClient: PrismaClient

if (process.env.NODE_ENV === 'production') {
  prismaClient = new PrismaClient({
    errorFormat: 'pretty',
  })
} else {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient({
      errorFormat: 'pretty',
    })
  }
  prismaClient = globalForPrisma.prisma
}

export const prisma = prismaClient
