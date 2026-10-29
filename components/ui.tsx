// @ts-nocheck
import Link from 'next/link'
import { Building2, ClipboardList, LayoutDashboard } from 'lucide-react'
import type { StatusEntrega } from '@/lib/types'

export function Shell({
  area,
  title,
  nav,
  children,
}: {
  area: string
  title: string
  nav: Array<{ href: string; label: string }>
  children: React.ReactNode
}) {
  const environments = [
    { href: '/admin/dashboard', label: 'Admin', icon: LayoutDashboard },
    { href: '/time/kanban', label: 'Time', icon: ClipboardList },
    { href: '/cliente/meu-painel', label: 'Cliente', icon: Building2 },
  ]

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="border-r border-[var(--line)] bg-white/80 p-5 backdrop-blur lg:sticky lg:top-0 lg:h-screen">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--muted)]">Arke Keep</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">{area}</h1>

          <div className="mt-6 rounded-lg border border-[var(--line)] bg-[var(--soft)] p-1">
            {environments.map((item) => {
              const Icon = item.icon
              const active = item.label === area
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-black transition ${
                    active ? 'bg-white text-[var(--foreground)] shadow-sm' : 'text-[var(--muted)] hover:text-[var(--foreground)]'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </div>

          <nav className="mt-8 grid gap-2">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2.5 text-sm font-bold text-[var(--muted)] transition hover:bg-[var(--foreground)] hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <section className="min-w-0 p-5 lg:p-8">
          <header className="mb-6 flex flex-col justify-between gap-4 border-b border-[var(--line)] pb-6 md:flex-row md:items-start">
            <div>
              <p className="text-sm font-extrabold text-[var(--muted)]">Operação Keep</p>
              <h2 className="mt-1 text-3xl font-semibold tracking-[-0.03em] md:text-4xl">{title}</h2>
            </div>
          </header>
          {children}
        </section>
      </div>
    </main>
  )
}

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-lg border border-[var(--line)] bg-white shadow-[0_18px_50px_rgba(26,26,26,0.05)] ${className}`}>
      {children}
    </section>
  )
}

export function Progress({ used, total }: { used: number; total: number }) {
  const width = total ? Math.min(100, Math.round((used / total) * 100)) : 0
  return (
    <div className="h-3 overflow-hidden rounded-full bg-[var(--soft)]">
      <div className="h-full rounded-full bg-[var(--foreground)] transition-all" style={{ width: `${width}%` }} />
    </div>
  )
}

const statusClass: Record<StatusEntrega, string> = {
  pendente: 'bg-zinc-100 text-zinc-700',
  em_andamento: 'bg-blue-100 text-blue-700',
  entregue: 'bg-green-100 text-green-700',
  aprovado: 'bg-emerald-200 text-emerald-900',
}

const statusLabel: Record<StatusEntrega, string> = {
  pendente: 'Pendente',
  em_andamento: 'Em andamento',
  entregue: 'Entregue',
  aprovado: 'Aprovado',
}

export function Badge({ status }: { status: StatusEntrega }) {
  return <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-black ${statusClass[status]}`}>{statusLabel[status]}</span>
}

export function Currency({ value }: { value: number }) {
  return <>{value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</>
}
