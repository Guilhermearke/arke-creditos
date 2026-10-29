// @ts-nocheck
import { updateDeliveryStatus } from '@/app/actions'
import { Surface } from '@/components/app-frame'
import type { Entrega, StatusEntrega } from '@/lib/types'

type RichEntrega = Entrega & {
  cliente_nome?: string | null
  responsavel_nome?: string | null
  servico_nome?: string | null
  objetivo?: string | null
  briefing?: string | null
  formato?: string | null
  canais?: string[] | null
  referencias?: string | null
  prazo?: string | null
  prioridade?: string | null
  arquivos?: string | null
}

const columns: Array<{ status: StatusEntrega; title: string; helper: string }> = [
  { status: 'pendente', title: 'Pendente', helper: 'Pronto para puxar' },
  { status: 'em_andamento', title: 'Em andamento', helper: 'Execução ativa' },
  { status: 'entregue', title: 'Entregue', helper: 'Aguardando aprovação' },
  { status: 'aprovado', title: 'Aprovado', helper: 'Finalizado' },
]

export function ClickUpKanban({ entregas }: { entregas: RichEntrega[] }) {
  return (
    <div className="grid gap-4 overflow-x-auto pb-3 xl:grid-cols-4">
      {columns.map((column) => {
        const items = entregas.filter((entrega) => entrega.status === column.status)
        const credits = items.reduce((sum, entrega) => sum + Number(entrega.creditos_cobrados ?? 0), 0)
        return (
          <section key={column.status} className="min-h-[680px] min-w-[330px] rounded-lg border border-[#E3DED2] bg-[#F0ECE3] p-3">
            <div className="mb-3 border-b border-[#E3DED2] pb-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-black tracking-[-0.02em]">{column.title}</h3>
                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-black">{items.length}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs font-bold text-[#757168]">
                <span>{column.helper}</span>
                <span>{credits} cr</span>
              </div>
            </div>
            <div className="grid gap-3">
              {items.map((entrega) => (
                <TaskCard key={entrega.id} entrega={entrega} />
              ))}
              {items.length === 0 ? (
                <div className="rounded-lg border border-dashed border-[#D7D0C2] bg-white/60 p-5 text-center text-sm font-bold text-[#757168]">
                  Sem cards nesta etapa
                </div>
              ) : null}
            </div>
          </section>
        )
      })}
    </div>
  )
}

function TaskCard({ entrega }: { entrega: RichEntrega }) {
  const next = getNextAction(entrega.status)
  const isLate = entrega.prazo ? new Date(entrega.prazo) < new Date(new Date().toDateString()) : false

  return (
    <Surface className="p-4 transition hover:-translate-y-0.5 hover:shadow-[0_18px_50px_rgba(26,26,26,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-black leading-tight">{entrega.nome}</p>
          <p className="mt-1 text-xs font-bold text-[#757168]">
            {entrega.cliente_nome || 'Cliente'} · {entrega.servico_nome || 'Serviço'} · {entrega.creditos_cobrados} cr
          </p>
        </div>
        <Priority priority={entrega.prioridade} />
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs font-black">
        <span className="rounded-full bg-[#F7F5F0] px-2 py-1 text-[#5F5B52]">{entrega.responsavel_nome || 'Sem responsável'}</span>
        {entrega.prazo ? (
          <span className={`rounded-full px-2 py-1 ${isLate ? 'bg-red-100 text-red-700' : 'bg-white text-[#5F5B52]'}`}>
            {isLate ? 'Atrasado' : 'Prazo'} {new Date(entrega.prazo).toLocaleDateString('pt-BR')}
          </span>
        ) : null}
        {entrega.canais?.length ? <span className="rounded-full bg-white px-2 py-1 text-[#5F5B52]">{entrega.canais.join(', ')}</span> : null}
      </div>

      {entrega.objetivo ? <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#3F3D38]">{entrega.objetivo}</p> : null}

      <div className="mt-3 grid gap-1 rounded-lg bg-[#F7F5F0] p-3 text-xs leading-5 text-[#5F5B52]">
        {entrega.formato ? <p><strong>Formato:</strong> {entrega.formato}</p> : null}
        {entrega.briefing ? <p><strong>Briefing:</strong> {entrega.briefing}</p> : null}
        {entrega.referencias ? <p><strong>Refs:</strong> {entrega.referencias}</p> : null}
        {entrega.arquivos ? <p><strong>Arquivos:</strong> {entrega.arquivos}</p> : null}
        {!entrega.formato && !entrega.briefing && !entrega.referencias && !entrega.arquivos ? <p>Sem detalhes adicionais no briefing.</p> : null}
      </div>

      {entrega.status === 'em_andamento' ? (
        <form action={updateDeliveryStatus} className="mt-3 grid gap-2">
          <input name="id" type="hidden" value={entrega.id} />
          <input name="status" type="hidden" value="entregue" />
          <input className="rounded-lg border border-[#E3DED2] px-3 py-2 text-sm outline-none focus:border-[#171717]" name="link_entrega" placeholder="Link da entrega" />
          <button className="rounded-lg bg-[#171717] px-3 py-2 text-sm font-black text-white">Marcar como entregue</button>
        </form>
      ) : next ? (
        <form action={updateDeliveryStatus} className="mt-3">
          <input name="id" type="hidden" value={entrega.id} />
          <input name="status" type="hidden" value={next.status} />
          <button className="w-full rounded-lg border border-[#E3DED2] bg-white px-3 py-2 text-sm font-black transition hover:border-[#171717]">
            {next.label}
          </button>
        </form>
      ) : null}
    </Surface>
  )
}

function getNextAction(status: StatusEntrega): { status: StatusEntrega; label: string } | null {
  if (status === 'pendente') return { status: 'em_andamento', label: 'Iniciar tarefa' }
  if (status === 'entregue') return { status: 'aprovado', label: 'Aprovar entrega' }
  if (status === 'aprovado') return null
  return { status: 'entregue', label: 'Marcar como entregue' }
}

function Priority({ priority }: { priority?: string | null }) {
  const tone =
    priority === 'urgente'
      ? 'bg-red-100 text-red-700'
      : priority === 'alta'
        ? 'bg-amber-100 text-amber-800'
        : 'bg-zinc-100 text-zinc-700'

  return <span className={`rounded-full px-2.5 py-1 text-xs font-black ${tone}`}>{priority || 'media'}</span>
}
