'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { LogOut } from 'lucide-react'

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    clientesAtivos: 0,
    mrr: 0,
    creditosConsumidos: 0,
    entregasEmAndamento: 0,
  })
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const loadStats = async () => {
      try {
        // Contar clientes ativos
        const { count: clientesAtivos } = await supabase
          .from('clientes')
          .select('*', { count: 'exact', head: true })
          .eq('ativo', true)

        // Calcular MRR
        const { data: contratos } = await supabase
          .from('contratos')
          .select('valor_mensal')
          .eq('ativo', true)

        const mrr = contratos?.reduce((acc, c) => acc + (c.valor_mensal || 0), 0) || 0

        // Créditos consumidos este mês
        const { data: ciclosAtivos } = await supabase
          .from('ciclos')
          .select('creditos_usados')
          .eq('status', 'ativo')

        const creditosConsumidos = ciclosAtivos?.reduce((acc, c) => acc + (c.creditos_usados || 0), 0) || 0

        // Entregas em andamento
        const { count: entregasEmAndamento } = await supabase
          .from('entregas')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'em_andamento')

        setStats({
          clientesAtivos: clientesAtivos || 0,
          mrr,
          creditosConsumidos,
          entregasEmAndamento: entregasEmAndamento || 0,
        })
      } catch (error) {
        console.error('Erro ao carregar stats:', error)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <div className="min-h-screen bg-[#F8F8F6]">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Arke - Painel Admin</h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-gray-600 hover:text-[#1A1A1A] transition"
          >
            <LogOut size={20} />
            Sair
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Carregando dados...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <p className="text-gray-600 text-sm font-medium mb-2">Clientes Ativos</p>
                <p className="text-3xl font-bold text-[#1A1A1A]">{stats.clientesAtivos}</p>
              </div>
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <p className="text-gray-600 text-sm font-medium mb-2">MRR</p>
                <p className="text-3xl font-bold text-[#1A1A1A]">R${(stats.mrr / 100).toFixed(0)}</p>
              </div>
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <p className="text-gray-600 text-sm font-medium mb-2">Créditos Consumidos (Mês)</p>
                <p className="text-3xl font-bold text-[#1A1A1A]">{stats.creditosConsumidos}</p>
              </div>
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <p className="text-gray-600 text-sm font-medium mb-2">Entregas em Andamento</p>
                <p className="text-3xl font-bold text-[#1A1A1A]">{stats.entregasEmAndamento}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { title: 'Clientes', href: '/admin/clientes', desc: 'Gerenciar clientes e contratos' },
                { title: 'Serviços', href: '/admin/servicos', desc: 'Biblioteca de serviços' },
                { title: 'Entregas', href: '/admin/entregas', desc: 'Registrar entregas' },
                { title: 'Time', href: '/admin/time', desc: 'Membros do time' },
              ].map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-md transition"
                >
                  <h2 className="text-xl font-bold text-[#1A1A1A] mb-2">{item.title}</h2>
                  <p className="text-gray-600 text-sm">{item.desc}</p>
                </a>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
