import type { Metadata } from 'next'
import Link from 'next/link'
import './globals.css'

export const metadata: Metadata = {
  title: 'Plataforma de Estudos',
  description: 'Transforma volume de material em entendimento e retenção.',
}

const NAVEGACAO = [
  { href: '/', rotulo: 'Início' },
  { href: '/revisar', rotulo: 'Revisar' },
  { href: '/trilhas', rotulo: 'Trilhas' },
] as const

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen antialiased">
        <header className="border-b border-borda">
          <nav className="mx-auto flex max-w-4xl items-center gap-6 px-6 py-4">
            <Link href="/" className="font-semibold tracking-tight">
              Estudos
            </Link>
            <div className="flex gap-4 text-sm text-suave">
              {NAVEGACAO.map((item) => (
                <Link key={item.href} href={item.href} className="hover:text-texto">
                  {item.rotulo}
                </Link>
              ))}
            </div>
          </nav>
        </header>
        <main className="mx-auto max-w-4xl px-6 py-10">{children}</main>
      </body>
    </html>
  )
}
