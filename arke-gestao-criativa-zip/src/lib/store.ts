import { create } from 'zustand';
import { supabase } from './supabase/client';
import * as queries from './supabase/queries';
import { verificarOuCriarCicloMesAtual } from './utils/ciclos';

// --- Tipos Baseados na Spec ---
export type StatusTarefa = 'triagem' | 'backlog' | 'a_fazer' | 'em_andamento' | 'em_revisao' | 'aprovado' | 'entregue' | 'arquivado';
export type Prioridade = 'baixa' | 'normal' | 'alta' | 'urgente';
export type Origem = 'arke' | 'slack' | 'trello' | 'clickup' | 'notion' | 'whatsapp' | 'painel_cliente' | 'manual';

export interface Cliente {
  id: string;
  nome: string;
  empresa?: string;
  email?: string;
  whatsapp?: string;
  tipo: 'keep' | 'build' | 'craft' | 'avulso';
  cor_tema: string;
  creditos_mensais: number;
  creditos_usados: number;
  creditos_restantes: number;
}

export interface Tarefa {
  id: string;
  cliente_id: string;
  titulo: string;
  descricao?: string;
  status: StatusTarefa;
  prioridade: Prioridade;
  creditos_cobrados?: number;
  origem: Origem;
  data_vencimento?: string;
  responsavel_id?: string;
  canal_label?: string; // Para triagem original
  conteudo_original?: string; // Para triagem original
  link_entrega?: string;
  link_arquivo?: string;
  tags?: string[];
  servico?: string;
  numero_revisao?: number;
  creditos_revisao?: number;
  e_revisao?: boolean;
  projeto_id?: string;
  projeto?: { nome: string; cor?: string };
  credito_avulso?: boolean;
  valor_avulso?: number;
  metadata?: any;
}

export interface Subtarefa {
  id: string;
  titulo: string;
  concluida: boolean;
}

export interface Comentario {
  id: string;
  autor: string | { nome: string; role?: string };
  role_autor?: string;
  role?: string;
  conteudo: string;
  interno: boolean;
  data?: string;
  created_at?: string;
  origem?: Origem;
}

export interface Atividade {
  id: string;
  texto: string;
  data: string;
  autor: string;
}

export interface Projeto {
  id: string;
  nome: string;
  cliente_id: string;
  tipo: string;
  status: string;
  descricao?: string;
  data_inicio?: string;
  data_prazo?: string;
  cliente?: {
    nome: string;
    tipo: string;
    cor_tema?: string;
  };
}

export interface Fatura {
  id: string;
  valor: number;
  descricao: string;
  status: 'pendente' | 'paga' | 'cancelada';
  data: string;
}

export interface Servico {
  id: string;
  nome: string;
  creditos_padrao: number;
  categoria: string;
}

export interface Template {
  id: string;
  nome: string;
  categoria: string;
  creditos_padrao: number;
  subtarefas_padrao: string[];
}

export interface Profile {
  id: string;
  nome: string;
  funcao?: string;
}

export interface Configuracoes {
  valorCredito: string;
  revisaoPadrao: string;
}

export interface TriagemItem {
  id: string;
  tarefa_id?: string;
  cliente_id?: string;
  tipo: 'demanda' | 'novo_cliente' | 'novo_projeto';
  status_triagem: 'aguardando' | 'incompleto' | 'liberado';
  canal: string;
  canal_label?: string;
  conteudo_original?: string;
  dados_extras?: any;
  created_at: string;
  tarefa?: Tarefa;
  cliente?: Cliente;
}

export interface EntregaProjeto {
  id: string;
  projeto_id: string;
  cliente_id: string;
  titulo: string;
  descricao?: string;
  tipo_entrega: 'link' | 'arquivo_hospedado' | 'drive';
  url?: string;
  nome_arquivo?: string;
  disponivel_ate?: string;
  created_at: string;
}

export interface Avaliacao {
  id: string;
  projeto_id: string;
  cliente_id: string;
  nota: number;
  created_at: string;
}

// --- Interface da Store ---
interface ArkeStore {
  clientes: Cliente[];
  tarefas: Tarefa[];
  subtarefas: Record<string, Subtarefa[]>;
  comentarios: Record<string, Comentario[]>;
  atividades: Record<string, Atividade[]>;
  projetos: Projeto[];
  faturas: Fatura[];
  configuracoes: Configuracoes;
  servicos: Servico[];
  timeMembers: Profile[];
  templates: Template[];
  triagemItens: TriagemItem[];
  entregasProjeto: EntregaProjeto[];
  avaliacoes: Avaliacao[];
  isLoading: boolean;

  // Ações
  carregarDadosIniciais: () => Promise<void>;
  aprovarTriagem: (tarefaId: string, dados: Partial<Tarefa>) => Promise<void>;
  arquivarTriagem: (tarefaId: string) => Promise<void>;
  moverTarefaKanban: (tarefaId: string, novoStatus: StatusTarefa) => Promise<void>;
  adicionarTarefa: (tarefa: Partial<Tarefa>) => Promise<Tarefa | undefined>;
  adicionarCliente: (cliente: Partial<Cliente>) => Promise<Cliente>;
  atualizarTarefa: (tarefaId: string, dados: Partial<Tarefa>) => Promise<void>;
  toggleSubtarefa: (tarefaId: string, subtarefaId: string, concluida: boolean) => Promise<void>;
  adicionarSubtarefa: (tarefaId: string, titulo: string, ordem?: number) => Promise<void>;
  excluirSubtarefa: (tarefaId: string, subtarefaId: string) => Promise<void>;
  adicionarComentario: (tarefaId: string, comentario: any) => Promise<void>;
  adicionarProjeto: (projeto: Partial<Projeto>) => Promise<void>;
  adicionarFatura: (fatura: Omit<Fatura, 'id' | 'data'>) => void;
  atualizarFaturaStatus: (faturaId: string, status: Fatura['status']) => void;
  salvarConfiguracoes: (configuracoes: Partial<Configuracoes>) => void;
  adicionarTriagemItem: (item: any) => Promise<any>;
  atualizarTriagemItem: (id: string, dados: any) => Promise<any>;
}

// --- Store Zustand ---
export const useArkeStore = create<ArkeStore>((set, get) => ({
  clientes: [],
  tarefas: [],
  subtarefas: {},
  comentarios: {},
  atividades: {},
  projetos: [],
  faturas: [],
  servicos: [],
  timeMembers: [],
  templates: [],
  triagemItens: [],
  entregasProjeto: [],
  avaliacoes: [],
  configuracoes: {
    valorCredito: '14.00',
    revisaoPadrao: '20'
  },
  isLoading: false,

  carregarDadosIniciais: async () => {
    set({ isLoading: true });
    try {
      const [clientesData, tarefasData, servicosData, timeMembersData, projetosData, templatesData, triagemItensData] = await Promise.all([
        queries.fetchClientes(),
        queries.fetchTarefas(),
        queries.fetchServicos(),
        queries.fetchTimeMembers(),
        queries.fetchProjetos(),
        queries.fetchTemplates(),
        queries.fetchTriagemItens()
      ]);
      
      const contratosKeep = await queries.fetchContratosKeepAtivos();
      await Promise.all(
        contratosKeep.map(c => verificarOuCriarCicloMesAtual(c.cliente_id, c.id, c.creditos_mensais))
      );

      set({ 
        clientes: clientesData as Cliente[] || [], 
        tarefas: tarefasData as Tarefa[] || [],
        servicos: servicosData as Servico[] || [],
        timeMembers: timeMembersData as Profile[] || [],
        projetos: projetosData as Projeto[] || [],
        templates: templatesData as Template[] || [],
        triagemItens: triagemItensData as TriagemItem[] || [],
        isLoading: false 
      });
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      set({ isLoading: false });
    }
  },
  
  aprovarTriagem: async (tarefaId, dados) => {
    try {
      const updated = await queries.updateTarefaComTriagem(tarefaId, { ...dados, status: 'a_fazer' });
      set((state) => ({
        tarefas: state.tarefas.map(t => t.id === tarefaId ? updated : t)
      }));
    } catch (error) {
       console.error("Erro ao aprovar:", error);
    }
  },

  arquivarTriagem: async (tarefaId) => {
    try {
       const updated = await queries.updateTarefa(tarefaId, { status: 'arquivado' });
       set((state) => ({
         tarefas: state.tarefas.map(t => t.id === tarefaId ? updated : t)
       }));
    } catch (error) {
       console.error("Erro ao arquivar:", error);
    }
  },

  moverTarefaKanban: async (tarefaId, novoStatus) => {
    try {
       const updated = await queries.updateTarefa(tarefaId, { status: novoStatus });
       set((state) => ({
         tarefas: state.tarefas.map(t => t.id === tarefaId ? updated : t)
       }));
    } catch (error) {
       console.error("Erro ao mover:", error);
    }
  },

  adicionarTarefa: async (tarefa) => {
    try {
       const nova = await queries.createTarefa(tarefa);
       set((state) => ({
         tarefas: [nova, ...state.tarefas]
       }));
       return nova;
    } catch (error) {
       console.error("Erro ao adicionar:", error);
       throw error;
    }
  },

  adicionarCliente: async (cliente) => {
    try {
      const novo = await queries.createCliente(cliente);
      set((state) => ({
        clientes: [...state.clientes, novo]
      }));
      return novo;
    } catch (error) {
      console.error("Erro ao adicionar cliente:", error);
      throw error;
    }
  },

  atualizarTarefa: async (tarefaId, dados) => {
    try {
       const updated = await queries.updateTarefa(tarefaId, dados);
       set((state) => ({
         tarefas: state.tarefas.map(t => t.id === tarefaId ? updated : t)
       }));
    } catch (error) {
       console.error("Erro ao atualizar:", error);
       throw error; // re-throw to allow component to handle/revert
    }
  },

  toggleSubtarefa: async (tarefaId, subtarefaId, concluida) => {
    try {
      await queries.updateSubtarefa(subtarefaId, { concluida });
    } catch (error) {
      console.error("Erro ao alternar subtarefa:", error);
      throw error;
    }
  },

  adicionarSubtarefa: async (tarefaId, titulo, ordem = 0) => {
    try {
      await queries.createSubtarefa({ tarefa_id: tarefaId, titulo, ordem, concluida: false });
    } catch (error) {
      console.error("Erro ao adicionar subtarefa:", error);
      throw error;
    }
  },

  excluirSubtarefa: async (tarefaId, subtarefaId) => {
    try {
      await queries.deleteSubtarefa(subtarefaId);
    } catch (error) {
      console.error("Erro ao excluir subtarefa:", error);
      throw error;
    }
  },

  adicionarComentario: async (tarefaId, comentario) => {
    try {
      await queries.createComentario({ tarefa_id: tarefaId, ...comentario });
    } catch (error) {
      console.error("Erro ao adicionar comentario:", error);
      throw error;
    }
  },

  // Novas ações
  adicionarProjeto: async (projeto) => {
    try {
      const novo = await queries.createProjeto(projeto);
      set((state) => ({
        projetos: [novo, ...state.projetos]
      }));
    } catch (error) {
      console.error("Erro ao adicionar projeto:", error);
    }
  },

  adicionarFatura: (fatura) => set((state) => ({
    faturas: [...state.faturas, { ...fatura, id: Math.random().toString(), data: new Date().toISOString() }]
  })),

  atualizarFaturaStatus: (faturaId, status) => set((state) => ({
    faturas: state.faturas.map(f => f.id === faturaId ? { ...f, status } : f)
  })),

  salvarConfiguracoes: (novasConfigs) => set((state) => ({
    configuracoes: { ...state.configuracoes, ...novasConfigs }
  })),

  adicionarTriagemItem: async (item) => {
    try {
      const { data, error } = await supabase.from('triagem_itens').insert([item]).select().single();
      if (error) throw error;
      set((state) => ({ triagemItens: [data, ...state.triagemItens] }));
      return data;
    } catch (e) { console.error('Erro:', e); throw e; }
  },

  atualizarTriagemItem: async (id, dados) => {
    try {
      const { data, error } = await supabase.from('triagem_itens').update(dados).eq('id', id).select().single();
      if (error) throw error;
      set((state) => ({ triagemItens: state.triagemItens.map(t => t.id === id ? data : t) }));
      return data;
    } catch (e) { console.error('Erro:', e); throw e; }
  }
}));
