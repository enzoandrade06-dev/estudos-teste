/**
 * Cliente Prisma compartilhado.
 *
 * Em desenvolvimento o Next recarrega os módulos a cada alteração; sem o cache
 * no `globalThis`, cada recarga abriria uma conexão nova até estourar o limite.
 */
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { PrismaClient } from './gerado/client'

function criarCliente() {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error('DATABASE_URL não definida. Copie .env.example para .env.')
  }
  return new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) })
}

const cache = globalThis as unknown as { prisma?: PrismaClient }

export const prisma = cache.prisma ?? criarCliente()

if (process.env.NODE_ENV !== 'production') cache.prisma = prisma
