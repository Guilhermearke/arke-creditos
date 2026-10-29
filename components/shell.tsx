// @ts-nocheck
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart3,
  Bell,
  ChevronRight,
  Cog,
  FileStack,
  Inbox,
  Kanban,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Settings,
  Users,
  Wallet,
} from 'lucide-react'
import { useState } from 'react'

// ────────────────────────────────────────────────────────────────
// Sidebar Admin
// ────────────────────────────────────────────────────────────────

const adminNav = [
  {
    items: [
      { href: '/admin/triagem', label: 'Triagem', icon: Inbox, badge: true },
      { href: '/admin/dashboard', label: 'Dashboard', icon: BarChart3 },
    ],
  },
  {
    label: 'Produção',
    items: [
      { href: '/admin/kanban', label: 'Kanban', icon: Kanban },
      { href: '/admin/tarefas', label: 'Tarefas', icon: ListTodo },
      { href: '/admin/projetos', label: 'Projetos', icon: FileStack },
    ],
  },
  {
    label: 'Clientes',
    items: [
      { href: '/admin/clientes', label: 'Clientes', icon: Users },
      { href: '/admin/financeiro', label: 'Financeiro', icon: Wallet },
    ],
  },
  {
    label: 'Config',
    items: [
      { href: '/admin/configuracoes/servicos', label: 'Serviços', icon: Settings },
      { href: '/admin/configuracoes/planos', label: 'Planos', icon: Cog },
      { href: '/admin/configuracoes/time', label: 'Time', icon: Users },
    ],
  },
]

export function AdminShell({
  children,
  triageCount = 0,
}: {
  children: React.ReactNode
  triageCount?: number
}) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex min-h-screen bg-[#F9F9F7]">
      {/* Sidebar */}
      <aside
        className="arke-sidebar sticky top-0 flex h-screen flex-col"
        style={{ width: collapsed ? 56 : 220, transition: 'width 0.2s ease', flexShrink: 0 }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-5">
          {!collapsed && (
            <div>
              <p className="arke-sidebar-logo" style={{ fontSize: 11, letterSpacing: '0.15em' }}>
                ARKE
              </p>
              <p style={{ fontSize: 10, color: '#6B7280', marginTop: 1 }}>gestão criativa</p>
            </div>
          )}
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="arke-sidebar-item btn-icon"
            style={{ marginLeft: collapsed ? 'auto' : 0, padding: 6 }}
            aria-label="Colapsar sidebar"
          >
            <ChevronRight
              style={{
                width: 14,
                height: 14,
                transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)',
                transition: 'transform 0.2s',
              }}
            />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 pb-4" style={{ gap: 2, display: 'flex', flexDirection: 'column' }}>
          {adminNav.map((group, gi) => (
            <div key={gi} style={{ marginBottom: 8 }}>
              {!collapsed && group.label && (
                <p
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#4B5563',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    padding: '6px 12px 4px',
                  }}
                >
                  {group.label}
                </p>
              )}
              {group.items.map((item) => {
                const Icon = item.icon
                const active = pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(item.href))
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`arke-sidebar-item ${active ? 'active' : ''}`}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon />
                    {!collapsed && <span style={{ flex: 1 }}>{item.label}</span>}
                    {!collapsed && item.badge && triageCount > 0 && (
                      <span className="arke-badge">{triageCount > 99 ? '99+' : triageCount}</span>
                    )}
                    {collapsed && item.badge && triageCount > 0 && (
                      <span
                        style={{
                          position: 'absolute',
                          top: 4,
                          right: 4,
                          width: 8,
                          height: 8,
                          background: '#DC2626',
                          borderRadius: '50%',
                        }}
                      />
                    )}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t px-2 py-3" style={{ borderColor: '#1F2937' }}>
          <button className="arke-sidebar-item" style={{ width: '100%' }}>
            <LogOut />
            {!collapsed && <span>Sair</span>}
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="min-w-0 flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────
// Page Header
// ────────────────────────────────────────────────────────────────

export function PageHeader({
  label,
  title,
  actions,
}: {
  label?: string
  title: string
  actions?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-6 py-5 border-b border-[#E5E7EB]">
      <div>
        {label && (
          <p style={{ fontSize: 11, fontWeight: 700, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>
            {label}
          </p>
        )}
        <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', color: '#1A1A1A' }}>{title}</h1>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

// ────────────────────────────────────────────────────────────────
// Card
// ────────────────────────────────────────────────────────────────

export function Card({
  children,
  className = '',
  style,
}: {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <div className={`card ${className}`} style={style}>
      {children}
    </div>
  )
}

// ────────────────────────────────────────────────────────────────
// Status Badge
// ────────────────────────────────────────────────────────────────

import type { StatusTarefa, Prioridade, TipoCliente } from '@/lib/types'
import { STATUS_LABEL, PRIORIDADE_LABEL, TIPO_LABEL } from '@/lib/types'

export function StatusBadge({ status }: { status: StatusTarefa }) {
  return (
    <span className={`status-badge status-${status}`}>
      {STATUS_LABEL[status]}
    </span>
  )
}

const prioColors: Record<Prioridade, string> = {
  urgente: 'bg-red-100 text-red-700',
  alta: 'bg-orange-100 text-orange-700',
  normal: 'bg-blue-100 text-blue-700',
  baixa: 'bg-gray-100 text-gray-600',
}

export function PrioridadeBadge({ prioridade }: { prioridade: Prioridade }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${prioColors[prioridade]}`}
    >
      {PRIORIDADE_LABEL[prioridade]}
    </span>
  )
}

export function TipoBadge({ tipo }: { tipo: TipoCliente }) {
  const colors: Record<TipoCliente, string> = {
    keep: 'bg-blue-100 text-blue-700',
    build: 'bg-purple-100 text-purple-700',
    craft: 'bg-emerald-100 text-emerald-700',
    avulso: 'bg-amber-100 text-amber-700',
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${colors[tipo]}`}>
      {TIPO_LABEL[tipo]}
    </span>
  )
}

// ────────────────────────────────────────────────────────────────
// Credit Bar
// ────────────────────────────────────────────────────────────────

export function CreditBar({ used, total }: { used: number; total: number }) {
  const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0
  const remaining = total - used
  const isLow = total > 0 && remaining / total < 0.2
  const isMedium = total > 0 && remaining / total < 0.5

  return (
    <div>
      <div className="credit-bar-track">
        <div
          className={`credit-bar-fill ${isLow ? 'low' : isMedium ? 'medium' : ''}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 11, color: '#6B7280' }}>
        <span>{used} usados</span>
        <span>{remaining} restantes</span>
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────
// Currency
// ────────────────────────────────────────────────────────────────

export function Currency({ value }: { value: number }) {
  return <>{value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</>
}

// ────────────────────────────────────────────────────────────────
// Spinner
// ────────────────────────────────────────────────────────────────

export function Spinner() {
  return (
    <div
      style={{
        width: 20,
        height: 20,
        border: '2px solid #E5E7EB',
        borderTopColor: '#2563EB',
        borderRadius: '50%',
        animation: 'spin 0.6s linear infinite',
      }}
    />
  )
}

// ────────────────────────────────────────────────────────────────
// Empty State
// ────────────────────────────────────────────────────────────────

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        textAlign: 'center',
        gap: 12,
      }}
    >
      {icon && (
        <div style={{ color: '#D1D5DB', marginBottom: 4 }}>{icon}</div>
      )}
      <p style={{ fontWeight: 700, fontSize: 15, color: '#1A1A1A' }}>{title}</p>
      {description && (
        <p style={{ fontSize: 13, color: '#6B7280', maxWidth: 320 }}>{description}</p>
      )}
      {action}
    </div>
  )
}
