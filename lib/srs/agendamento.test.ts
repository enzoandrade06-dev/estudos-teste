import { describe, expect, it } from 'vitest'
import { agendar, estaMaduro, novoEstado, previsaoIntervalos, NOTAS } from './agendamento'

const AGORA = new Date('2026-01-01T09:00:00Z')

function dias(base: Date, n: number): Date {
  return new Date(base.getTime() + n * 86_400_000)
}

/** Revisa sempre com "Bom", avançando o relógio até a data de vencimento. */
function revisarBemAte(vezes: number) {
  let estado = novoEstado(AGORA)
  let relogio = AGORA
  for (let i = 0; i < vezes; i += 1) {
    relogio = estado.due > relogio ? estado.due : relogio
    estado = agendar(estado, NOTAS.BOM, relogio).estado
  }
  return estado
}

describe('novoEstado', () => {
  it('cria um card que já vence de imediato, para poder ser estudado hoje', () => {
    const estado = novoEstado(AGORA)
    expect(estado.state).toBe(0)
    expect(estado.reps).toBe(0)
    expect(estado.lapses).toBe(0)
    expect(estado.lastReview).toBeNull()
    expect(estado.due.getTime()).toBeLessThanOrEqual(AGORA.getTime())
  })
})

describe('agendar', () => {
  it('tira o card do estado "novo" e agenda para o futuro', () => {
    const { estado, registro } = agendar(novoEstado(AGORA), NOTAS.BOM, AGORA)

    expect(estado.state).not.toBe(0)
    expect(estado.reps).toBe(1)
    expect(estado.due.getTime()).toBeGreaterThan(AGORA.getTime())
    expect(estado.lastReview).toEqual(AGORA)
    expect(registro.estadoAnterior).toBe(0)
    expect(registro.nota).toBe(NOTAS.BOM)
  })

  it('preserva o estado anterior no registro, e não o novo', () => {
    const emRevisao = revisarBemAte(4)
    expect(emRevisao.state).toBe(2)

    const { estado, registro } = agendar(emRevisao, NOTAS.DE_NOVO, emRevisao.due)

    expect(registro.estadoAnterior).toBe(2)
    expect(estado.state).toBe(3) // Relearning
  })

  it('conta lapso quando um card em revisão é esquecido', () => {
    const emRevisao = revisarBemAte(4)
    const { estado } = agendar(emRevisao, NOTAS.DE_NOVO, emRevisao.due)

    expect(estado.lapses).toBe(emRevisao.lapses + 1)
  })

  it('não conta lapso quando o card ainda está em aprendizado', () => {
    const novo = agendar(novoEstado(AGORA), NOTAS.BOM, AGORA).estado
    expect(novo.state).toBe(1) // Learning

    const { estado } = agendar(novo, NOTAS.DE_NOVO, novo.due)
    expect(estado.lapses).toBe(0)
  })

  it('alonga o intervalo a cada revisão bem-sucedida', () => {
    const intervalos: number[] = []
    let estado = novoEstado(AGORA)
    let relogio = AGORA

    for (let i = 0; i < 6; i += 1) {
      relogio = estado.due > relogio ? estado.due : relogio
      const passo = agendar(estado, NOTAS.BOM, relogio)
      estado = passo.estado
      intervalos.push(estado.due.getTime() - relogio.getTime())
    }

    const emRevisao = intervalos.slice(2)
    for (let i = 1; i < emRevisao.length; i += 1) {
      expect(emRevisao[i]).toBeGreaterThan(emRevisao[i - 1])
    }
  })

  it('ordena os intervalos das quatro notas do mais curto ao mais longo', () => {
    const emRevisao = revisarBemAte(4)
    const notas = [NOTAS.DE_NOVO, NOTAS.DIFICIL, NOTAS.BOM, NOTAS.FACIL] as const

    const devidos = notas.map((nota) => agendar(emRevisao, nota, emRevisao.due).estado.due.getTime())

    for (let i = 1; i < devidos.length; i += 1) {
      expect(devidos[i]).toBeGreaterThan(devidos[i - 1])
    }
  })

  it('registra o intervalo em dias coerente com a data de vencimento', () => {
    const emRevisao = revisarBemAte(4)
    const { estado, registro } = agendar(emRevisao, NOTAS.BOM, emRevisao.due)

    const diasAteVencer = Math.round((estado.due.getTime() - emRevisao.due.getTime()) / 86_400_000)
    expect(registro.intervaloDias).toBe(diasAteVencer)
  })

  it('é determinístico — fuzz desligado, mesma entrada, mesma saída', () => {
    const estado = novoEstado(AGORA)
    const a = agendar(estado, NOTAS.BOM, AGORA).estado
    const b = agendar(estado, NOTAS.BOM, AGORA).estado

    expect(a).toEqual(b)
  })
})

describe('previsaoIntervalos', () => {
  it('devolve uma data para cada uma das quatro notas', () => {
    const previsao = previsaoIntervalos(novoEstado(AGORA), AGORA)

    expect(Object.keys(previsao)).toEqual(['1', '2', '3', '4'])
    for (const data of Object.values(previsao)) {
      expect(data.getTime()).toBeGreaterThan(AGORA.getTime())
    }
  })
})

describe('estaMaduro', () => {
  it('exige estar em revisão e ter intervalo de pelo menos 21 dias', () => {
    expect(estaMaduro({ state: 2, scheduledDays: 21 })).toBe(true)
    expect(estaMaduro({ state: 2, scheduledDays: 20 })).toBe(false)
    expect(estaMaduro({ state: 1, scheduledDays: 60 })).toBe(false)
    expect(estaMaduro({ state: 3, scheduledDays: 60 })).toBe(false)
  })

  it('reconhece como maduro um card revisado com sucesso por tempo suficiente', () => {
    const estado = revisarBemAte(8)
    expect(estado.scheduledDays).toBeGreaterThanOrEqual(21)
    expect(estaMaduro(estado)).toBe(true)
  })

  it('deixa de considerar maduro um card que foi esquecido', () => {
    const maduro = revisarBemAte(8)
    const { estado } = agendar(maduro, NOTAS.DE_NOVO, dias(maduro.due, 1))
    expect(estaMaduro(estado)).toBe(false)
  })
})
