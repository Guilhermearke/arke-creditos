'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { LogOut, CheckCircle, Clock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { Entrega, Cliente } from '@/lib/types'

interface EntregaComCliente extends Entrega {
  cliente_nome?: string
}

export default function TarefasPage() {
  const [entregas, setEntregas] = useState<EntregaComCliente[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('pendente')
  const [userId, setUserId] = useState<string>('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth/login')
          return
        }

        setUserId(user.id)

        // Carregar entregas do usuário
        let query = supabase
          .from('entregas')
          .select('*')
          .eq('responsavel_id', user.id)

        if (filter !== 'todos') {
          query = query.eq('status', filter)
        }

        const { data: entregasData } = await query.order('created_at', { ascending: false })

        // Enriquecer com nomes de clientes
        if (entregasData) {
          const entregasComCliente: EntregaComCliente[] = []

          for (const entrega of entregasData) {
            const { data: clienteData } = await supabase
              .from('clientes')
              .select('nome')
              .eq('id', entrega.cliente_id)
              .single()

            entregasComCliente.push({
              ...entrega,
              cliente_nome: clienteData?.nome,
            })
          }

          setEntregas(entregasComCliente)
        }
      } catch (error) {
        console.error('Erro:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [filter])

  const handleUpdateStatus = async (entregaId: string, novoStatus: string) => {
    try {
      const { error } = await supabase
        .from('entregas')
        .update({ status: novoStatus })
        .eq('id', entregaId)

      if (error) throw error

      setEntregas((prev) =>
        prev.map((e) => (e.id === entregaId ? { ...e, status: novoStatus } : e))
      )
    } catch (error) {
      alert('Erro ao atualizar status')
      console.error(error)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen">Carregando...</div>

  const statuses = [
    { key: 'todos', label: 'Todas' },
    { key: 'pendente', label: 'Pendentes' },
    { key: 'em_andamento', label: 'Em Andamento' },
    { key: 'entregue', label: 'Entregues' },
    { key: 'aprovado', label: 'Aprovadas' },
  ]

  return (
    <div className="min-h-screen bg-[#F8F8F6]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Minhas Tarefas</h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-gray-600 hover:text-[#1A1A1A] transition"
          >
            <LogOut size={20} />
            Sair
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Filtros */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {statuses.map((status) => (
            <button
              key={status.key}
              onClick={() => setFilter(status.key)}
              className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition ${
                filter === status.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 text-[#1A1A1A] hover:bg-gray-50'
              }`}
            >
              {status.label}
            </button>
          ))}
        </div>

        {/* Lista de Tarefas */}
        {entregas.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-600">Nenhuma tarefa {filter !== 'todos' ? 'neste status' : ''}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {entregas.map((entrega) => (
              <div key={entrega.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-[#1A1A1A] text-lg mb-2">{entrega.nome}</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Cliente: <span className="font-medium">{entrega.cliente_nome}</span>
                    </p>
                    <div className="flex gap-4 text-sm text-gray-600">
                      <span>{entrega.creditos_cobrados} créditos</span>
                      <span>Criado em: {new Date(entrega.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {entrega.status !== 'aprovado' && (
                      <>
                        {entrega.status === 'pendente' && (
                          <button
                            onClick={() => handleUpdateStatus(entrega.id, 'em_andamento')}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg flex items-center gap-2 transition"
                          >
                            <Clock size={16} />
                            Iniciar
                          </button>
                        )}
                        {entrega.status === 'em_andamento' && (
                          <button
                            onClick={() => handleUpdateStatus(entrega.id, 'entregue')}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg flex items-center gap-2 transition"
                          >
                            <CheckCircle size={16} />
                            Entregar
                          </button>
                        )}
                      </>
                    )}
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium text-center ${
                        entrega.status === 'aprovado'
                          ? 'bg-green-100 text-green-700'
                          : entrega.status === 'entregue'
                            ? 'bg-blue-100 text-blue-700'
                            : entrega.status === 'em_andamento'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {entrega.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
