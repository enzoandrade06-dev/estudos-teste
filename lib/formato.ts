/** Formatação de datas/intervalos para a interface. */

const MINUTO = 60_000
const HORA = 60 * MINUTO
const DIA = 24 * HORA
const MES = 30 * DIA
const ANO = 365 * DIA

/** Distância entre duas datas em forma curta: "10 min", "3 d", "2 mes". */
export function intervaloCurto(de: Date, ate: Date): string {
  const ms = Math.max(0, ate.getTime() - de.getTime())

  if (ms < HORA) return `${Math.max(1, Math.round(ms / MINUTO))} min`
  if (ms < DIA) return `${Math.round(ms / HORA)} h`
  if (ms < MES) return `${Math.round(ms / DIA)} d`
  if (ms < ANO) return `${Math.round(ms / MES)} mes`
  return `${(ms / ANO).toFixed(1)} a`
}

export function dataCurta(data: Date): string {
  return data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

export function plural(n: number, singular: string, plural: string): string {
  return `${n} ${n === 1 ? singular : plural}`
}
