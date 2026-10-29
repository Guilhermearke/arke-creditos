// @ts-nocheck
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

type ClienteTipo = 'keep' | 'build' | 'craft' | 'avulso'

export default function NovoClientePage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const [formData, setFormData] = useState<{
    nome: string
    empresa: string
    email: string
    whatsapp: string
    tipo: ClienteTipo
    plano: string
    data_inicio: string
  }>({
    nome: '',
    empresa: '',
    email: '',
    whatsapp: '',
    tipo: 'keep',
    plano: 'Keep Essential',
    data_inicio: new Date().toISOString().split('T')[0],
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Criar cliente
      console.log('[1] Iniciando criação de cliente com tipo:', formData.tipo)
      const { data: clienteData, error: clienteError } = await supabase
        .from('clientes')
        .insert([
          {
            nome: formData.nome,
            empresa: formData.empresa || null,
            email: formData.email || null,
            whatsapp: formData.whatsapp || null,
            tipo: formData.tipo,
            ativo: true,
          },
        ])
        .select()
        .single()

      console.log('[2] Cliente criado:', { clienteData, clienteError })
      if (clienteError) throw clienteError
      if (!clienteData) throw new Error('Cliente não foi criado')

      // Obter plano selecionado
      console.log('[3] Procurando plano:', formData.plano)
      const { data: planoData, error: planoError } = await supabase
        .from('planos')
        .select('*')
        .eq('nome', formData.plano)
        .single()

      console.log('[4] Resultado plano:', { planoData, planoError })
      if (planoError) throw planoError
      if (!planoData) throw new Error('Plano não encontrado')

      // Criar contrato
      console.log('[5] Criando contrato com dados:', {
        cliente_id: clienteData.id,
        plano_id: planoData.id,
        creditos_mensais: planoData.creditos_mensais,
        valor_mensal: planoData.valor_mensal,
      })

      const { data: contratoData, error: contratoError } = await supabase
        .from('contratos')
        .insert([
          {
            cliente_id: clienteData.id,
            plano_id: planoData.id,
            nome: formData.plano,
            creditos_mensais: planoData.creditos_mensais,
            valor_mensal: planoData.valor_mensal,
            valor_credito_avulso: planoData.valor_credito_avulso || 14,
            data_inicio: formData.data_inicio,
            ativo: true,
          },
        ])
        .select('id')
        .single()

      console.log('[6] Contrato criado:', { contratoData, contratoError })
      if (contratoError) throw contratoError
      if (!contratoData) throw new Error('Contrato não foi criado')

      // Criar ciclo do mês atual
      const hoje = new Date()
      console.log('[7] Criando ciclo com dados:', {
        cliente_id: clienteData.id,
        contrato_id: contratoData.id,
        mes: hoje.getMonth() + 1,
        ano: hoje.getFullYear(),
        creditos_disponiveis: planoData.creditos_mensais,
      })

      const { data: cicloData, error: cicloError } = await supabase
        .from('ciclos')
        .insert([
          {
            cliente_id: clienteData.id,
            contrato_id: contratoData.id,
            mes: hoje.getMonth() + 1,
            ano: hoje.getFullYear(),
            creditos_disponiveis: planoData.creditos_mensais,
            creditos_usados: 0,
            status: 'ativo',
          },
        ])
        .select('id')
        .single()

      console.log('[8] Ciclo criado:', { cicloData, cicloError })
      if (cicloError) throw cicloError
      if (!cicloData) throw new Error('Ciclo não foi criado')

      console.log('[9] ✅ Cliente criado com sucesso!')
      router.push(`/admin/clientes/${clienteData.id}`)
      router.refresh()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao criar cliente'
      console.error('[❌ ERRO]', errorMessage, err)
      setError(errorMessage)
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
            <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Tipo de Cliente *</label>
            <select
              required
              value={formData.tipo}
              onChange={(e) => setFormData({ ...formData, tipo: e.target.value as 'keep' | 'build' | 'craft' | 'avulso' })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="keep">Keep (Créditos)</option>
              <option value="build">Build (Escopo)</option>
              <option value="craft">Craft (Mensal)</option>
              <option value="avulso">Avulso (Pontual)</option>
            </select>
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
