// @ts-nocheck
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import type { Cliente, Plano, Contrato } from '@/lib/types'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function EditarClientePage() {
  const params = useParams()
  const router = useRouter()
  const clienteId = params.id as string
  const supabase = createClient()

  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [contrato, setContrato] = useState<Contrato | null>(null)
  const [planos, setPlanos] = useState<Plano[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedPlanoId, setSelectedPlanoId] = useState('')
  const [error, setError] = useState('')

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

        if (contratoData) {
          setContrato(contratoData)
          setSelectedPlanoId(contratoData.plano_id || '')
        }

        // Carregar planos
        const { data: planosData } = await supabase
          .from('planos')
          .select('*')
          .eq('ativo', true)

        setPlanos(planosData || [])
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
        setError('Erro ao carregar dados')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [clienteId])

  const handleSalvar = async () => {
    if (!selectedPlanoId) {
      setError('Selecione um plano')
      return
    }

    const plano = planos.find((p) => p.id === selectedPlanoId)
    if (!plano) {
      setError('Plano não encontrado')
      return
    }

    setSaving(true)
    setError('')

    try {
      if (contrato) {
        // Atualizar contrato existente
        const { error: updateError } = await supabase
          .from('contratos')
          .update({
            plano_id: selectedPlanoId,
            nome: plano.nome,
            creditos_mensais: plano.creditos_mensais,
            valor_mensal: plano.valor_mensal,
            valor_credito_avulso: plano.valor_credito_avulso || 14,
          })
          .eq('id', contrato.id)

        if (updateError) throw updateError

        setContrato({
          ...contrato,
          plano_id: selectedPlanoId,
          nome: plano.nome,
          creditos_mensais: plano.creditos_mensais,
          valor_mensal: plano.valor_mensal,
        })
      } else {
        // Criar novo contrato
        const { data: novoContrato, error: createError } = await supabase
          .from('contratos')
          .insert([
            {
              cliente_id: clienteId,
              plano_id: selectedPlanoId,
              nome: plano.nome,
              creditos_mensais: plano.creditos_mensais,
              valor_mensal: plano.valor_mensal,
              valor_credito_avulso: plano.valor_credito_avulso || 14,
              data_inicio: new Date().toISOString().split('T')[0],
              ativo: true,
            },
          ])
          .select()
          .single()

        if (createError) throw createError

        if (novoContrato) {
          setContrato(novoContrato)

          // Criar ciclo do mês atual
          const hoje = new Date()
          const { error: cicloError } = await supabase
            .from('ciclos')
            .insert([
              {
                cliente_id: clienteId,
                contrato_id: novoContrato.id,
                mes: hoje.getMonth() + 1,
                ano: hoje.getFullYear(),
                creditos_disponiveis: plano.creditos_mensais,
                creditos_usados: 0,
                status: 'ativo',
              },
            ])

          if (cicloError) throw cicloError
        }
      }

      router.push(`/admin/clientes/${clienteId}`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao salvar'
      console.error('Erro:', errorMessage)
      setError(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-8 text-center">Carregando...</div>
  if (!cliente) return <div className="p-8 text-center">Cliente não encontrado</div>

  return (
    <div className="min-h-screen bg-[#F8F8F6]">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link href={`/admin/clientes/${clienteId}`} className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-8">
          <ArrowLeft size={20} />
          Voltar
        </Link>

        <h1 className="text-3xl font-bold text-[#1A1A1A] mb-8">Configurar Plano - {cliente.nome}</h1>

        <div className="bg-white rounded-lg border border-gray-200 p-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-4">Selecionar Plano</label>
            <div className="space-y-3">
              {planos.map((plano) => (
                <label
                  key={plano.id}
                  className="flex items-start gap-4 p-4 border-2 rounded-lg cursor-pointer transition"
                  style={{
                    borderColor: selectedPlanoId === plano.id ? '#2563eb' : '#e5e7eb',
                    backgroundColor: selectedPlanoId === plano.id ? '#eff6ff' : '#ffffff',
                  }}
                >
                  <input
                    type="radio"
                    name="plano"
                    value={plano.id}
                    checked={selectedPlanoId === plano.id}
                    onChange={(e) => setSelectedPlanoId(e.target.value)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-[#1A1A1A]">{plano.nome}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {plano.creditos_mensais} créditos/mês • R${(plano.valor_mensal / 100).toFixed(2)}/mês
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}

          <div className="flex gap-3 pt-4">
            <Link
              href={`/admin/clientes/${clienteId}`}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 text-center"
            >
              Cancelar
            </Link>
            <button
              onClick={handleSalvar}
              disabled={saving || !selectedPlanoId}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition"
            >
              {saving ? 'Salvando...' : 'Salvar Plano'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
