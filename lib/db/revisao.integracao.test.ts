/**
 * Teste de integração do caminho de escrita da revisão.
 *
 * Os testes de `lib/srs` cobrem o algoritmo isoladamente; este cobre o que eles
 * não alcançam: a transação que avança o card e grava o log, e a fila lida de
 * volta do banco. Roda contra um SQLite temporário, descartado no fim.
 */
import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { PrismaClient } from './gerado/client'
import { agendar, novoEstado, NOTAS } from '@/lib/srs/agendamento'
import { montarFila } from '@/lib/srs/fila'

let diretorio: string
let prisma: PrismaClient
let moduloEssencialId: string
let moduloComplementarId: string

beforeAll(() => {
  diretorio = mkdtempSync(path.join(tmpdir(), 'estudos-teste-'))
  const url = `file:${path.join(diretorio, 'teste.db')}`

  execFileSync('npx', ['prisma', 'migrate', 'deploy'], {
    env: { ...process.env, DATABASE_URL: url },
    stdio: 'pipe',
  })

  prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) })
}, 120_000)

afterAll(async () => {
  await prisma?.$disconnect()
  rmSync(diretorio, { recursive: true, force: true })
})

beforeAll(async () => {
  const area = await prisma.area.create({ data: { nome: 'Área de teste' } })
  const trilha = await prisma.trilha.create({
    data: { areaId: area.id, titulo: 'Trilha de teste', objetivo: 'Validar a persistência' },
  })

  const essencial = await prisma.modulo.create({
    data: { trilhaId: trilha.id, titulo: 'Essencial', ordem: 0, prioridade: 'essencial' },
  })
  const complementar = await prisma.modulo.create({
    data: { trilhaId: trilha.id, titulo: 'Complementar', ordem: 1, prioridade: 'complementar' },
  })

  moduloEssencialId = essencial.id
  moduloComplementarId = complementar.id
})

/** Reproduz o que a server action `revisarCard` faz. */
async function revisar(cardId: string, nota: (typeof NOTAS)[keyof typeof NOTAS]) {
  const card = await prisma.card.findUniqueOrThrow({ where: { id: cardId } })
  const { estado, registro } = agendar(card, nota)

  await prisma.$transaction([
    prisma.card.update({ where: { id: cardId }, data: estado }),
    prisma.review.create({ data: { cardId, ...registro } }),
  ])

  return prisma.card.findUniqueOrThrow({ where: { id: cardId } })
}

async function criarCard(moduloId: string, frente: string) {
  return prisma.card.create({
    data: { moduloId, frente, verso: 'resposta', ...novoEstado() },
  })
}

describe('persistência da revisão', () => {
  it('avança o estado do card e grava o log na mesma operação', async () => {
    const card = await criarCard(moduloEssencialId, 'Card que será revisado')

    const depois = await revisar(card.id, NOTAS.BOM)

    expect(depois.state).not.toBe(0)
    expect(depois.reps).toBe(1)
    expect(depois.due.getTime()).toBeGreaterThan(card.due.getTime())

    const logs = await prisma.review.findMany({ where: { cardId: card.id } })
    expect(logs).toHaveLength(1)
    expect(logs[0].nota).toBe(NOTAS.BOM)
    expect(logs[0].estadoAnterior).toBe(0)
  })

  it('mantém o histórico append-only ao longo de várias revisões', async () => {
    const card = await criarCard(moduloEssencialId, 'Card revisado várias vezes')

    await revisar(card.id, NOTAS.BOM)
    await revisar(card.id, NOTAS.DE_NOVO)
    await revisar(card.id, NOTAS.BOM)

    const logs = await prisma.review.findMany({
      where: { cardId: card.id },
      orderBy: { revisadoEm: 'asc' },
    })

    expect(logs).toHaveLength(3)
    expect(logs.map((log) => log.nota)).toEqual([NOTAS.BOM, NOTAS.DE_NOVO, NOTAS.BOM])
  })

  it('tira da fila o card recém-revisado, porque ele foi adiado', async () => {
    const card = await criarCard(moduloEssencialId, 'Card que sai da fila')
    await revisar(card.id, NOTAS.FACIL)

    const vencidos = await prisma.card.findMany({ where: { due: { lte: new Date() } } })
    expect(vencidos.map((c) => c.id)).not.toContain(card.id)
  })

  it('apaga cards e logs em cascata ao remover o módulo', async () => {
    const trilha = await prisma.trilha.findFirstOrThrow()
    const descartavel = await prisma.modulo.create({
      data: { trilhaId: trilha.id, titulo: 'Descartável', ordem: 99 },
    })
    const card = await criarCard(descartavel.id, 'Card órfão em potencial')
    await revisar(card.id, NOTAS.BOM)

    await prisma.modulo.delete({ where: { id: descartavel.id } })

    expect(await prisma.card.count({ where: { id: card.id } })).toBe(0)
    expect(await prisma.review.count({ where: { cardId: card.id } })).toBe(0)
  })
})

describe('fila lida do banco', () => {
  it('intercala módulos e coloca o essencial na frente', async () => {
    await prisma.review.deleteMany()
    await prisma.card.deleteMany()

    await criarCard(moduloComplementarId, 'complementar 1')
    await criarCard(moduloComplementarId, 'complementar 2')
    await criarCard(moduloEssencialId, 'essencial 1')
    await criarCard(moduloEssencialId, 'essencial 2')

    const cards = await prisma.card.findMany({ include: { modulo: true } })
    const fila = montarFila(
      cards.map((card) => ({
        id: card.id,
        moduloId: card.moduloId,
        due: card.due,
        prioridadeModulo: card.modulo.prioridade,
        frente: card.frente,
      })),
    )

    expect(fila).toHaveLength(4)
    expect(fila.map((c) => c.moduloId)).toEqual([
      moduloEssencialId,
      moduloComplementarId,
      moduloEssencialId,
      moduloComplementarId,
    ])
  })
})
