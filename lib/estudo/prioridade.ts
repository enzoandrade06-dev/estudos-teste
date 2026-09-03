/**
 * Priorização de módulos.
 *
 * Quando há mais material do que tempo, tratar tudo como igualmente importante
 * é o mesmo que não priorizar (PLANO.md §3.1). Todo módulo carrega um destes
 * três níveis, e a ordem de estudo e de revisão os respeita.
 */
export const PRIORIDADES = ['essencial', 'importante', 'complementar'] as const

export type Prioridade = (typeof PRIORIDADES)[number]

/** Menor = estudado/revisado primeiro. */
const PESO: Record<Prioridade, number> = {
  essencial: 0,
  importante: 1,
  complementar: 2,
}

export function ehPrioridade(valor: string): valor is Prioridade {
  return (PRIORIDADES as readonly string[]).includes(valor)
}

/**
 * Normaliza o valor vindo do banco. SQLite guarda a prioridade como texto livre
 * (Prisma não suporta enum nesse provider), então tratamos valor inesperado
 * como o nível intermediário em vez de quebrar a fila.
 */
export function comoPrioridade(valor: string): Prioridade {
  return ehPrioridade(valor) ? valor : 'importante'
}

export function pesoPrioridade(valor: string): number {
  return PESO[comoPrioridade(valor)]
}
