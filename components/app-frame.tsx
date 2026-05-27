import Link from 'next/link'
import { ArrowUpRight, Bell, Building2, ClipboardList, LayoutDashboard, Search, Users } from 'lucide-react'

type NavItem = {
  href: string
  label: string
  description?: string
}

export function AppFrame({
  area,
  title,
  description,
  nav,
  actions,
  children,
}: {
  area: 'Admin' | 'Cliente' | 'Time'
  title: string
  description: string
  nav: NavItem[]
  actions?: React.ReactNode
  children: React.ReactNode
}) {
  const environmentLinks = [
    { href: '/admin/dashboard', label: 'Admin', icon: LayoutDashboard },
    { href: '/time/kanban', label: 'Time', icon: ClipboardList },
    { href: '/cliente/meu-painel', label: 'Cliente', icon: Building2 },
  ]

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="border-r border-[var(--line)] bg-white/80 px-5 py-6 backdrop-blur lg:sticky lg:top-0 lg:h-screen">
          <Link href="/" className="block">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--muted)]">Arke</p>
            <p className="mt-1 text-2xl font-semibold tracking-[-0.03em]">Keep</p>
          </Link>

          <div className="mt-8 rounded-lg border border-[var(--line)] bg-[var(--soft)] p-1">
            {environmentLinks.map((item) => {
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

          <nav className="mt-6 grid gap-1.5">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group rounded-lg px-3 py-3 transition hover:bg-[var(--foreground)] hover:text-white"
              >
                <span className="flex items-center justify-between gap-2 text-sm font-black">
                  {item.label}
                  <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition group-hover:opacity-100" />
                </span>
                {item.description ? (
                  <span className="mt-0.5 block text-xs text-[var(--muted)] group-hover:text-white/70">{item.description}</span>
                ) : null}
              </Link>
            ))}
          </nav>

          <div className="mt-8 rounded-lg border border-[var(--line)] bg-white p-4">
            <div className="flex items-center gap-2 text-sm font-black">
              <Users className="h-4 w-4 text-[var(--accent)]" />
              Operação conectada
            </div>
            <p className="mt-2 text-xs leading-5 text-[var(--muted)]">Admin cria e acompanha. Time executa no Kanban. Cliente vê saldo, entregas e próximos passos.</p>
          </div>
        </aside>

        <section className="min-w-0">
          <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-[var(--background)]/90 backdrop-blur">
            <div className="flex flex-col gap-4 px-5 py-5 lg:flex-row lg:items-center lg:justify-between lg:px-8">
              <div>
                <p className="text-sm font-black text-[var(--muted)]">{description}</p>
                <h1 className="mt-1 text-3xl font-semibold tracking-[-0.03em] md:text-4xl">{title}</h1>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button className="inline-flex items-center gap-2 rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm font-bold text-[var(--muted)] transition hover:text-[var(--foreground)]">
                  <Search className="h-4 w-4" />
                  Buscar
                </button>
                <button className="rounded-lg border border-[var(--line)] bg-white p-2.5 text-[var(--muted)] transition hover:text-[var(--foreground)]" aria-label="Notificações">
                  <Bell className="h-4 w-4" />
                </button>
                {actions}
              </div>
            </div>
          </header>
          <div className="px-5 py-6 lg:px-8">{children}</div>
        </section>
      </div>
    </main>
  )
}

export function Surface({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-lg border border-[var(--line)] bg-white shadow-[0_18px_50px_rgba(23,23,23,0.05)] ${className}`}>
      {children}
    </section>
  )
}

export function SectionTitle({ title, caption }: { title: string; caption?: string }) {
  return (
    <div>
      <h2 className="text-lg font-black tracking-[-0.03em]">{title}</h2>
      {caption ? <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{caption}</p> : null}
    </div>
  )
}

export function CreditMeter({ used, total }: { used: number; total: number }) {
  const percent = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0
  return (
    <div>
      <div className="h-2.5 overflow-hidden rounded-full bg-[var(--soft)]">
        <div className="h-full rounded-full bg-[var(--foreground)]" style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-2 text-xs font-bold text-[var(--muted)]">
        {used} de {total} créditos usados
      </p>
    </div>
  )
}

export function Pill({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode
  tone?: 'neutral' | 'blue' | 'green' | 'amber' | 'red'
}) {
  const tones = {
    neutral: 'bg-zinc-100 text-zinc-700',
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-green-100 text-green-700',
    amber: 'bg-amber-100 text-amber-800',
    red: 'bg-red-100 text-red-700',
  }

  return <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-black ${tones[tone]}`}>{children}</span>
}
