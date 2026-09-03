import Link from 'next/link'
import { criarArea, criarModulo, criarTrilha } from '@/app/acoes'
import { AreaDeTexto, Botao, Campo, Entrada, Selecao, SeloPrioridade } from '@/components/campos'
import { PRIORIDADES } from '@/lib/estudo/prioridade'
import { arvoreDeTrilhas } from '@/lib/db/consultas'
import { plural } from '@/lib/formato'

export const dynamic = 'force-dynamic'

export default async function Trilhas() {
  const areas = await arvoreDeTrilhas()
  const trilhas = areas.flatMap((area) =>
    area.trilhas.map((trilha) => ({ ...trilha, areaNome: area.nome })),
  )

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Trilhas</h1>
        <p className="mt-2 text-sm text-suave">
          Uma trilha precisa de objetivo. Sem critério de conclusão, ela vira lista infinita — que
          é justamente o problema que viemos resolver.
        </p>
      </div>

      {areas.length === 0 ? (
        <p className="rounded-lg border border-borda bg-superficie p-8 text-center text-sm text-suave">
          Nenhuma área ainda. Crie a primeira abaixo.
        </p>
      ) : (
        <div className="space-y-8">
          {areas.map((area) => (
            <section key={area.id} className="space-y-4">
              <h2 className="text-sm font-medium tracking-wide text-suave uppercase">
                {area.nome}
              </h2>

              {area.trilhas.length === 0 && (
                <p className="text-sm text-suave/70">Sem trilhas nesta área.</p>
              )}

              {area.trilhas.map((trilha) => (
                <article
                  key={trilha.id}
                  className="rounded-lg border border-borda bg-superficie p-5"
                >
                  <h3 className="font-medium">{trilha.titulo}</h3>
                  <p className="mt-1 text-sm text-suave">{trilha.objetivo}</p>

                  <ul className="mt-4 divide-y divide-borda/60 border-t border-borda/60">
                    {trilha.modulos.map((modulo) => (
                      <li key={modulo.id} className="flex items-center gap-3 py-2.5">
                        <SeloPrioridade prioridade={modulo.prioridade} />
                        <Link
                          href={`/modulos/${modulo.id}`}
                          className="flex-1 text-sm hover:text-acento"
                        >
                          {modulo.titulo}
                        </Link>
                        <span className="text-xs text-suave">
                          {plural(modulo._count.cards, 'card', 'cards')}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {trilha.modulos.length === 0 && (
                    <p className="mt-4 text-sm text-suave/70">
                      Sem módulos. Quebre o material em unidades pequenas usando o formulário
                      abaixo.
                    </p>
                  )}
                </article>
              ))}
            </section>
          ))}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <form action={criarArea} className="space-y-3 rounded-lg border border-borda p-5">
          <h2 className="text-sm font-medium">Nova área</h2>
          <Campo rotulo="Nome">
            <Entrada name="nome" required placeholder="Programação" />
          </Campo>
          <Botao type="submit">Criar área</Botao>
        </form>

        <form action={criarTrilha} className="space-y-3 rounded-lg border border-borda p-5">
          <h2 className="text-sm font-medium">Nova trilha</h2>
          <Campo rotulo="Área">
            <Selecao name="areaId" required disabled={areas.length === 0}>
              {areas.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.nome}
                </option>
              ))}
            </Selecao>
          </Campo>
          <Campo rotulo="Título">
            <Entrada name="titulo" required placeholder="Fundamentos de redes" />
          </Campo>
          <Campo rotulo="Objetivo" dica="O que você vai conseguir fazer ao terminar.">
            <AreaDeTexto name="objetivo" required rows={2} placeholder="Diagnosticar uma falha de conectividade sozinho" />
          </Campo>
          <Campo rotulo="Prazo (opcional)">
            <Entrada type="date" name="prazo" />
          </Campo>
          <Botao type="submit">Criar trilha</Botao>
        </form>

        <form action={criarModulo} className="space-y-3 rounded-lg border border-borda p-5">
          <h2 className="text-sm font-medium">Novo módulo</h2>
          <Campo rotulo="Trilha">
            <Selecao name="trilhaId" required disabled={trilhas.length === 0}>
              {trilhas.map((trilha) => (
                <option key={trilha.id} value={trilha.id}>
                  {trilha.areaNome} · {trilha.titulo}
                </option>
              ))}
            </Selecao>
          </Campo>
          <Campo rotulo="Título" dica="Pequeno e autocontido — se não couber numa frase, quebre em dois.">
            <Entrada name="titulo" required placeholder="Modelo OSI" />
          </Campo>
          <Campo rotulo="Prioridade">
            <Selecao name="prioridade" defaultValue="importante">
              {PRIORIDADES.map((prioridade) => (
                <option key={prioridade} value={prioridade}>
                  {prioridade}
                </option>
              ))}
            </Selecao>
          </Campo>
          <Botao type="submit">Criar módulo</Botao>
        </form>
      </div>
    </div>
  )
}
