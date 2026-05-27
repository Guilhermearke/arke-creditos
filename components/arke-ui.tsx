"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  BarChart3,
  Bell,
  Building2,
  CalendarClock,
  Check,
  ChevronRight,
  Clock3,
  CopyCheck,
  CreditCard,
  ExternalLink,
  FileCheck2,
  Filter,
  Gauge,
  LayoutDashboard,
  Link2,
  ListChecks,
  Menu,
  MessageSquareText,
  MoreHorizontal,
  PackageCheck,
  PanelLeft,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  TimerReset,
  TrendingUp,
  UserRoundCheck,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";

type ClientStatus = "Ativo" | "Risco" | "Onboarding";
type WorkStatus = "Backlog" | "Em andamento" | "Revisao" | "Entregue";

type Client = {
  name: string;
  owner: string;
  segment: string;
  plan: string;
  credits: number;
  usage: number;
  mrr: string;
  nps: number;
  status: ClientStatus;
};

type Delivery = {
  id: string;
  client: string;
  service: string;
  owner: string;
  status: WorkStatus;
  credits: number;
  due: string;
  priority: "Alta" | "Media" | "Baixa";
  link?: string;
};

const clients: Client[] = [
  { name: "Nexa Capital", owner: "Marina", segment: "Fintech", plan: "Enterprise", credits: 1840, usage: 78, mrr: "R$ 18,4k", nps: 92, status: "Ativo" },
  { name: "Grupo Aurora", owner: "Rafael", segment: "Varejo", plan: "Scale", credits: 960, usage: 64, mrr: "R$ 9,6k", nps: 86, status: "Ativo" },
  { name: "MedSync", owner: "Clara", segment: "Health", plan: "Enterprise", credits: 420, usage: 91, mrr: "R$ 14,2k", nps: 74, status: "Risco" },
  { name: "Atlas Foods", owner: "Leo", segment: "CPG", plan: "Growth", credits: 690, usage: 42, mrr: "R$ 7,1k", nps: 88, status: "Onboarding" },
];

const initialDeliveries: Delivery[] = [
  { id: "ARK-1042", client: "Nexa Capital", service: "Dashboard executivo", owner: "Bianca", status: "Em andamento", credits: 180, due: "Hoje", priority: "Alta" },
  { id: "ARK-1038", client: "Grupo Aurora", service: "Playbook comercial", owner: "Thiago", status: "Backlog", credits: 90, due: "Amanha", priority: "Media" },
  { id: "ARK-1027", client: "MedSync", service: "Auditoria de funil", owner: "Clara", status: "Revisao", credits: 120, due: "Sex, 22/05", priority: "Alta" },
  { id: "ARK-1019", client: "Atlas Foods", service: "Onboarding de CRM", owner: "Vitor", status: "Entregue", credits: 75, due: "Ontem", priority: "Baixa", link: "https://app.arke.keep/entregas/1019" },
  { id: "ARK-1008", client: "Nexa Capital", service: "Modelagem de credito", owner: "Bianca", status: "Backlog", credits: 210, due: "Seg, 25/05", priority: "Alta" },
];

const services = ["Dashboard executivo", "Playbook comercial", "Auditoria de funil", "Onboarding de CRM", "Modelagem de credito", "Sprint de automacao"];
const statuses: WorkStatus[] = ["Backlog", "Em andamento", "Revisao", "Entregue"];

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function StatusPill({ status }: { status: ClientStatus | WorkStatus | Delivery["priority"] }) {
  const styles: Record<string, string> = {
    Ativo: "border-emerald-200 bg-emerald-50 text-emerald-700",
    Risco: "border-rose-200 bg-rose-50 text-rose-700",
    Onboarding: "border-blue-200 bg-blue-50 text-blue-700",
    Backlog: "border-slate-200 bg-slate-100 text-slate-700",
    "Em andamento": "border-amber-200 bg-amber-50 text-amber-700",
    Revisao: "border-violet-200 bg-violet-50 text-violet-700",
    Entregue: "border-emerald-200 bg-emerald-50 text-emerald-700",
    Alta: "border-rose-200 bg-rose-50 text-rose-700",
    Media: "border-amber-200 bg-amber-50 text-amber-700",
    Baixa: "border-slate-200 bg-white text-slate-600",
  };

  return <span className={cx("inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold", styles[status])}>{status}</span>;
}

function Shell({ area, children }: { area: "Admin" | "Cliente" | "Time"; children: React.ReactNode }) {
  const nav = [
    { label: "Admin", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Cliente", href: "/cliente/meu-painel", icon: Building2 },
    { label: "Time", href: "/time/tarefas", icon: ListChecks },
  ];

  return (
    <main className="min-h-screen bg-[#f6f7f9] text-slate-950">
      <div className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/admin/dashboard" className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-slate-950 text-white">
              <WalletCards className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold leading-4">Arke Keep</p>
              <p className="text-xs text-slate-500">Credit ops suite</p>
            </div>
          </Link>
          <nav className="hidden items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 md:flex">
            {nav.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} className={cx("flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold", area === item.label ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-900")}>
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-2">
            <button className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-950" aria-label="Abrir notificacoes">
              <Bell className="h-4 w-4" />
            </button>
            <button className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 md:hidden" aria-label="Abrir menu">
              <Menu className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      {children}
    </main>
  );
}

function MetricCard({ label, value, trend, icon: Icon }: { label: string; value: string; trend: string; icon: typeof BarChart3 }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
        </div>
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-slate-100 text-slate-700">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-4 flex items-center gap-1 text-sm font-medium text-emerald-700">
        <TrendingUp className="h-4 w-4" />
        {trend}
      </p>
    </div>
  );
}

function DeliveryModal({ open, onClose, onAdd }: { open: boolean; onClose: () => void; onAdd: (delivery: Delivery) => void }) {
  const [client, setClient] = useState(clients[0].name);
  const [service, setService] = useState(services[0]);
  const [credits, setCredits] = useState("120");
  const [owner, setOwner] = useState("Bianca");

  if (!open) return null;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onAdd({
      id: `ARK-${Math.floor(1100 + Math.random() * 800)}`,
      client,
      service,
      owner,
      status: "Backlog",
      credits: Number(credits) || 0,
      due: "Novo",
      priority: "Media",
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-slate-950/45 p-0 sm:place-items-center sm:p-4">
      <form onSubmit={submit} className="w-full max-w-xl rounded-t-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:rounded-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-blue-700">Nova entrega</p>
            <h2 className="mt-1 text-xl font-bold text-slate-950">Registrar entrega vinculada</h2>
          </div>
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:text-slate-950" aria-label="Fechar modal">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm font-semibold text-slate-700">
            Cliente
            <select value={client} onChange={(event) => setClient(event.target.value)} className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-slate-950 outline-none ring-blue-500 focus:ring-2">
              {clients.map((item) => <option key={item.name}>{item.name}</option>)}
            </select>
          </label>
          <label className="space-y-2 text-sm font-semibold text-slate-700">
            Tipo de servico
            <select value={service} onChange={(event) => setService(event.target.value)} className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-slate-950 outline-none ring-blue-500 focus:ring-2">
              {services.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label className="space-y-2 text-sm font-semibold text-slate-700">
            Creditos
            <input value={credits} onChange={(event) => setCredits(event.target.value)} inputMode="numeric" className="h-11 w-full rounded-lg border border-slate-200 px-3 outline-none ring-blue-500 focus:ring-2" />
          </label>
          <label className="space-y-2 text-sm font-semibold text-slate-700">
            Responsavel
            <input value={owner} onChange={(event) => setOwner(event.target.value)} className="h-11 w-full rounded-lg border border-slate-200 px-3 outline-none ring-blue-500 focus:ring-2" />
          </label>
        </div>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700">Cancelar</button>
          <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-2 text-sm font-bold text-white">
            <Plus className="h-4 w-4" />
            Registrar
          </button>
        </div>
      </form>
    </div>
  );
}

export function AdminDashboard() {
  const [deliveries, setDeliveries] = useState(initialDeliveries);
  const [modalOpen, setModalOpen] = useState(false);
  const active = deliveries.filter((item) => item.status !== "Entregue").length;

  return (
    <Shell area="Admin">
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-700">Admin workspace</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Operacao de creditos e entregas</h1>
          </div>
          <button onClick={() => setModalOpen(true)} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-bold text-white shadow-sm">
            <Plus className="h-4 w-4" />
            Registrar entrega
          </button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="MRR ativo" value="R$ 49,3k" trend="+12,4% vs. mes anterior" icon={BarChart3} />
          <MetricCard label="Creditos em carteira" value="3.910" trend="78% com uso saudavel" icon={CreditCard} />
          <MetricCard label="Entregas abertas" value={String(active)} trend="SLA medio 2,8 dias" icon={TimerReset} />
          <MetricCard label="Saude da base" value="88" trend="NPS operacional alto" icon={Gauge} />
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-[1.5fr_1fr]">
          <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 p-4">
              <div>
                <h2 className="font-bold text-slate-950">Clientes</h2>
                <p className="text-sm text-slate-500">Carteira, consumo e risco em uma visao densa.</p>
              </div>
              <button className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-500" aria-label="Filtrar clientes">
                <Filter className="h-4 w-4" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3">Plano</th>
                    <th className="px-4 py-3">Creditos</th>
                    <th className="px-4 py-3">Uso</th>
                    <th className="px-4 py-3">MRR</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {clients.map((client) => (
                    <tr key={client.name} className="hover:bg-slate-50">
                      <td className="px-4 py-4">
                        <div className="font-bold text-slate-950">{client.name}</div>
                        <div className="text-xs text-slate-500">{client.segment} · CS {client.owner}</div>
                      </td>
                      <td className="px-4 py-4 font-semibold">{client.plan}</td>
                      <td className="px-4 py-4">{client.credits.toLocaleString("pt-BR")}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-24 rounded-full bg-slate-100">
                            <div className="h-2 rounded-full bg-blue-600" style={{ width: `${client.usage}%` }} />
                          </div>
                          <span className="text-xs font-bold">{client.usage}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 font-bold">{client.mrr}</td>
                      <td className="px-4 py-4"><StatusPill status={client.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-slate-950">Fila critica</h2>
              <Sparkles className="h-5 w-5 text-blue-600" />
            </div>
            <div className="mt-4 space-y-3">
              {deliveries.slice(0, 5).map((item) => (
                <div key={item.id} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-slate-950">{item.service}</p>
                      <p className="mt-1 text-sm text-slate-500">{item.client} · {item.credits} creditos</p>
                    </div>
                    <StatusPill status={item.status} />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs font-semibold text-slate-500">
                    <span>{item.id}</span>
                    <span>{item.due}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      <DeliveryModal open={modalOpen} onClose={() => setModalOpen(false)} onAdd={(delivery) => setDeliveries((items) => [delivery, ...items])} />
    </Shell>
  );
}

export function AdminClients() {
  return (
    <Shell area="Admin">
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-700">Carteira</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">Clientes B2B</h1>
          </div>
          <div className="flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-slate-500">
            <Search className="h-4 w-4" />
            <input placeholder="Buscar cliente" className="w-full bg-transparent text-sm outline-none md:w-64" />
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {clients.map((client) => (
            <article key={client.name} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="grid h-11 w-11 place-items-center rounded-lg bg-slate-100 text-slate-700">
                  <Building2 className="h-5 w-5" />
                </div>
                <StatusPill status={client.status} />
              </div>
              <h2 className="mt-4 text-lg font-bold">{client.name}</h2>
              <p className="text-sm text-slate-500">{client.segment} · {client.plan}</p>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Creditos</p>
                  <p className="font-bold">{client.credits}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">NPS</p>
                  <p className="font-bold">{client.nps}</p>
                </div>
              </div>
              <button className="mt-4 flex w-full items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold">
                Abrir conta <ChevronRight className="h-4 w-4" />
              </button>
            </article>
          ))}
        </div>
      </section>
    </Shell>
  );
}

export function AdminDeliveries() {
  const [modalOpen, setModalOpen] = useState(false);
  const [deliveries, setDeliveries] = useState(initialDeliveries);

  return (
    <Shell area="Admin">
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-700">Operacao</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">Entregas registradas</h1>
          </div>
          <button onClick={() => setModalOpen(true)} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-bold text-white">
            <Plus className="h-4 w-4" />
            Nova entrega
          </button>
        </div>
        <div className="mt-6 rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Servico</th>
                  <th className="px-4 py-3">Responsavel</th>
                  <th className="px-4 py-3">Creditos</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Prazo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {deliveries.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-4 font-bold">{item.id}</td>
                    <td className="px-4 py-4">{item.client}</td>
                    <td className="px-4 py-4 font-semibold">{item.service}</td>
                    <td className="px-4 py-4">{item.owner}</td>
                    <td className="px-4 py-4">{item.credits}</td>
                    <td className="px-4 py-4"><StatusPill status={item.status} /></td>
                    <td className="px-4 py-4 text-slate-500">{item.due}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
      <DeliveryModal open={modalOpen} onClose={() => setModalOpen(false)} onAdd={(delivery) => setDeliveries((items) => [delivery, ...items])} />
    </Shell>
  );
}

export function AdminServices() {
  return (
    <Shell area="Admin">
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <p className="text-sm font-semibold text-blue-700">Catalogo</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Tipos de servico</h1>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {services.map((service, index) => (
            <article key={service} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="grid h-11 w-11 place-items-center rounded-lg bg-blue-50 text-blue-700">
                  <PackageCheck className="h-5 w-5" />
                </div>
                <span className="text-sm font-bold text-slate-500">{80 + index * 25} creditos</span>
              </div>
              <h2 className="mt-4 text-lg font-bold">{service}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">Escopo padronizado, SLA definido e checklist operacional para rastrear entrega ponta a ponta.</p>
            </article>
          ))}
        </div>
      </section>
    </Shell>
  );
}

export function AdminTeam() {
  return (
    <Shell area="Admin">
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <p className="text-sm font-semibold text-blue-700">Capacidade</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Time e alocacao</h1>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {["Bianca", "Clara", "Thiago", "Vitor", "Rafael", "Marina"].map((person, index) => (
            <article key={person} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-full bg-slate-950 text-sm font-bold text-white">{person.slice(0, 1)}</div>
                <div>
                  <h2 className="font-bold">{person}</h2>
                  <p className="text-sm text-slate-500">{index % 2 ? "Delivery" : "Customer success"}</p>
                </div>
              </div>
              <div className="mt-4 h-2 rounded-full bg-slate-100">
                <div className="h-2 rounded-full bg-blue-600" style={{ width: `${52 + index * 7}%` }} />
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-600">{52 + index * 7}% de capacidade</p>
            </article>
          ))}
        </div>
      </section>
    </Shell>
  );
}

export function ClientPanel() {
  return (
    <Shell area="Cliente">
      <section className="mx-auto max-w-5xl px-4 py-5 sm:px-6">
        <div className="rounded-xl bg-slate-950 p-5 text-white shadow-xl sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-blue-200">Nexa Capital</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight">Seu painel Arke Keep</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">Acompanhe creditos, entregas, proximos marcos e links finais em uma experiencia pensada para liderancas B2B em movimento.</p>
            </div>
            <ShieldCheck className="hidden h-8 w-8 text-emerald-300 sm:block" />
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-white/10 p-4">
              <p className="text-xs text-slate-300">Creditos disponiveis</p>
              <p className="mt-2 text-2xl font-bold">1.840</p>
            </div>
            <div className="rounded-lg bg-white/10 p-4">
              <p className="text-xs text-slate-300">Em producao</p>
              <p className="mt-2 text-2xl font-bold">3 entregas</p>
            </div>
            <div className="rounded-lg bg-white/10 p-4">
              <p className="text-xs text-slate-300">SLA medio</p>
              <p className="mt-2 text-2xl font-bold">2,8 dias</p>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            {initialDeliveries.filter((item) => item.client === "Nexa Capital").map((item) => (
              <article key={item.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-slate-500">{item.id}</p>
                    <h2 className="mt-1 text-lg font-bold">{item.service}</h2>
                  </div>
                  <StatusPill status={item.status} />
                </div>
                <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                  <div className="flex items-center gap-2 text-slate-600"><CalendarClock className="h-4 w-4" /> {item.due}</div>
                  <div className="flex items-center gap-2 text-slate-600"><CreditCard className="h-4 w-4" /> {item.credits} creditos</div>
                  <div className="flex items-center gap-2 text-slate-600"><UserRoundCheck className="h-4 w-4" /> {item.owner}</div>
                </div>
                {item.link ? (
                  <a href={item.link} className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-blue-700">
                    Abrir entrega <ExternalLink className="h-4 w-4" />
                  </a>
                ) : null}
              </article>
            ))}
          </div>
          <aside className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="font-bold">Proximas acoes</h2>
            <div className="mt-4 space-y-3">
              {["Aprovar escopo do dashboard", "Enviar base de leads atualizada", "Revisar criterios da modelagem"].map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-lg bg-slate-50 p-3 text-sm font-semibold text-slate-700">
                  <Check className="mt-0.5 h-4 w-4 text-emerald-600" />
                  {item}
                </div>
              ))}
            </div>
            <button className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-bold text-white">
              <MessageSquareText className="h-4 w-4" />
              Falar com a Arke
            </button>
          </aside>
        </div>
      </section>
    </Shell>
  );
}

export function TeamKanban() {
  const [items, setItems] = useState(initialDeliveries);
  const [query, setQuery] = useState("");
  const [linkDrafts, setLinkDrafts] = useState<Record<string, string>>({});

  const filtered = useMemo(() => {
    return items.filter((item) => `${item.client} ${item.service} ${item.owner}`.toLowerCase().includes(query.toLowerCase()));
  }, [items, query]);

  function moveItem(id: string, status: WorkStatus) {
    setItems((current) => current.map((item) => item.id === id ? { ...item, status, link: status === "Entregue" ? linkDrafts[id] || item.link : item.link } : item));
  }

  return (
    <Shell area="Time">
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-700">Delivery workspace</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">Kanban operacional</h1>
          </div>
          <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
            <div className="flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-slate-500">
              <Search className="h-4 w-4" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filtrar cliente, servico ou dono" className="w-full bg-transparent text-sm outline-none sm:w-72" />
            </div>
            <button className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700">
              <Filter className="h-4 w-4" />
              Filtros
            </button>
            <button className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-bold text-white">
              <PanelLeft className="h-4 w-4" />
              Capacidade
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-4">
          {statuses.map((status) => {
            const column = filtered.filter((item) => item.status === status);
            return (
              <div key={status} className="rounded-lg border border-slate-200 bg-slate-100/70 p-3">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="font-bold text-slate-800">{status}</h2>
                  <span className="rounded-full bg-white px-2 py-1 text-xs font-bold text-slate-500">{column.length}</span>
                </div>
                <div className="space-y-3">
                  {column.map((item) => (
                    <article key={item.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold text-slate-500">{item.id}</p>
                          <h3 className="mt-1 font-bold text-slate-950">{item.service}</h3>
                          <p className="mt-1 text-sm text-slate-500">{item.client}</p>
                        </div>
                        <button className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500" aria-label="Mais opcoes">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <StatusPill status={item.priority} />
                        <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600">
                          <Clock3 className="h-3 w-3" /> {item.due}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600">
                          <CopyCheck className="h-3 w-3" /> {item.credits}
                        </span>
                      </div>
                      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-sm">
                        <span className="font-semibold text-slate-600">{item.owner}</span>
                        <select value={item.status} onChange={(event) => moveItem(item.id, event.target.value as WorkStatus)} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-bold outline-none">
                          {statuses.map((option) => <option key={option}>{option}</option>)}
                        </select>
                      </div>
                      {item.status === "Revisao" || item.status === "Entregue" ? (
                        <div className="mt-3 flex items-center gap-2 rounded-lg bg-slate-50 p-2">
                          <Link2 className="h-4 w-4 text-slate-500" />
                          <input value={linkDrafts[item.id] ?? item.link ?? ""} onChange={(event) => setLinkDrafts((drafts) => ({ ...drafts, [item.id]: event.target.value }))} placeholder="Link da entrega" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
                          <button onClick={() => moveItem(item.id, "Entregue")} className="grid h-8 w-8 place-items-center rounded-md bg-emerald-600 text-white" aria-label="Marcar entregue">
                            <Send className="h-4 w-4" />
                          </button>
                        </div>
                      ) : null}
                    </article>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </Shell>
  );
}

export function HomeRedirect() {
  return (
    <Shell area="Admin">
      <section className="mx-auto grid min-h-[calc(100vh-68px)] max-w-5xl place-items-center px-4 py-10 sm:px-6">
        <div className="w-full rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-blue-700">Ambientes Arke Keep</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Escolha o workspace</h1>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {[
              { label: "Admin", href: "/admin/dashboard", icon: LayoutDashboard, desc: "Metricas, clientes e entregas." },
              { label: "Cliente", href: "/cliente/meu-painel", icon: Building2, desc: "Painel premium mobile-first." },
              { label: "Time", href: "/time/tarefas", icon: ListChecks, desc: "Kanban com links finais." },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} className="group rounded-lg border border-slate-200 p-4 hover:border-slate-400">
                  <Icon className="h-6 w-6 text-blue-700" />
                  <p className="mt-4 font-bold">{item.label}</p>
                  <p className="mt-1 text-sm text-slate-500">{item.desc}</p>
                  <ArrowUpRight className="mt-4 h-4 w-4 text-slate-400 group-hover:text-slate-950" />
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </Shell>
  );
}

