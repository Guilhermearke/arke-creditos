// @ts-nocheck
'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import type { Cliente, Contrato, Ciclo, Entrega, Servico } from '@/lib/types'
import { ArrowLeft, Plus } from 'lucide-react'
import Link from 'next/link'

export default function ClienteDetailPage() {
  const params = useParams()
  const clienteId = params.id as string
  const supabase = createClient()

  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [contrato, setContrato] = useState<Contrato | null>(null)
  const [ciclo, setCiclo] = useState<Ciclo | null>(null)
  const [entregas, setEntregas] = useState<Entrega[]>([])
  const [servicos, setServicos] = useState<Servico[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [modalData, setModalData] = useState({
    servico_id: '',
    nome: '',
    revisao: false,
    creditos_extra: 0,
    observacoes: '',
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        // Carregar cliente
        const { data: clienteData } = await supabase
          .from('clientes')
          .select('*')
          .eq('id', clienteId)
          .single()

        setCliente(clienteData)

        // Carregar contrato ativo
        const { data: contratoData } = await supabase
          .from('contratos')
          .select('*')
          .eq('cliente_id', clienteId)
          .eq('ativo', true)
          .single()

        setContrato(contratoData)

        if (contratoData) {
          // Carregar ciclo atual
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
            // Carregar entregas do ciclo
            const { data: entregasData } = await supabase
              .from('entregas')
              .select('*')
              .eq('ciclo_id', cicloData.id)
              .order('created_at', { ascending: false })

            setEntregas(entregasData || [])
          }
        }

        // Carregar serviços
        const { data: servicosData } = await supabase
          .from('servicos')
          .select('*')
          .eq('ativo', true)

        setServicos(servicosData || [])
      } catch (error) {
        console.error('Erro:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [clienteId])

  const handleCriarCiclo = async () => {
    if (!contrato) {
      alert('Precisa ter um contrato para criar ciclo')
      return
    }

    try {
      const proximoMes = new Date()
      proximoMes.setMonth(proximoMes.getMonth() + 1)
      const mes = proximoMes.getMonth() + 1
      const ano = proximoMes.getFullYear()

      const { data: novoCiclo, error } = await supabase
        .from('ciclos')
        .insert([
          {
            cliente_id: clienteId,
            contrato_id: contrato.id,
            mes,
            ano,
            creditos_disponiveis: contrato.creditos_mensais,
            creditos_usados: 0,
            status: 'ativo',
          },
        ])
        .select()
        .single()

      if (error) throw error

      setCiclo(novoCiclo)
      alert(`Ciclo criado para ${mes}/${ano}!`)
    } catch (error) {
      alert('Erro ao criar ciclo')
      console.error(error)
    }
  }

  const handleRegistrarEntrega = async () => {
    if (!ciclo || !contrato) return

    const servico = servicos.find((s) => s.id === modalData.servico_id)
    if (!servico) return

    let creditos = servico.creditos ?? 0
    if (modalData.revisao) {
      creditos = Math.ceil(creditos * 1.2)
    }

    const totalCreditos = creditos + modalData.creditos_extra

    // Validar saldo
    if (ciclo.creditos_restantes < totalCreditos) {
      alert(`Créditos insuficientes. Disponível: ${ciclo.creditos_restantes}, Necessário: ${totalCreditos}`)
      return
    }

    try {
      // Criar entrega
      const { error: entregaError } = await supabase
        .from('entregas')
        .insert([
          {
            ciclo_id: ciclo.id,
            cliente_id: clienteId,
            servico_id: modalData.servico_id,
            nome: modalData.nome,
            creditos_cobrados: totalCreditos,
            revisao: modalData.revisao,
            creditos_extra: modalData.creditos_extra,
            status: 'pendente',
            observacoes: modalData.observacoes || null,
          },
        ])

      if (entregaError) throw entregaError

      // Atualizar ciclo
      const novoCreditos = ciclo.creditos_usados + totalCreditos
      const { error: cicloError } = await supabase
        .from('ciclos')
        .update({ creditos_usados: novoCreditos })
        .eq('id', ciclo.id)

      if (cicloError) throw cicloError

      // Registrar histórico
      const { error: historicoError } = await supabase
        .from('historico_creditos')
        .insert([
          {
            ciclo_id: ciclo.id,
            cliente_id: clienteId,
            tipo: 'debito',
            quantidade: totalCreditos,
            motivo: `Entrega: ${modalData.nome}`,
          },
        ])

      if (historicoError) throw historicoError

      // Atualizar UI
      setCiclo({ ...ciclo, creditos_usados: novoCreditos })
      setShowModal(false)
      setModalData({ servico_id: '', nome: '', revisao: false, creditos_extra: 0, observacoes: '' })

      // Recarregar entregas
      const { data: entregasData } = await supabase
        .from('entregas')
        .select('*')
        .eq('ciclo_id', ciclo.id)
        .order('created_at', { ascending: false })

      setEntregas(entregasData || [])
    } catch (error) {
      alert('Erro ao registrar entrega')
      console.error(error)
    }
  }

  if (loading) return <div className="p-8 text-center">Carregando...</div>
  if (!cliente) return <div className="p-8 text-center">Cliente não encontrado</div>

  const creditosPorcentagem = ciclo
    ? (ciclo.creditos_usados / ciclo.creditos_disponiveis) * 100
    : 0

  return (
    <div className="min-h-screen bg-[#F8F8F6]">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Link href="/admin/clientes" className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-8">
          <ArrowLeft size={20} />
          Voltar
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#1A1A1A]">{cliente.nome}</h1>
          {cliente.empresa && <p className="text-gray-600">{cliente.empresa}</p>}
        </div>

        {!contrato && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-12">
            <p className="text-amber-800 mb-4">Este cliente não possui um contrato ativo. Configure um plano para começar.</p>
            <Link
              href={`/admin/clientes/${clienteId}/editar`}
              className="inline-flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded-lg transition"
            >
              Configurar Plano
            </Link>
          </div>
        )}

        {!ciclo && contrato && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-12 text-center">
            <p className="text-gray-600 mb-4">Nenhum ciclo ativo para este mês</p>
            <button
              onClick={handleCriarCiclo}
              className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition"
            >
              <Plus size={20} />
              Criar Ciclo
            </button>
          </div>
        )}

        {ciclo && contrato && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <p className="text-gray-600 text-sm mb-2">Plano Contratado</p>
                <p className="text-2xl font-bold text-[#1A1A1A]">{contrato.nome}</p>
                <p className="text-sm text-gray-600 mt-2">R${contrato.valor_mensal / 100}</p>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <p className="text-gray-600 text-sm mb-4">Saldo de Créditos</p>
                <div className="mb-4">
                  <div className="flex justify-between mb-2">
                    <span className="font-bold text-[#1A1A1A]">{ciclo.creditos_restantes} créditos</span>
                    <span className="text-sm text-gray-600">{Math.round(creditosPorcentagem)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-blue-600 h-full transition-all"
                      style={{ width: `${Math.min(creditosPorcentagem, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    {ciclo.creditos_usados} de {ciclo.creditos_disponiveis} usados
                  </p>
                </div>

                <button
                  onClick={() => setShowModal(true)}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
                >
                  <Plus size={20} />
                  Registrar Entrega
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="font-bold text-[#1A1A1A]">Entregas do Mês</h2>
              </div>
              {entregas.length === 0 ? (
                <div className="px-6 py-12 text-center text-gray-600">Nenhuma entrega registrada ainda</div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-medium">Nome</th>
                      <th className="px-6 py-3 text-left text-sm font-medium">Créditos</th>
                      <th className="px-6 py-3 text-left text-sm font-medium">Status</th>
                      <th className="px-6 py-3 text-left text-sm font-medium">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entregas.map((entrega) => (
                      <tr key={entrega.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-[#1A1A1A]">{entrega.nome}</td>
                        <td className="px-6 py-4 text-sm font-medium">{entrega.creditos_cobrados}</td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              entrega.status === 'aprovado'
                                ? 'bg-green-100 text-green-700'
                                : entrega.status === 'entregue'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {entrega.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{new Date(entrega.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {showModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4">
                  <h3 className="text-xl font-bold text-[#1A1A1A]">Registrar Entrega</h3>

                  <div>
                    <label className="block text-sm font-medium text-[#1A1A1A] mb-1">Serviço</label>
                    <select
                      value={modalData.servico_id}
                      onChange={(e) => setModalData({ ...modalData, servico_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="">Selecionar...</option>
                      {servicos.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.nome} ({s.creditos} cr)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#1A1A1A] mb-1">Descrição</label>
                    <input
                      type="text"
                      value={modalData.nome}
                      onChange={(e) => setModalData({ ...modalData, nome: e.target.value })}
                      placeholder="ex: Banner para newsletter"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={modalData.revisao}
                      onChange={(e) => setModalData({ ...modalData, revisao: e.target.checked })}
                      className="rounded"
                    />
                    <label className="text-sm text-[#1A1A1A]">É uma revisão? (+20%)</label>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setShowModal(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleRegistrarEntrega}
                      className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
                    >
                      Registrar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
