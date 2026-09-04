import { prisma } from '@/lib/db'
import { estaMaduro, previsaoIntervalos, type Nota } from '@/lib/srs/agendamento'
import { intervaloCurto } from '@/lib/formato'
import { montarFila, type OpcoesFila } from '@/lib/srs/fila'

export type CardParaRevisar = {
  id: string
  frente: string
  verso: string
  moduloId: string
  moduloTitulo: string
  trilhaTitulo: string
  areaNome: string
  estado: number
  due: Date
  prioridadeModulo: string
  /** Quanto tempo cada nota adia o card, para mostrar nos botões. */
  previsao: Record<Nota, string>
}

/**
 * Fila do dia: cards vencidos, intercalados entre módulos e priorizados.
 * A ordenação em si mora em `lib/srs/fila.ts`, que é testado isoladamente.
 */
export async function filaDoDia(opcoes: OpcoesFila = {}): Promise<CardParaRevisar[]> {
  const agora = opcoes.agora ?? new Date()

  const cards = await prisma.card.findMany({
    where: {
      due: { lte: agora },
      ...(opcoes.moduloId ? { moduloId: opcoes.moduloId } : {}),
    },
    orderBy: { due: 'asc' },
    include: { modulo: { include: { trilha: { include: { area: true } } } } },
  })

  return montarFila(
    cards.map((card) => ({
      id: card.id,
      frente: card.frente,
      verso: card.verso,
      moduloId: card.moduloId,
      moduloTitulo: card.modulo.titulo,
      trilhaTitulo: card.modulo.trilha.titulo,
      areaNome: card.modulo.trilha.area.nome,
      estado: card.state,
      due: card.due,
      prioridadeModulo: card.modulo.prioridade,
      previsao: rotularPrevisao(card, agora),
    })),
    { ...opcoes, agora },
  )
}

function rotularPrevisao(
  card: Parameters<typeof previsaoIntervalos>[0],
  agora: Date,
): Record<Nota, string> {
  const datas = previsaoIntervalos(card, agora)
  return {
    1: intervaloCurto(agora, datas[1]),
    2: intervaloCurto(agora, datas[2]),
    3: intervaloCurto(agora, datas[3]),
    4: intervaloCurto(agora, datas[4]),
  }
}

export type Resumo = {
  vencidos: number
  total: number
  novos: number
  maduros: number
  modulos: number
  trilhas: number
  proximoVencimento: Date | null
  revisadosHoje: number
}

export async function resumo(agora: Date = new Date()): Promise<Resumo> {
  const inicioDoDia = new Date(agora)
  inicioDoDia.setHours(0, 0, 0, 0)

  const [total, vencidos, novos, trilhas, modulos, revisadosHoje, cards, proximo] =
    await Promise.all([
      prisma.card.count(),
      prisma.card.count({ where: { due: { lte: agora } } }),
      prisma.card.count({ where: { state: 0 } }),
      prisma.trilha.count(),
      prisma.modulo.count(),
      prisma.review.count({ where: { revisadoEm: { gte: inicioDoDia } } }),
      prisma.card.findMany({ where: { state: 2 }, select: { state: true, scheduledDays: true } }),
      prisma.card.findFirst({
        where: { due: { gt: agora } },
        orderBy: { due: 'asc' },
        select: { due: true },
      }),
    ])

  return {
    total,
    vencidos,
    novos,
    maduros: cards.filter(estaMaduro).length,
    trilhas,
    modulos,
    revisadosHoje,
    proximoVencimento: proximo?.due ?? null,
  }
}

export async function arvoreDeTrilhas() {
  return prisma.area.findMany({
    orderBy: { nome: 'asc' },
    include: {
      trilhas: {
        orderBy: { criadaEm: 'asc' },
        include: {
          modulos: {
            orderBy: { ordem: 'asc' },
            include: { _count: { select: { cards: true } } },
          },
        },
      },
    },
  })
}

export async function moduloComCards(id: string) {
  return prisma.modulo.findUnique({
    where: { id },
    include: {
      trilha: { include: { area: true } },
      cards: { orderBy: { criadoEm: 'asc' } },
    },
  })
}
