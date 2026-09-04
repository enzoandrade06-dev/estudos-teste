/**
 * Construção da fila diária de revisão.
 *
 * Duas regras do plano moldam esta função:
 *
 * - **Intercalação** (§3.4): a fila mistura cards de módulos diferentes em vez
 *   de agrupar por assunto. Fazemos isso por rodízio entre os módulos.
 * - **Priorização** (§3.1): quando não dá para revisar tudo, módulos essenciais
 *   entram na frente dos complementares.
 *
 * A ordenação é determinística de propósito — fila reproduzível é fila testável,
 * e o usuário que fecha e reabre o app espera continuar de onde parou.
 */
import { pesoPrioridade } from '@/lib/estudo/prioridade'

export type CardNaFila = {
  id: string
  moduloId: string
  due: Date
  prioridadeModulo: string
}

export type OpcoesFila = {
  agora?: Date
  /** Teto de cards na sessão. `undefined` = sem teto. */
  limite?: number
  /** Restringe a um módulo — o modo "focar", que não é o padrão (§3.4). */
  moduloId?: string
}

export function montarFila<T extends CardNaFila>(cards: readonly T[], opcoes: OpcoesFila = {}): T[] {
  const { agora = new Date(), limite, moduloId } = opcoes

  const vencidos = cards.filter(
    (card) => card.due.getTime() <= agora.getTime() && (!moduloId || card.moduloId === moduloId),
  )

  // Agrupa por módulo, cada grupo ordenado do mais atrasado para o menos.
  const grupos = new Map<string, T[]>()
  for (const card of vencidos) {
    const grupo = grupos.get(card.moduloId)
    if (grupo) grupo.push(card)
    else grupos.set(card.moduloId, [card])
  }
  for (const grupo of grupos.values()) {
    grupo.sort((a, b) => a.due.getTime() - b.due.getTime() || a.id.localeCompare(b.id))
  }

  // Módulos mais prioritários abrem o rodízio; empate resolve pelo card mais atrasado.
  const ordemModulos = [...grupos.entries()].sort(([idA, a], [idB, b]) => {
    const porPrioridade = pesoPrioridade(a[0].prioridadeModulo) - pesoPrioridade(b[0].prioridadeModulo)
    if (porPrioridade !== 0) return porPrioridade
    return a[0].due.getTime() - b[0].due.getTime() || idA.localeCompare(idB)
  })

  // Rodízio: um card de cada módulo por rodada, até esgotar.
  const fila: T[] = []
  const teto = limite ?? vencidos.length
  let rodada = 0
  while (fila.length < teto) {
    let avancou = false
    for (const [, grupo] of ordemModulos) {
      const card = grupo[rodada]
      if (!card) continue
      avancou = true
      fila.push(card)
      if (fila.length === teto) return fila
    }
    if (!avancou) break
    rodada += 1
  }

  return fila
}
