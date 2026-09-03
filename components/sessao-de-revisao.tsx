'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { revisarCard } from '@/app/acoes'
import type { CardParaRevisar } from '@/lib/db/consultas'
import { NOTAS, ROTULO_NOTA, type Nota } from '@/lib/srs/agendamento'

const ORDEM_NOTAS: Nota[] = [NOTAS.DE_NOVO, NOTAS.DIFICIL, NOTAS.BOM, NOTAS.FACIL]

const CORES_NOTA: Record<Nota, string> = {
  1: 'border-red-500/40 hover:bg-red-500/10',
  2: 'border-amber-500/40 hover:bg-amber-500/10',
  3: 'border-emerald-500/40 hover:bg-emerald-500/10',
  4: 'border-sky-500/40 hover:bg-sky-500/10',
}

export function SessaoDeRevisao({ fila }: { fila: CardParaRevisar[] }) {
  const router = useRouter()
  const [indice, setIndice] = useState(0)
  const [revelado, setRevelado] = useState(false)
  const [pendente, iniciarTransicao] = useTransition()

  const card = fila[indice]

  if (!card) {
    return (
      <section className="rounded-lg border border-borda bg-superficie p-10 text-center">
        <h2 className="text-lg font-medium">Fila concluída</h2>
        <p className="mt-2 text-sm text-suave">
          {fila.length > 0
            ? `${fila.length} ${fila.length === 1 ? 'card revisado' : 'cards revisados'} nesta sessão.`
            : 'Nada vencido no momento.'}
        </p>
      </section>
    )
  }

  function avaliar(nota: Nota) {
    if (pendente || !card) return

    iniciarTransicao(async () => {
      await revisarCard(card.id, nota)
      setRevelado(false)
      setIndice((atual) => atual + 1)
      // A fila foi montada no servidor; ao terminar, recarrega para pegar cards
      // que voltaram a vencer (um "De novo" reagenda para daqui a minutos).
      if (indice + 1 >= fila.length) router.refresh()
    })
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between text-xs text-suave">
        <span>
          {card.areaNome} · {card.trilhaTitulo} · {card.moduloTitulo}
        </span>
        <span>
          {indice + 1} de {fila.length}
        </span>
      </div>

      <div className="rounded-lg border border-borda bg-superficie">
        <p className="px-8 py-10 text-center text-xl leading-relaxed">{card.frente}</p>

        {revelado && (
          <p className="border-t border-borda px-8 py-10 text-center text-lg leading-relaxed text-suave">
            {card.verso}
          </p>
        )}
      </div>

      {revelado ? (
        <div className="grid grid-cols-4 gap-3">
          {ORDEM_NOTAS.map((nota) => (
            <button
              key={nota}
              type="button"
              disabled={pendente}
              onClick={() => avaliar(nota)}
              className={`rounded-md border bg-superficie px-3 py-3 text-sm transition disabled:opacity-40 ${CORES_NOTA[nota]}`}
            >
              <span className="block font-medium">{ROTULO_NOTA[nota]}</span>
              <span className="block text-xs text-suave">{card.previsao[nota]}</span>
            </button>
          ))}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setRevelado(true)}
          className="w-full rounded-md border border-borda bg-superficie px-4 py-3 text-sm transition hover:border-acento"
        >
          Mostrar resposta
        </button>
      )}

      <p className="text-center text-xs text-suave">
        Tente lembrar antes de revelar — é a tentativa que fixa, não a leitura.
      </p>
    </section>
  )
}
