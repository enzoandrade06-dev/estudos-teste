/**
 * Núcleo de agendamento — adapta o FSRS ao nosso modelo de dados.
 *
 * Não reimplementamos o algoritmo (ADR-0002). O que vive aqui é a *tradução*
 * entre as colunas do banco e o formato do `ts-fsrs`, mais a construção do
 * registro append-only de revisão. É essa tradução que os testes cobrem.
 */
import {
  createEmptyCard,
  fsrs,
  generatorParameters,
  Rating,
  State,
  type Card as CardFsrs,
  type Grade,
} from 'ts-fsrs'

/** Como o usuário se auto-avalia depois de revelar a resposta (PLANO.md §5.4). */
export const NOTAS = {
  DE_NOVO: 1,
  DIFICIL: 2,
  BOM: 3,
  FACIL: 4,
} as const

export type Nota = (typeof NOTAS)[keyof typeof NOTAS]

export const ROTULO_NOTA: Record<Nota, string> = {
  1: 'De novo',
  2: 'Difícil',
  3: 'Bom',
  4: 'Fácil',
}

export const ROTULO_ESTADO: Record<number, string> = {
  0: 'novo',
  1: 'aprendendo',
  2: 'revisão',
  3: 'reaprendendo',
}

/** Um card é considerado maduro quando o intervalo agendado passa de 21 dias. */
export const DIAS_PARA_MADURO = 21

/** O estado do FSRS como persistimos: colunas explícitas, não JSON (ADR-0002). */
export type EstadoFsrs = {
  due: Date
  stability: number
  difficulty: number
  elapsedDays: number
  scheduledDays: number
  learningSteps: number
  reps: number
  lapses: number
  state: number
  lastReview: Date | null
}

/** Dados de uma revisão, prontos para virar uma linha nova em `Review`. */
export type RegistroRevisao = {
  nota: Nota
  estadoAnterior: number
  intervaloDias: number
  stability: number
  difficulty: number
  revisadoEm: Date
}

const escalonador = fsrs(generatorParameters({ enable_fuzz: false }))

function paraFsrs(estado: EstadoFsrs): CardFsrs {
  return {
    due: estado.due,
    stability: estado.stability,
    difficulty: estado.difficulty,
    elapsed_days: estado.elapsedDays,
    scheduled_days: estado.scheduledDays,
    learning_steps: estado.learningSteps,
    reps: estado.reps,
    lapses: estado.lapses,
    state: estado.state as State,
    last_review: estado.lastReview ?? undefined,
  }
}

function doFsrs(card: CardFsrs): EstadoFsrs {
  return {
    due: card.due,
    stability: card.stability,
    difficulty: card.difficulty,
    elapsedDays: card.elapsed_days,
    scheduledDays: card.scheduled_days,
    learningSteps: card.learning_steps,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state,
    lastReview: card.last_review ?? null,
  }
}

/** Estado inicial de um card recém-criado: vence imediatamente. */
export function novoEstado(agora: Date = new Date()): EstadoFsrs {
  return doFsrs(createEmptyCard(agora))
}

/**
 * Aplica uma revisão e devolve o próximo estado do card junto com o registro
 * imutável do que aconteceu.
 *
 * O chamador é responsável por persistir os dois numa única transação — o
 * estado do card e o log precisam avançar juntos, ou o histórico deixa de
 * permitir re-simulação.
 */
export function agendar(
  estado: EstadoFsrs,
  nota: Nota,
  agora: Date = new Date(),
): { estado: EstadoFsrs; registro: RegistroRevisao } {
  const { card, log } = escalonador.next(paraFsrs(estado), agora, nota as Grade)
  const proximo = doFsrs(card)

  return {
    estado: proximo,
    registro: {
      nota,
      estadoAnterior: estado.state,
      intervaloDias: proximo.scheduledDays,
      stability: proximo.stability,
      difficulty: proximo.difficulty,
      revisadoEm: log.review,
    },
  }
}

/** Prévia dos intervalos de cada nota, para mostrar nos botões de revisão. */
export function previsaoIntervalos(
  estado: EstadoFsrs,
  agora: Date = new Date(),
): Record<Nota, Date> {
  const previa = escalonador.repeat(paraFsrs(estado), agora)
  return {
    1: previa[Rating.Again].card.due,
    2: previa[Rating.Hard].card.due,
    3: previa[Rating.Good].card.due,
    4: previa[Rating.Easy].card.due,
  }
}

export function estaMaduro(estado: Pick<EstadoFsrs, 'state' | 'scheduledDays'>): boolean {
  return estado.state === State.Review && estado.scheduledDays >= DIAS_PARA_MADURO
}
