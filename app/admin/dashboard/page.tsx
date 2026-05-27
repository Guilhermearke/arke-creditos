import Link from 'next/link'
import { AlertTriangle, Banknote, ClipboardList, Users } from 'lucide-react'
import { Card, Currency, Progress, Shell } from '@/components/ui'
import { getAdminDashboardData } from '@/lib/app-data'

const nav = [
  { href: '/admin/dashboard', label: 'Dashboard' },
  { href: '/admin/clientes', label: 'Clientes' },
  { href: '/admin/clientes/novo', label: 'Novo cliente' },
  { href: '/admin/entregas', label: 'Entregas' },
  { href: '/admin/demandas/nova', label: 'Nova demanda' },
  { href: '/admin/time', label: 'Time' },
]

export default async function DashboardPage() {
  const { clientes, ciclos, entregas, contratos } = await getAdminDashboardData()
  const mrr = contratos.reduce((sum, contrato) => sum + Number(contrato.valor_mensal ?? 0), 0)
  const consumed = ciclos.reduce((sum, ciclo) => sum + Number(ciclo.creditos_usados ?? 0), 0)
  const activeDeliveries = entregas.filter((entrega) => ['pendente', 'em_andamento'].includes(entrega.status))

  return (
    <Shell area="Admin" title="Operação de créditos" nav={nav}>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric icon={<Banknote />} label="MRR total" value={<Currency value={mrr} />} />
        <Metric icon={<Users />} label="Clientes ativos" value={clientes.length} />
        <Metric icon={<ClipboardList />} label="Créditos consumidos" value={consumed} />
        <Metric icon={<AlertTriangle />} label="Entregas abertas" value={activeDeliveries.length} />
      </section>

      <section className="mt-6 grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
        <Card>
          <div className="flex items-center justify-between gap-3 border-b border-[#E7E1D7] p-5">
            <div>
              <h3 className="text-lg font-semibold tracking-[-0.03em]">Clientes e saldos</h3>
              <p className="text-sm text-[#6F6D66]">Alertas quando o saldo fica abaixo de 20%.</p>
            </div>
            <Link className="rounded-lg bg-[#1A1A1A] px-4 py-2 text-sm font-bold text-white" href="/admin/clientes/novo">
              Novo cliente
            </Link>
          </div>
          <div>
            {clientes.map((cliente) => {
              const ciclo = ciclos.find((item) => item.cliente_id === cliente.id)
              const total = Number(ciclo?.creditos_disponiveis ?? 0)
              const used = Number(ciclo?.creditos_usados ?? 0)
              const remaining = Number(ciclo?.creditos_restantes ?? total)
              const low = total > 0 && remaining / total < 0.2
              return (
                <Link
                  key={cliente.id}
                  href={`/admin/clientes/${cliente.id}`}
                  className="grid gap-4 border-b border-[#E7E1D7] p-5 transition hover:bg-[#F8F8F6] md:grid-cols-[1fr_160px_auto] md:items-center"
                >
                  <div>
                    <p className="font-semibold">{cliente.nome}</p>
                    <p className="text-sm text-[#6F6D66]">{cliente.empresa || cliente.email || 'Sem empresa'}</p>
                    <div className="mt-3"><Progress used={used} total={total} /></div>
                  </div>
                  <p className="text-sm font-bold">{remaining} cr restantes</p>
                  {low ? <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800">Saldo baixo</span> : <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-black text-green-800">Saudável</span>}
                </Link>
              )
            })}
            {clientes.length === 0 ? <p className="p-8 text-center text-sm text-[#6F6D66]">Nenhum cliente cadastrado.</p> : null}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="text-lg font-semibold tracking-[-0.03em]">Fila operacional</h3>
          <div className="mt-4 grid gap-3">
            {activeDeliveries.slice(0, 6).map((entrega) => (
              <article key={entrega.id} className="rounded-lg border border-[#E7E1D7] bg-[#F8F8F6] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{entrega.nome}</p>
                    <p className="text-sm text-[#6F6D66]">{entrega.creditos_cobrados} créditos</p>
                  </div>
                  <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-black text-blue-700">{entrega.status.replace('_', ' ')}</span>
                </div>
              </article>
            ))}
            {activeDeliveries.length === 0 ? <p className="text-sm text-[#6F6D66]">Sem entregas abertas.</p> : null}
          </div>
        </Card>
      </section>
    </Shell>
  )
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <Card className="p-5">
      <div className="mb-4 text-[#6F6D66] [&_svg]:h-5 [&_svg]:w-5">{icon}</div>
      <p className="text-sm text-[#6F6D66]">{label}</p>
      <p className="mt-1 text-2xl font-black tracking-[-0.04em]">{value}</p>
    </Card>
  )
}
