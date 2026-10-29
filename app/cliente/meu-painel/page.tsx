// @ts-nocheck
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { Cliente, Contrato, Ciclo, Entrega } from '@/lib/types'

export default function MeuPainelPage() {
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [contrato, setContrato] = useState<Contrato | null>(null)
  const [ciclo, setCiclo] = useState<Ciclo | null>(null)
  const [entregas, setEntregas] = useState<Entrega[]>([])
  const [loading, setLoading] = useState(true)
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

        // Para agora, usar o clienteId do usuário metadata
        // Em produção, isso deveria vir de uma tabela de usuários/acessos
        const clienteId = (user.user_metadata?.cliente_id || user.user_metadata?.['cliente_id']) as string
        if (!clienteId) {
          router.push('/auth/login')
          return
        }

        // Carregar dados do cliente
        const { data: clienteData } = await supabase
          .from('clientes')
          .select('*')
          .eq('id', clienteId)
          .single()

        setCliente(clienteData)

        const { data: contratoData } = await supabase
          .from('contratos')
          .select('*')
          .eq('cliente_id', clienteId)
          .eq('ativo', true)
          .single()

        setContrato(contratoData)

        if (contratoData) {
          const hoje = new Date()
          const { data: cicloData } = await supabase
            .from('ciclos')
            .select('*')
            .eq('contrato_id', contratoData.id)
            .eq('mes', hoje.getMonth() + 1)
            .eq('ano', hoje.getFullYear())
            .single()

          setCiclo(cicloData)

          if (cicloData) {
            const { data: entregasData } = await supabase
              .from('entregas')
              .select('*')
              .eq('ciclo_id', cicloData.id)
              .order('created_at', { ascending: false })

            setEntregas(entregasData || [])
          }
        }
      } catch (error) {
        console.error('Erro:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen">Carregando...</div>
  if (!cliente || !ciclo) return <div className="flex items-center justify-center min-h-screen">Erro ao carregar dados</div>

  const creditosPorcentagem = (ciclo.creditos_usados / ciclo.creditos_disponiveis) * 100
  const dataRenovacao = new Date(contrato!.data_renovacao || new Date().setMonth(new Date().getMonth() + 1))

  return (
    <div className="min-h-screen bg-[#F8F8F6]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-[#1A1A1A]">Arke Keep</h1>
            <p className="text-gray-600 text-sm">{cliente.nome}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-gray-600 hover:text-[#1A1A1A] transition"
          >
            <LogOut size={20} />
            Sair
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12">
        {/* Seção de Saldo */}
        <div className="bg-white rounded-lg border border-gray-200 p-8 mb-12">
          <p className="text-gray-600 text-sm mb-4">CRÉDITOS DISPONÍVEIS</p>
          <div className="flex items-baseline gap-2 mb-8">
            <span className="text-6xl font-bold text-[#1A1A1A]">{ciclo.creditos_restantes}</span>
            <span className="text-2xl text-gray-600">de {ciclo.creditos_disponiveis} créditos</span>
          </div>

          <div className="mb-6">
            <div className="flex justify-between mb-2 text-sm">
              <span className="text-gray-600">Uso do mês</span>
              <span className="font-medium text-[#1A1A1A]">{Math.round(creditosPorcentagem)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div
                className={`h-full transition-all ${creditosPorcentagem > 80 ? 'bg-red-500' : creditosPorcentagem > 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
                style={{ width: `${Math.min(creditosPorcentagem, 100)}%` }}
              />
            </div>
          </div>

          <p className="text-sm text-gray-600">
            Renova em: <span className="font-medium">{dataRenovacao.toLocaleDateString('pt-BR')}</span>
          </p>
        </div>

        {/* Entregas do Mês */}
        <div>
          <h2 className="text-2xl font-bold text-[#1A1A1A] mb-6">Entregas do Mês</h2>

          {entregas.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <p className="text-gray-600">Nenhuma entrega registrada ainda</p>
            </div>
          ) : (
            <div className="space-y-4">
              {entregas.map((entrega) => (
                <div key={entrega.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-[#1A1A1A] mb-1">{entrega.nome}</h3>
                      <p className="text-sm text-gray-600">{new Date(entrega.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-[#1A1A1A] mb-2">{entrega.creditos_cobrados} cr</div>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                          entrega.status === 'aprovado'
                            ? 'bg-green-100 text-green-700'
                            : entrega.status === 'entregue'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {entrega.status}
                      </span>
                    </div>
                  </div>
                  {entrega.link_entrega && (
                    <a
                      href={entrega.link_entrega}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 text-sm mt-2 inline-block"
                    >
                      Ver arquivo →
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
