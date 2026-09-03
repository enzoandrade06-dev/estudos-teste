import Link from 'next/link'
import { resumo } from '@/lib/db/consultas'
import { dataCurta, intervaloCurto, plural } from '@/lib/formato'

export const dynamic = 'force-dynamic'

function Indicador({ valor, rotulo }: { valor: string | number; rotulo: string }) {
  return (
    <div className="rounded-lg border border-borda bg-superficie px-5 py-4">
      <div className="text-2xl font-semibold tabular-nums">{valor}</div>
      <div className="mt-1 text-xs text-suave">{rotulo}</div>
    </div>
  )
}

export default async function Inicio() {
  const dados = await resumo()
  const agora = new Date()

  return (
    <div className="space-y-10">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">Hoje</h1>
        <p className="mt-2 text-sm text-suave">
          {dados.vencidos > 0
            ? `${plural(dados.vencidos, 'card vencido', 'cards vencidos')} esperando revisão.`
            : dados.total === 0
              ? 'Nenhum card ainda. Comece criando uma trilha.'
              : 'Fila zerada. Nada a revisar agora.'}
        </p>

        <div className="mt-6 flex gap-3">
          {dados.vencidos > 0 && (
            <Link
              href="/revisar"
              className="rounded-md border border-acento px-5 py-2.5 text-sm font-medium transition hover:bg-acento/10"
            >
              Revisar {dados.vencidos}
            </Link>
          )}
          <Link
            href="/trilhas"
            className="rounded-md border border-borda px-5 py-2.5 text-sm transition hover:border-acento"
          >
            {dados.total === 0 ? 'Criar primeira trilha' : 'Ver trilhas'}
          </Link>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-medium text-suave">Panorama</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Indicador valor={dados.total} rotulo="cards no total" />
          <Indicador valor={dados.novos} rotulo="ainda não estudados" />
          <Indicador valor={dados.maduros} rotulo="maduros (21+ dias)" />
          <Indicador valor={dados.revisadosHoje} rotulo="revisados hoje" />
          <Indicador valor={dados.trilhas} rotulo={plural(dados.trilhas, 'trilha', 'trilhas')} />
          <Indicador valor={dados.modulos} rotulo={plural(dados.modulos, 'módulo', 'módulos')} />
          <Indicador
            valor={dados.proximoVencimento ? intervaloCurto(agora, dados.proximoVencimento) : '—'}
            rotulo={
              dados.proximoVencimento
                ? `próxima revisão · ${dataCurta(dados.proximoVencimento)}`
                : 'próxima revisão'
            }
          />
        </div>
      </section>

      <section className="rounded-lg border border-borda/60 px-5 py-4 text-xs leading-relaxed text-suave">
        <strong className="text-texto">Onde estamos.</strong> Esta é a fatia vertical da Fase 2:
        criar módulo, criar card e revisar com agendamento FSRS. A decomposição de material
        volumoso (caixa de entrada, triagem, pré-requisitos) e as notas em markdown entram nas
        fases 3 e 4 — ver <code>docs/PLANO.md</code>.
      </section>
    </div>
  )
}
