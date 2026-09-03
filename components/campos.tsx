/** Peças de formulário compartilhadas — mantêm a aparência consistente sem uma lib de UI. */

export function Campo({
  rotulo,
  children,
  dica,
}: {
  rotulo: string
  children: React.ReactNode
  dica?: string
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-suave">{rotulo}</span>
      {children}
      {dica && <span className="block text-xs text-suave/70">{dica}</span>}
    </label>
  )
}

const ESTILO_ENTRADA =
  'w-full rounded-md border border-borda bg-fundo px-3 py-2 text-sm outline-none transition focus:border-acento'

export function Entrada(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={ESTILO_ENTRADA} />
}

export function AreaDeTexto(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${ESTILO_ENTRADA} resize-y`} />
}

export function Selecao(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={ESTILO_ENTRADA} />
}

export function Botao({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className="rounded-md border border-acento px-4 py-2 text-sm font-medium transition hover:bg-acento/10"
    >
      {children}
    </button>
  )
}

const CORES_PRIORIDADE: Record<string, string> = {
  essencial: 'border-emerald-500/40 text-emerald-300',
  importante: 'border-borda text-suave',
  complementar: 'border-borda/60 text-suave/60',
}

export function SeloPrioridade({ prioridade }: { prioridade: string }) {
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide ${
        CORES_PRIORIDADE[prioridade] ?? CORES_PRIORIDADE.importante
      }`}
    >
      {prioridade}
    </span>
  )
}
