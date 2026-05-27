import { supabase } from './client';
import type { Tarefa, Cliente } from '../store';

export async function fetchClientes() {
  const { data, error } = await supabase.from('clientes').select('*').order('nome');
  if (error) throw error;
  return data;
}

export async function fetchTarefas() {
  const { data, error } = await supabase.from('tarefas').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data as Tarefa[];
}

export async function fetchTriagemItens() {
  const { data, error } = await supabase.from('triagem_itens').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function fetchServicos() {
  const { data, error } = await supabase.from('servicos').select('*').eq('ativo', true).order('categoria').order('nome');
  if (error) throw error;
  return data;
}

export async function fetchTimeMembers() {
  const { data, error } = await supabase.from('profiles').select('id, nome, funcao').in('role', ['time', 'admin']).order('nome');
  if (error) throw error;
  return data;
}

export async function fetchCicloAtivo(clienteId: string) {
  const { data, error } = await supabase.from('ciclos')
    .select('*')
    .eq('cliente_id', clienteId)
    .eq('status', 'ativo')
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createTriagemItem(data: any) {
  const { data: result, error } = await supabase.from('triagem_itens').insert([data]).select().single();
  if (error) throw error;
  return result;
}

export async function updateTarefaComTriagem(tarefaId: string, data: any) {
  // 1. Atualiza a tarefa
  const { status, responsavel_id, creditos_cobrados, servico_id,
          data_vencimento, prioridade } = data;
  
  const { data: updatedTarefa, error } = await supabase
    .from('tarefas')
    .update({ status, responsavel_id, creditos_cobrados, servico_id,
              data_vencimento, prioridade })
    .eq('id', tarefaId)
    .select()
    .single();
  
  if (error) throw error;
  return updatedTarefa as Tarefa;
}

export async function createTarefa(tarefa: Partial<Tarefa>) {
  const { data, error } = await supabase.from('tarefas').insert([tarefa]).select().single();
  if (error) throw error;
  return data as Tarefa;
}

export async function updateTarefa(id: string, updates: Partial<Tarefa>) {
  const { data, error } = await supabase.from('tarefas').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data as Tarefa;
}

export async function createCiclo(data: any) {
  const { data: result, error } = await supabase.from('ciclos').insert([data]).select().single();
  if (error) throw error;
  return result;
}

export async function getCicloAtivo(clienteId: string, mes: number, ano: number) {
  const { data, error } = await supabase.from('ciclos')
    .select('*')
    .eq('cliente_id', clienteId)
    .eq('mes', mes)
    .eq('ano', ano)
    .eq('status', 'ativo')
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function debitarCreditos(cicloId: string, quantidade: number, tarefaId: string | null, createdBy: string | null = null) {
  const { data: ciclo, error: errCiclo } = await supabase.from('ciclos').select('creditos_usados, cliente_id').eq('id', cicloId).single();
  if (errCiclo) throw errCiclo;

  const { error: errUpdate } = await supabase.from('ciclos').update({ creditos_usados: ciclo.creditos_usados + quantidade }).eq('id', cicloId);
  if (errUpdate) throw errUpdate;

  const historico = {
    ciclo_id: cicloId,
    cliente_id: ciclo.cliente_id,
    tipo: 'debito',
    quantidade,
    tarefa_id: tarefaId,
    created_by: createdBy
  };
  const { error: errHist } = await supabase.from('historico_creditos').insert([historico]);
  if (errHist) throw errHist;
}

export async function liberarCreditos(cicloId: string, quantidade: number, tarefaId: string | null) {
  const { data: ciclo, error: errCiclo } = await supabase.from('ciclos').select('creditos_usados, cliente_id').eq('id', cicloId).single();
  if (errCiclo) throw errCiclo;

  const { error: errUpdate } = await supabase.from('ciclos').update({ creditos_usados: Math.max(0, ciclo.creditos_usados - quantidade) }).eq('id', cicloId);
  if (errUpdate) throw errUpdate;

  const historico = {
    ciclo_id: cicloId,
    cliente_id: ciclo.cliente_id,
    tipo: 'credito',
    quantidade,
    tarefa_id: tarefaId,
    motivo: 'Tarefa cancelada'
  };
  const { error: errHist } = await supabase.from('historico_creditos').insert([historico]);
  if (errHist) throw errHist;
}

export async function contarRevisoesTarefa(tarefaId: string) {
  const { data, error } = await supabase.from('tarefas').select('numero_revisao').eq('id', tarefaId).single();
  if (error) return 0;
  return data.numero_revisao || 0;
}

export function calcularCreditosRevisao(creditosBase: number, percentual: number, revisaoNum: number, revisoesIncluidas: number) {
  if (revisaoNum <= revisoesIncluidas) return 0;
  return Math.ceil((creditosBase * percentual) / 100);
}

export async function createContrato(data: any) {
  const { data: result, error } = await supabase.from('contratos').insert([data]).select().single();
  if (error) throw error;
  return result;
}

export async function fetchPlanos() {
  const { data, error } = await supabase.from('planos').select('*').eq('ativo', true);
  if (error) return [];
  return data;
}

export async function createCliente(cliente: Partial<Cliente>) {
  const { data, error } = await supabase.from('clientes').insert([cliente]).select().single();
  if (error) throw error;
  return data as Cliente;
}

export async function fetchProjetos() {
  const { data, error } = await supabase.from('projetos').select(`
    *,
    cliente:clientes(nome, tipo, cor_tema)
  `).order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createProjeto(projeto: any) {
  const { data, error } = await supabase.from('projetos').insert([projeto]).select(`
    *,
    cliente:clientes(nome, tipo, cor_tema)
  `).single();
  if (error) throw error;
  return data;
}

export async function updateProjeto(id: string, updates: any) {
  const { data, error } = await supabase.from('projetos').update(updates).eq('id', id).select(`
    *,
    cliente:clientes(nome, tipo, cor_tema)
  `).single();
  if (error) throw error;
  return data;
}

export async function fetchTarefasByProjeto(projetoId: string) {
  const { data, error } = await supabase.from('tarefas').select('*').eq('projeto_id', projetoId).order('created_at', { ascending: false });
  if (error) throw error;
  return data as Tarefa[];
}

export async function fetchTemplates() {
  const { data, error } = await supabase.from('templates_tarefa').select('*').eq('ativo', true).order('nome');
  if (error) throw error;
  return data;
}

export async function createSubtarefa(data: any) {
  const { data: result, error } = await supabase.from('subtarefas').insert([data]).select().single();
  if (error) throw error;
  return result;
}

export async function updateSubtarefa(id: string, updates: any) {
  const { data, error } = await supabase.from('subtarefas').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteSubtarefa(id: string) {
  const { error } = await supabase.from('subtarefas').delete().eq('id', id);
  if (error) throw error;
  return true;
}

export async function fetchSubtarefas(tarefaId: string) {
  const { data, error } = await supabase.from('subtarefas').select('*').eq('tarefa_id', tarefaId).order('ordem', { ascending: true });
  if (error) throw error;
  return data;
}

export async function createComentario(data: any) {
  const { data: result, error } = await supabase.from('comentarios').insert([data]).select().single();
  if (error) throw error;
  return result;
}

export async function fetchComentarios(tarefaId: string) {
  const { data, error } = await supabase.from('comentarios').select(`
    *,
    autor:profiles(id, nome, role)
  `).eq('tarefa_id', tarefaId).order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

export async function fetchAnexos(tarefaId: string) {
  const { data, error } = await supabase.from('anexos').select('*').eq('tarefa_id', tarefaId).order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createAnexo(data: any) {
  const { data: result, error } = await supabase.from('anexos').insert([data]).select().single();
  if (error) throw error;
  return result;
}

export async function fetchTarefasCliente(clienteId: string) {
  const { data, error } = await supabase.from('tarefas').select(`
    *,
    projeto:projetos(nome)
  `)
    .eq('cliente_id', clienteId)
    .eq('visivel_cliente', true)
    .neq('status', 'triagem')
    .neq('status', 'arquivado')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function fetchCicloAtualCliente(clienteId: string) {
  const { data, error } = await supabase.from('ciclos')
    .select('*')
    .eq('cliente_id', clienteId)
    .eq('status', 'ativo')
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createEntregaProjeto(data: any) {
  const { data: result, error } = await supabase.from('entregas_projeto').insert([data]).select().single();
  if (error) throw error;
  return result;
}

export async function fetchEntregasProjeto(projetoId: string) {
  const { data, error } = await supabase.from('entregas_projeto').select('*').eq('projeto_id', projetoId).order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createAvaliacao(data: any) {
  const { data: result, error } = await supabase.from('avaliacoes').insert([data]).select().single();
  if (error) throw error;
  return result;
}

export async function getAvaliacaoProjeto(projetoId: string) {
  const { data, error } = await supabase.from('avaliacoes').select('*').eq('projeto_id', projetoId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchProjetosCliente(clienteId: string) {
  const { data, error } = await supabase.from('projetos')
    .select(`
      *,
      tarefas (id, status, visivel_cliente)
    `)
    .eq('cliente_id', clienteId)
    .order('created_at', { ascending: false });
  if (error) throw error;

  // Manual join for entregas and avaliacoes to avoid nested relation errors if not configured completely in PostgREST
  const projetosIds = data.map(p => p.id);
  const [entregasRes, avaliacoesRes] = await Promise.all([
    supabase.from('entregas_projeto').select('*').in('projeto_id', projetosIds),
    supabase.from('avaliacoes').select('*').in('projeto_id', projetosIds)
  ]);

  return data.map(p => ({
    ...p,
    entregas: entregasRes.data ? entregasRes.data.filter(e => e.projeto_id === p.id) : [],
    avaliacao: avaliacoesRes.data ? avaliacoesRes.data.find(a => a.projeto_id === p.id) : null
  }));
}

export async function createAprovacao(data: any) {
  const { data: result, error } = await supabase.from('aprovacoes').insert([data]).select().single();
  if (error) throw error;
  return result;
}

export async function updateTarefaStatus(id: string, status: string) {
  const { data, error } = await supabase.from('tarefas').update({ status }).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function createComentarioCliente(data: any) {
  data.role_autor = 'cliente';
  const { data: result, error } = await supabase.from('comentarios').insert([data]).select().single();
  if (error) throw error;
  return result;
}

export async function fetchContratosKeepAtivos() {
  const { data, error } = await supabase
    .from('contratos')
    .select(`*, cliente:clientes!inner(id, nome, tipo)`)
    .eq('ativo', true)
    .eq('clientes.tipo', 'keep');

  if (error) {
    if (error.message.includes('Could not find a relationship')) {
        // Fallback se o inner join falhar por foreign key não reconhecida (Supabase as vezes tem quirks com aliasing)
        const res = await supabase.from('contratos').select('*, cliente_id');
        if (res.error) throw res.error;
        const cl = await supabase.from('clientes').select('id, nome, tipo').eq('tipo', 'keep');
        if (cl.error) throw cl.error;
        const keepIds = cl.data.map((c: any) => c.id);
        const ativos = res.data.filter((c: any) => c.ativo && keepIds.includes(c.cliente_id));
        return ativos.map(c => ({...c, cliente: cl.data.find((clnt: any) => clnt.id === c.cliente_id)}));
    }
    throw error;
  }
  return data;
}

export async function fetchAvulsosACobrar() {
  // Vamos buscar todas as tarefas com credito_avulso = true e que não tenham a tag 'cobrado'
  const { data, error } = await supabase.from('tarefas').select(`
    *,
    cliente:clientes(nome)
  `)
  .eq('credito_avulso', true)
  .neq('status', 'arquivado');
  if (error) throw error;
  
  // Como o campo cobrado não existe e não podemos fazer migration facilmente na Vercel/Cloud Run via Agent:
  return data.filter(t => !t.tags?.includes('cobrado'));
}

export async function marcarTarefaComoCobrada(id: string) {
  const { data: current, error: getErr } = await supabase.from('tarefas').select('tags').eq('id', id).single();
  if (getErr) throw getErr;

  const tags = current.tags || [];
  if (!tags.includes('cobrado')) {
    tags.push('cobrado');
  }

  const { data, error } = await supabase.from('tarefas').update({
    tags
  }).eq('id', id).select().single();
  
  if (error) throw error;
  return data;
}

export async function fetchTodosCiclosAtivos() {
  const { data, error } = await supabase.from('ciclos')
    .select('*')
    .eq('status', 'ativo');
  if (error) throw error;
  return data;
}

export async function fetchEstatisticasDashboard() {
  const [contratos, tarefasAndamento, tarefasTriagem, tarefasVencendoHoje] = await Promise.all([
    fetchContratosKeepAtivos(),
    supabase.from('tarefas').select('id', { count: 'exact' }).eq('status', 'em_andamento'),
    supabase.from('tarefas').select('id', { count: 'exact' }).eq('status', 'triagem'),
    (async () => {
       const hoje = new Date().toISOString().split('T')[0];
       const { count } = await supabase.from('tarefas')
         .select('id', { count: 'exact' })
         .eq('data_vencimento', hoje)
         .not('status', 'in', '("entregue","aprovado","arquivado")');
       return { count };
    })()
  ]);

  const mrr_total = contratos.reduce((sum: number, c: any) => sum + (Number(c.valor_mensal) || 0), 0);

  return {
    clientes_keep_ativos: contratos.length,
    tarefas_em_andamento: tarefasAndamento.count || 0,
    itens_triagem: tarefasTriagem.count || 0,
    tarefas_vencendo_hoje: tarefasVencendoHoje.count || 0,
    mrr_total
  };
}

