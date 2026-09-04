import { describe, expect, it } from 'vitest'
import { montarFila, type CardNaFila } from './fila'

const AGORA = new Date('2026-01-10T09:00:00Z')

function card(
  id: string,
  moduloId: string,
  minutosAtras: number,
  prioridadeModulo = 'importante',
): CardNaFila {
  return {
    id,
    moduloId,
    due: new Date(AGORA.getTime() - minutosAtras * 60_000),
    prioridadeModulo,
  }
}

describe('montarFila', () => {
  it('deixa de fora os cards que ainda não venceram', () => {
    const futuro: CardNaFila = {
      id: 'futuro',
      moduloId: 'm1',
      due: new Date(AGORA.getTime() + 60_000),
      prioridadeModulo: 'importante',
    }
    const fila = montarFila([card('a', 'm1', 10), futuro], { agora: AGORA })

    expect(fila.map((c) => c.id)).toEqual(['a'])
  })

  it('inclui o card que vence exatamente agora', () => {
    const noPonto: CardNaFila = {
      id: 'agora',
      moduloId: 'm1',
      due: AGORA,
      prioridadeModulo: 'importante',
    }
    expect(montarFila([noPonto], { agora: AGORA })).toHaveLength(1)
  })

  it('intercala módulos em vez de agrupar por assunto', () => {
    const cards = [
      card('a1', 'm1', 50),
      card('a2', 'm1', 40),
      card('a3', 'm1', 30),
      card('b1', 'm2', 45),
      card('b2', 'm2', 35),
    ]
    const fila = montarFila(cards, { agora: AGORA })

    expect(fila.map((c) => c.moduloId)).toEqual(['m1', 'm2', 'm1', 'm2', 'm1'])
  })

  it('não perde cards quando um módulo tem mais que os outros', () => {
    const cards = [
      card('a1', 'm1', 50),
      card('a2', 'm1', 40),
      card('a3', 'm1', 30),
      card('b1', 'm2', 45),
    ]
    const fila = montarFila(cards, { agora: AGORA })

    expect(fila).toHaveLength(4)
    expect(new Set(fila.map((c) => c.id))).toEqual(new Set(['a1', 'a2', 'a3', 'b1']))
  })

  it('abre o rodízio pelo módulo mais prioritário', () => {
    const cards = [
      card('c1', 'complementar', 90, 'complementar'),
      card('e1', 'essencial', 10, 'essencial'),
      card('i1', 'importante', 50, 'importante'),
    ]
    const fila = montarFila(cards, { agora: AGORA })

    expect(fila.map((c) => c.moduloId)).toEqual(['essencial', 'importante', 'complementar'])
  })

  it('desempata prioridade igual pelo card mais atrasado', () => {
    const fila = montarFila([card('novo', 'm2', 5), card('velho', 'm1', 500)], { agora: AGORA })

    expect(fila.map((c) => c.id)).toEqual(['velho', 'novo'])
  })

  it('dentro de um módulo, começa pelo mais atrasado', () => {
    const fila = montarFila([card('recente', 'm1', 5), card('antigo', 'm1', 500)], { agora: AGORA })

    expect(fila.map((c) => c.id)).toEqual(['antigo', 'recente'])
  })

  it('respeita o teto da sessão preservando a intercalação', () => {
    const cards = [
      card('a1', 'm1', 50),
      card('a2', 'm1', 40),
      card('b1', 'm2', 45),
      card('b2', 'm2', 35),
    ]
    const fila = montarFila(cards, { agora: AGORA, limite: 3 })

    expect(fila).toHaveLength(3)
    expect(fila.map((c) => c.moduloId)).toEqual(['m1', 'm2', 'm1'])
  })

  it('restringe a um módulo no modo focar', () => {
    const cards = [card('a1', 'm1', 50), card('b1', 'm2', 45)]
    const fila = montarFila(cards, { agora: AGORA, moduloId: 'm2' })

    expect(fila.map((c) => c.id)).toEqual(['b1'])
  })

  it('devolve fila vazia quando não há nada vencido', () => {
    expect(montarFila([], { agora: AGORA })).toEqual([])
  })

  it('trata prioridade desconhecida como intermediária, sem quebrar', () => {
    const cards = [
      card('x', 'lixo', 10, 'valor-invalido'),
      card('e', 'essencial', 5, 'essencial'),
      card('c', 'complementar', 999, 'complementar'),
    ]
    const fila = montarFila(cards, { agora: AGORA })

    expect(fila.map((c) => c.id)).toEqual(['e', 'x', 'c'])
  })

  it('é estável — a mesma entrada produz a mesma fila', () => {
    const cards = [card('a1', 'm1', 50), card('b1', 'm2', 50), card('a2', 'm1', 40)]

    expect(montarFila(cards, { agora: AGORA })).toEqual(montarFila(cards, { agora: AGORA }))
  })
})
