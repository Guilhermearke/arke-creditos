// @ts-nocheck
import Link from 'next/link'
import { ArrowRight, BriefcaseBusiness, KanbanSquare, WalletCards } from 'lucide-react'

const areas = [
  {
    href: '/admin/dashboard',
    title: 'Admin',
    description: 'Operação, clientes, créditos, demandas e time.',
    icon: BriefcaseBusiness,
  },
  {
    href: '/cliente/painel',
    title: 'Cliente',
    description: 'Saldo, entregas, links e histórico do contrato.',
    icon: WalletCards,
  },
  {
    href: '/time/kanban',
    title: 'Time',
    description: 'Kanban de produção com briefing e status.',
    icon: KanbanSquare,
  },
]

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#F7F5F0] px-5 py-10 text-[#171717]">
      <section className="mx-auto flex min-h-[calc(100vh-80px)] max-w-5xl flex-col justify-center">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[#757168]">Arke Keep</p>
        <h1 className="mt-4 max-w-3xl text-5xl font-semibold tracking-[-0.07em] md:text-7xl">
          Sistema de créditos e produção
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-[#5F5B52]">
          Ambientes separados para gestão da operação, acompanhamento do cliente e execução do time.
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {areas.map((area) => {
            const Icon = area.icon
            return (
              <Link
                key={area.href}
                href={area.href}
                className="group rounded-lg border border-[#E3DED2] bg-white p-5 shadow-[0_18px_50px_rgba(23,23,23,0.06)] transition hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(23,23,23,0.11)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <Icon className="h-6 w-6 text-[#757168]" />
                  <ArrowRight className="h-5 w-5 opacity-0 transition group-hover:translate-x-1 group-hover:opacity-100" />
                </div>
                <h2 className="mt-8 text-2xl font-black tracking-[-0.04em]">{area.title}</h2>
                <p className="mt-2 text-sm leading-6 text-[#757168]">{area.description}</p>
              </Link>
            )
          })}
        </div>

        <Link href="/auth/login" className="mt-8 w-fit rounded-lg bg-[#171717] px-5 py-3 text-sm font-black text-white">
          Ir para login
        </Link>
      </section>
    </main>
  )
}
