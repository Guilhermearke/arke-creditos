export type Role = 'admin' | 'cliente' | 'time'

export interface Cliente {
  id: string
  nome: string
  empresa?: string
  email?: string
  whatsapp?: string
  ativo: boolean
  created_at: string
}

export interface Plano {
  id: string
  nome: string
  creditos_mensais: number
  valor_mensal: number
  ativo: boolean
  created_at: string
}

export interface Contrato {
  id: string
  cliente_id: string
  plano_id?: string
  nome_plano: string
  creditos_mensais: number
  valor_mensal: number
  ativo: boolean
  created_at: string
}

export interface Ciclo {
  id: string
  contrato_id: string
  cliente_id: string
  mes: number
  ano: number
  creditos_disponveis: number
  creditos_usados: number
  creditos_restantes: number
  status: 'ativo' | 'encerrado'
  created_at: string
}

export interface Servico {
  id: string
  nome: string
  creditos: number
  categoria: string
  ativo: boolean
  created_at: string
}
