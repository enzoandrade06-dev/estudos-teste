import Link from 'next/link'
import { SessaoDeRevisao } from '@/components/sessao-de-revisao'
import { filaDoDia } from '@/lib/db/consultas'

export const dynamic = 'force-dynamic'

/** Teto por sessão: fila longa demais é o que faz o hábito quebrar. */
const LIMITE_POR_SESSAO = 50

export default async function Revisar({
  searchParams,
}: {
  searchParams: Promise<{ modulo?: string }>
}) {
  const { modulo } = await searchParams
  const fila = await filaDoDia({ limite: LIMITE_POR_SESSAO, moduloId: modulo })

  return (
    <div className="space-y-8">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Revisar</h1>
        {modulo && (
          <Link href="/revisar" className="text-xs text-suave hover:text-texto">
            sair do modo focar
          </Link>
        )}
      </div>

      {fila.length === 0 ? (
        <section className="rounded-lg border border-borda bg-superficie p-10 text-center">
          <h2 className="text-lg font-medium">Nada vencido</h2>
          <p className="mt-2 text-sm text-suave">
            Revisar antes da hora é desperdício — o intervalo é calculado para você lembrar no
            limite do esquecimento.
          </p>
          <Link
            href="/trilhas"
            className="mt-6 inline-block rounded-md border border-borda px-5 py-2.5 text-sm transition hover:border-acento"
          >
            Estudar algo novo
          </Link>
        </section>
      ) : (
        <SessaoDeRevisao fila={fila} />
      )}
    </div>
  )
}
