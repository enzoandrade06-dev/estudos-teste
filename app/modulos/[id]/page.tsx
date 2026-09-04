import Link from 'next/link'
import { notFound } from 'next/navigation'
import { criarCard, excluirCard } from '@/app/acoes'
import { AreaDeTexto, Botao, Campo, SeloPrioridade } from '@/components/campos'
import { moduloComCards } from '@/lib/db/consultas'
import { ROTULO_ESTADO } from '@/lib/srs/agendamento'
import { dataCurta, intervaloCurto, plural } from '@/lib/formato'

export const dynamic = 'force-dynamic'

export default async function Modulo({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const modulo = await moduloComCards(id)
  if (!modulo) notFound()

  const agora = new Date()
  const vencidos = modulo.cards.filter((card) => card.due <= agora).length

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs text-suave">
          <Link href="/trilhas" className="hover:text-texto">
            {modulo.trilha.area.nome}
          </Link>{' '}
          · {modulo.trilha.titulo}
        </p>
        <div className="mt-2 flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{modulo.titulo}</h1>
          <SeloPrioridade prioridade={modulo.prioridade} />
        </div>
        <p className="mt-2 text-sm text-suave">
          {plural(modulo.cards.length, 'card', 'cards')}
          {vencidos > 0 && ` · ${vencidos} para revisar agora`}
        </p>

        {vencidos > 0 && (
          <Link
            href={`/revisar?modulo=${modulo.id}`}
            className="mt-4 inline-block rounded-md border border-acento px-5 py-2.5 text-sm font-medium transition hover:bg-acento/10"
          >
            Focar neste módulo
          </Link>
        )}
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-suave">Cards</h2>

        {modulo.cards.length === 0 ? (
          <p className="rounded-lg border border-borda bg-superficie p-8 text-center text-sm text-suave">
            Nenhum card ainda. Formular a pergunta é parte do aprendizado — é aí que as lacunas
            aparecem.
          </p>
        ) : (
          <ul className="space-y-2">
            {modulo.cards.map((card) => (
              <li
                key={card.id}
                className="rounded-lg border border-borda bg-superficie px-5 py-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">{card.frente}</p>
                    <p className="mt-1 text-sm text-suave">{card.verso}</p>
                  </div>
                  <form action={excluirCard}>
                    <input type="hidden" name="id" value={card.id} />
                    <button
                      type="submit"
                      className="text-xs text-suave/60 transition hover:text-red-400"
                    >
                      excluir
                    </button>
                  </form>
                </div>
                <p className="mt-3 text-xs text-suave/70">
                  {ROTULO_ESTADO[card.state] ?? 'desconhecido'} ·{' '}
                  {card.due <= agora
                    ? 'vencido'
                    : `em ${intervaloCurto(agora, card.due)} (${dataCurta(card.due)})`}
                  {card.reps > 0 && ` · ${plural(card.reps, 'revisão', 'revisões')}`}
                  {card.lapses > 0 && ` · ${plural(card.lapses, 'lapso', 'lapsos')}`}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <form action={criarCard} className="space-y-3 rounded-lg border border-borda p-5">
        <h2 className="text-sm font-medium">Novo card</h2>
        <input type="hidden" name="moduloId" value={modulo.id} />
        <Campo rotulo="Pergunta" dica="Uma ideia por card. Se precisa de 'e', são dois cards.">
          <AreaDeTexto name="frente" required rows={2} />
        </Campo>
        <Campo rotulo="Resposta">
          <AreaDeTexto name="verso" required rows={2} />
        </Campo>
        <Botao type="submit">Criar card</Botao>
      </form>
    </div>
  )
}
