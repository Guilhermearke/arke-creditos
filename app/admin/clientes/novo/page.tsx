'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NovoClientePage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const [formData, setFormData] = useState({
    nome: '',
    empresa: '',
    email: '',
    whatsapp: '',
    plano: 'Keep Essential',
    data_inicio: new Date().toISOString().split('T')[0],
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Criar cliente
      const { data: clienteData, error: clienteError } = await supabase
        .from('clientes')
        .insert([
          {
            nome: formData.nome,
            empresa: formData.empresa || null,
            email: formData.email || null,
            whatsapp: formData.whatsapp || null,
            ativo: true,
          },
        ])
        .select()
        .single()

      if (clienteError) throw clienteError

      // Obter plano selecionado
      const { data: planoData } = await supabase
        .from('planos')
        .select('*')
        .eq('nome', formData.plano)
        .single()

      if (planoData) {
        // Criar contrato
        const { error: contratoError } = await supabase
          .from('contratos')
          .insert([
            {
              cliente_id: clienteData.id,
              plano_id: planoData.id,
              nome_plano: formData.plano,
              creditos_mensais: planoData.creditos_mensais,
              valor_mensal: planoData.valor_mensal,
              valor_credito_avulso: 14,
              data_inicio: formData.data_inicio,
              ativo: true,
            },
          ])

        if (contratoError) throw contratoError

        // Criar ciclo do mês atual
        const hoje = new Date()
        const { error: cicloError } = await supabase
          .from('ciclos')
          .insert([
            {
              cliente_id: clienteData.id,
              contrato_id: clienteData.id,
              mes: hoje.getMonth() + 1,
              ano: hoje.getFullYear(),
              creditos_disponveis: planoData.creditos_mensais,
              creditos_usados: 0,
              status: 'ativo',
            },
          ])

        if (cicloError) throw cicloError
      }

      router.push(`/admin/clientes/${clienteData.id}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar cliente')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F8F6]">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link href="/admin/clientes" className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-8">
          <ArrowLeft size={20} />
          Voltar
        </Link>

        <h1 className="text-3xl font-bold text-[#1A1A1A] mb-8">Novo Cliente</h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Nome *</label>
            <input
              type="text"
              required
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Empresa</label>
            <input
              type="text"
              value={formData.empresa}
              onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-2">WhatsApp</label>
            <input
              type="tel"
              value={formData.whatsapp}
              onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Plano *</label>
            <select
              required
              value={formData.plano}
              onChange={(e) => setFormData({ ...formData, plano: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option>Keep Essential</option>
              <option>Keep Scale</option>
              <option>Keep Boost</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Data de Início *</label>
            <input
              type="date"
              required
              value={formData.data_inicio}
              onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition"
          >
            {loading ? 'Criando...' : 'Criar Cliente'}
          </button>
        </form>
      </div>
    </div>
  )
}
