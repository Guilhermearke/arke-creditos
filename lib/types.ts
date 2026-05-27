export type Role = 'admin' | 'cliente' | 'time'

export type TipoCliente = 'keep' | 'build' | 'craft' | 'avulso'

export type StatusTarefa =
  | 'triagem'
  | 'backlog'
  | 'a_fazer'
  | 'em_andamento'
  | 'em_revisao'
  | 'aprovado'
  | 'entregue'
  | 'arquivado'

export type Prioridade = 'baixa' | 'normal' | 'alta' | 'urgente'

export type Canal = 'slack' | 'trello' | 'clickup' | 'notion' | 'whatsapp' | 'email' | 'painel_cliente' | 'manual'

export type OrigemTarefa = 'arke' | 'slack' | 'trello' | 'clickup' | 'notion' | 'whatsapp' | 'painel_cliente' | 'manual'

export type CategoriaServico = 'criativo' | 'apresentacao' | 'impresso' | 'video' | 'motion' | 'web' | 'identidade' | 'outro' | 'Geral'

// ── Entidades ──────────────────────────────────────────────────

export interface Profile {
  id: string
  nome: string
  email?: string
  role: Role
  cliente_id?: string
  avatar_url?: string
  funcao?: string
  ativo: boolean
  created_at: string
}

export interface Cliente {
  id: string
  nome: string
  empresa?: string
  email?: string
  whatsapp?: string
  tipo: TipoCliente
  ativo: boolean
  cor_tema: string
  logo_url?: string
  slack_channel_id?: string
  slack_webhook_url?: string
  trello_board_id?: string
  clickup_list_id?: string
  created_at: string
}

export interface Plano {
  id: string
  nome: string
  creditos_mensais: number
  valor_mensal: number
  valor_credito_base?: number
  valor_credito_avulso: number
  revisao_percentual: number
  revisoes_incluidas: number
  creditos_acumulam: boolean
  ativo: boolean
  created_at: string
}

export interface Contrato {
  id: string
  cliente_id: string
  plano_id?: string
  nome?: string
  nome_plano?: string
  creditos_mensais: number
  valor_mensal: number
  valor_credito?: number
  valor_credito_avulso: number
  revisao_percentual: number
  revisoes_incluidas: number
  creditos_acumulam: boolean
  valor_projeto?: number
  data_inicio: string
  data_renovacao?: string
  observacoes?: string
  ativo: boolean
  created_at: string
}

export interface Ciclo {
  id: string
  contrato_id: string
  cliente_id: string
  mes: number
  ano: number
  creditos_disponiveis: number
  creditos_usados: number
  creditos_restantes: number
  status: 'ativo' | 'encerrado'
  created_at: string
}

export interface Servico {
  id: string
  nome: string
  creditos_padrao?: number
  categoria: CategoriaServico
  descricao?: string
  ativo: boolean
  created_at: string
}

export interface Projeto {
  id: string
  cliente_id: string
  contrato_id?: string
  nome: string
  tipo?: 'build' | 'craft' | 'avulso'
  status: 'briefing' | 'em_andamento' | 'revisao' | 'aprovado' | 'entregue' | 'pausado' | 'cancelado'
  descricao?: string
  data_inicio?: string
  data_prazo?: string
  created_at: string
}

export interface Tarefa {
  id: string
  cliente_id: string
  ciclo_id?: string
  projeto_id?: string
  servico_id?: string
  responsavel_id?: string
  criado_por?: string
  titulo: string
  descricao?: string
  tipo_cliente: TipoCliente
  // créditos
  creditos_cobrados?: number
  e_revisao: boolean
  numero_revisao: number
  creditos_revisao: number
  credito_avulso: boolean
  valor_avulso?: number
  // status
  status: StatusTarefa
  prioridade: Prioridade
  data_vencimento?: string
  data_entrega?: string
  // entrega
  link_entrega?: string
  link_arquivo?: string
  // visibilidade
  visivel_cliente: boolean
  // integrações
  trello_card_id?: string
  clickup_task_id?: string
  slack_message_ts?: string
  origem: OrigemTarefa
  tags: string[]
  created_at: string
  updated_at: string
  // joins opcionais
  cliente?: Cliente
  responsavel?: Profile
  servico?: Servico
  subtarefas?: Subtarefa[]
  comentarios?: Comentario[]
  triagem_item?: TriagemItem
}

export interface TriagemItem {
  id: string
  tarefa_id: string
  cliente_id: string
  canal: Canal
  canal_label?: string
  conteudo_original?: string
  triado_por?: string
  triado_em?: string
  created_at: string
}

export interface Subtarefa {
  id: string
  tarefa_id: string
  titulo: string
  concluida: boolean
  ordem: number
  created_at: string
}

export interface Comentario {
  id: string
  tarefa_id: string
  autor_id?: string
  role_autor: Role
  conteudo: string
  interno: boolean
  origem?: 'arke' | 'slack' | 'trello' | 'clickup'
  origem_id?: string
  enviado_slack: boolean
  enviado_trello: boolean
  enviado_clickup: boolean
  created_at: string
  // join
  autor?: Profile
}

export interface Anexo {
  id: string
  tarefa_id: string
  nome: string
  url: string
  tipo?: 'imagem' | 'pdf' | 'link' | 'figma' | 'drive' | 'outro'
  enviado_por?: string
  created_at: string
}

export interface Aprovacao {
  id: string
  tarefa_id: string
  cliente_id: string
  aprovado: boolean
  observacao?: string
  created_at: string
}

export interface TemplateTarefa {
  id: string
  nome: string
  categoria?: string
  servico_id?: string
  creditos_padrao?: number
  descricao?: string
  subtarefas_padrao: string[]
  tags_padrao: string[]
  ativo: boolean
  created_at: string
}

export interface HistoricoCredito {
  id: string
  ciclo_id: string
  cliente_id: string
  tipo: 'debito' | 'credito' | 'ajuste'
  quantidade: number
  motivo?: string
  tarefa_id?: string
  created_by?: string
  created_at: string
}

// Tipos legados (manter compatibilidade)
export interface Entrega {
  id: string
  ciclo_id: string
  cliente_id: string
  servico_id?: string
  responsavel_id?: string
  nome: string
  creditos_cobrados: number
  revisao: boolean
  status: string
  link_entrega?: string
  created_at: string
}

export type StatusEntrega = 'pendente' | 'em_andamento' | 'em_revisao' | 'concluida' | 'cancelada' | 'entregue' | 'aprovado'

// ── Helpers de label/cor ──────────────────────────────────────

export const STATUS_LABEL: Record<StatusTarefa, string> = {
  triagem: 'Triagem',
  backlog: 'Backlog',
  a_fazer: 'A fazer',
  em_andamento: 'Em andamento',
  em_revisao: 'Em revisão',
  aprovado: 'Aprovado',
  entregue: 'Entregue',
  arquivado: 'Arquivado',
}

export const PRIORIDADE_LABEL: Record<Prioridade, string> = {
  baixa: 'Baixa',
  normal: 'Normal',
  alta: 'Alta',
  urgente: 'Urgente',
}

export const TIPO_LABEL: Record<TipoCliente, string> = {
  keep: 'Keep',
  build: 'Build',
  craft: 'Craft',
  avulso: 'Avulso',
}

export const CANAL_LABEL: Record<Canal, string> = {
  slack: 'Slack',
  trello: 'Trello',
  clickup: 'ClickUp',
  notion: 'Notion',
  whatsapp: 'WhatsApp',
  email: 'E-mail',
  painel_cliente: 'Painel',
  manual: 'Manual',
}

export const KANBAN_COLUMNS: StatusTarefa[] = [
  'backlog', 'a_fazer', 'em_andamento', 'em_revisao', 'aprovado', 'entregue'
]
