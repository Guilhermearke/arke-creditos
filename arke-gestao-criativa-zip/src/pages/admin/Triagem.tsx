import React, { useState, useEffect, useMemo } from 'react';
import { useArkeStore, Origem, TriagemItem, Cliente } from '../../lib/store';
import { fetchCicloAtivo } from '../../lib/supabase/queries';
import { criarAcessoCliente } from '../../lib/supabase/admin-queries';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, Slack, Trello, Columns3, CheckCircle, ArrowRight, 
  AlertTriangle, UserPlus, FolderPlus, FileText, ChevronDown, Plus, 
  Trash2, Copy, GripVertical, Bell, Zap, Clock, AlertCircle, Inbox
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';

const OrigemIcon = ({ origem, canal, className }: { origem?: string, canal?: string, className?: string }) => {
  const t = origem || canal || '';
  switch (t) {
    case 'slack': return <Slack className={cn("text-[#4A154B]", className)} />;
    case 'trello': return <Trello className={cn("text-[#0052CC]", className)} />;
    case 'clickup': return <Columns3 className={cn("text-[#7B68EE]", className)} />;
    default: return <MessageSquare className={cn("text-slate-400", className)} />;
  }
};

const TipoIcon = ({ tipo, className }: { tipo: string, className?: string }) => {
  switch (tipo) {
    case 'novo_cliente': return <UserPlus className={cn("text-emerald-500", className)} />;
    case 'novo_projeto': return <FolderPlus className={cn("text-purple-500", className)} />;
    case 'demanda':
    default: return <FileText className={cn("text-blue-500", className)} />;
  }
};

export default function AdminTriagem() {
  const { 
    tarefas, clientes, servicos, timeMembers, configuracoes, projetos,
    triagemItens, adicionarTriagemItem, atualizarTriagemItem,
    adicionarCliente, adicionarProjeto, adicionarTarefa, carregarDadosIniciais
  } = useArkeStore();

  const [timeExpanded, setTimeExpanded] = useState(() => {
    const saved = localStorage.getItem('arke_time_panel_expanded');
    return saved !== 'false';
  });

  useEffect(() => {
    localStorage.setItem('arke_time_panel_expanded', String(timeExpanded));
  }, [timeExpanded]);

  const [planos, setPlanos] = useState<any[]>([]);

  useEffect(() => {
    import('../../lib/supabase/queries')
      .then(q => q.fetchPlanos())
      .then((p: any) => setPlanos(p || []))
      .catch(console.error);
  }, []);

  const pendentes = triagemItens.filter(t => t.status_triagem !== 'liberado');

  const hoje = new Date().toISOString().split('T')[0];

  const kpis = useMemo(() => {
    const atrasadas = tarefas.filter(t =>
      t.data_vencimento && t.data_vencimento < hoje &&
      !['entregue', 'aprovado', 'arquivado', 'triagem'].includes(t.status)
    ).length;

    const emProducao = tarefas.filter(t => t.status === 'em_andamento').length;

    const aguardandoCliente = tarefas.filter(t => t.status === 'em_revisao').length;

    const thisMonth = new Date().toISOString().substring(0, 7);
    const entreguesMes = tarefas.filter(t =>
      t.status === 'entregue' && (t as any).created_at?.startsWith(thisMonth)
    ).length;

    // Calcular clientes com saldo crítico (keep) onde creditos_restantes/mensais < 0.2
    const saldoCritico = clientes.filter(c => 
      c.tipo === 'keep' && c.creditos_mensais > 0 && 
      (c.creditos_restantes / c.creditos_mensais) < 0.2
    );

    return { atrasadas, emProducao, aguardandoCliente, entreguesMes, saldoCritico };
  }, [tarefas, clientes, hoje]);

  const alertas = useMemo(() => {
    const lista = [];
    const agora = Date.now();

    // Demandas há mais de 48h sem triagem
    const antigas = pendentes.filter(t => {
      const criado = new Date(t.created_at).getTime();
      return (agora - criado) > 48 * 60 * 60 * 1000;
    });
    if (antigas.length > 0) {
      lista.push({
        id: 'urgente-' + antigas[0].id,
        tipo: 'urgente',
        texto: `${antigas.length} demanda${antigas.length > 1 ? 's' : ''} esperando há +48h`,
        acao: () => setSelectedId(antigas[0].id)
      });
    }

    // Itens incompletos há mais de 24h
    const incompletos = pendentes.filter(t => {
      if (t.status_triagem !== 'incompleto') return false;
      const criado = new Date(t.created_at).getTime();
      return (agora - criado) > 24 * 60 * 60 * 1000;
    });
    if (incompletos.length > 0) {
      lista.push({
        id: 'aviso-' + incompletos[0].id,
        tipo: 'aviso',
        texto: `${incompletos.length} demanda(s) incompleta(s) aguardando informação`,
        acao: () => setSelectedId(incompletos[0].id)
      });
    }

    return lista;
  }, [pendentes]);

  const cargaTime = useMemo(() => {
    return timeMembers.map(m => ({
      ...m,
      emAndamento: tarefas.filter(t =>
        t.responsavel_id === m.id && t.status === 'em_andamento'
      ).length,
      temUrgente: tarefas.some(t =>
        t.responsavel_id === m.id &&
        t.status === 'em_andamento' &&
        t.prioridade === 'urgente'
      )
    }));
  }, [timeMembers, tarefas]);

  const [selectedId, setSelectedId] = useState<string | null>(() => {
    const saved = localStorage.getItem('arke_triagem_selected');
    if (saved && pendentes.find(t => t.id === saved)) return saved;
    return pendentes[0]?.id || null;
  });

  useEffect(() => {
    if (selectedId) localStorage.setItem('arke_triagem_selected', selectedId);
    else localStorage.removeItem('arke_triagem_selected');
  }, [selectedId]);

  const selected = pendentes.find(t => t.id === selectedId);

  // Status & Modal states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalSenha, setModalSenha] = useState<{ open: boolean, email: string, senha: string }>({ open: false, email: '', senha: '' });

  // --- Form States ---
  // Geral/Demanda
  const [formDemanda, setFormDemanda] = useState({
    clienteId: '',
    titulo: '', servicoId: '', creditos: 0, responsavel: '', urgente: false, 
    dataVencimento: '', observacoes: '', aguardando: false, infoFaltando: '',
    projetoId: ''
  });
  // Cliente
  const [formCliente, setFormCliente] = useState({
    nome: '', email: '', whatsapp: '', tipo: 'keep', planoBase: '', 
    creditosMensais: 0, valorMensal: 0, creditosAcumulam: false, revisoesIncluidas: 1, 
    corTema: '#2563EB', observacoes: ''
  });
  // Projeto
  const [formProjeto, setFormProjeto] = useState({
    clienteId: '', nome: '', tipo: 'build', descricao: '', dataInicio: '', dataPrazo: '',
    etapas: [] as any[]
  });

  const [cicloAtivo, setCicloAtivo] = useState<any>(null);

  // Sync state whenever selection changes
  useEffect(() => {
    if (!selected) return;

    if (selected.tipo === 'demanda') {
      const ext = selected.dados_extras || {};
      setFormDemanda({
        clienteId: selected.cliente_id || '',
        titulo: ext.titulo || selected.conteudo_original || '',
        servicoId: ext.servicoId || (servicos.length ? servicos[0].id : ''),
        creditos: ext.creditos || (servicos.length ? servicos[0].creditos_padrao : 0),
        responsavel: ext.responsavel || (timeMembers.length ? timeMembers[0].id : ''),
        urgente: !!ext.urgente,
        dataVencimento: ext.dataVencimento || '',
        observacoes: ext.observacoes || '',
        aguardando: selected.status_triagem === 'incompleto',
        infoFaltando: ext.infoFaltando || '',
        projetoId: ext.projetoId || ''
      });

      if (selected.cliente_id) {
         fetchCicloAtivo(selected.cliente_id).then(setCicloAtivo).catch(() => setCicloAtivo(null));
      } else {
         setCicloAtivo(null);
      }
    } else if (selected.tipo === 'novo_cliente') {
      const ext = selected.dados_extras || {};
      setFormCliente({
        nome: ext.nome || '', email: ext.email || '', whatsapp: ext.whatsapp || '',
        tipo: ext.tipo || 'keep', planoBase: ext.planoBase || '',
        creditosMensais: ext.creditosMensais || 0, valorMensal: ext.valorMensal || 0,
        creditosAcumulam: !!ext.creditosAcumulam, revisoesIncluidas: ext.revisoesIncluidas || 1,
        corTema: ext.corTema || '#2563EB', observacoes: ext.observacoes || ''
      });
    } else if (selected.tipo === 'novo_projeto') {
      const ext = selected.dados_extras || {};
      setFormProjeto({
        clienteId: ext.clienteId || selected.cliente_id || '', nome: ext.nome || '', 
        tipo: ext.tipo || 'build', descricao: ext.descricao || '', 
        dataInicio: ext.dataInicio || '', dataPrazo: ext.dataPrazo || '',
        etapas: ext.etapas || []
      });
    }
  }, [selectedId, selected, servicos, timeMembers]);

  // Handle Nova Entrada Actions
  const handleNovaEntrada = async (tipo: 'demanda' | 'novo_cliente' | 'novo_projeto') => {
    const item = {
      tipo,
      status_triagem: 'aguardando',
      canal: 'manual',
      canal_label: 'Manual',
      conteudo_original: tipo === 'demanda' ? 'Nova Demanda' : tipo === 'novo_cliente' ? 'Novo Cliente' : 'Novo Projeto',
      dados_extras: {}
    };
    try {
      const newItem = await adicionarTriagemItem(item);
      setSelectedId(newItem.id);
      toast.success('Entrada criada e selecionada.');
    } catch {
      toast.error('Erro ao adicionar item.');
    }
  };

  const handleSalvarRascunho = async () => {
    if (!selected) return;
    let extras = {};
    let status: any = selected.status_triagem;
    
    if (selected.tipo === 'demanda') {
      extras = { ...formDemanda };
      status = formDemanda.aguardando ? 'incompleto' : 'aguardando';
    } else if (selected.tipo === 'novo_cliente') {
      extras = { ...formCliente };
    } else {
      extras = { ...formProjeto };
    }

    try {
      await atualizarTriagemItem(selected.id, { dados_extras: extras, status_triagem: status });
    } catch (e) {
      console.error(e);
    }
  };

  // Debounce saving draft when form changes
  useEffect(() => {
    const t = setTimeout(() => {
      handleSalvarRascunho();
    }, 1000);
    return () => clearTimeout(t);
  }, [formDemanda, formCliente, formProjeto]);

  const handleLiberarDemanda = async () => {
    const clienteId = formDemanda.clienteId || selected?.cliente_id || '';
    if (!selected || !formDemanda.titulo || !formDemanda.responsavel || !clienteId) {
      toast.error('Preencha os campos obrigatórios (Cliente, Título, Responsável).');
      return;
    }
    setIsSubmitting(true);
    
    try {
      const srv = servicos.find(s => s.id === formDemanda.servicoId);
      const usuarioId = 'admin-id'; // Temp

      if (formDemanda.aguardando) {
         // Fica incompleto no painel
         await handleSalvarRascunho();
         toast.success('Demanda marcada como aguardando informações.');
      } else {
         // Converte triagem item em Tarefa
         const cliente = clientes.find(c => c.id === clienteId);
         const novaTarefa = await adicionarTarefa({
            cliente_id: clienteId,
            titulo: formDemanda.titulo,
            descricao: formDemanda.observacoes,
            creditos_cobrados: formDemanda.creditos,
            status: 'a_fazer',
            prioridade: formDemanda.urgente ? 'urgente' : 'normal',
            servico: formDemanda.servicoId,
            responsavel_id: formDemanda.responsavel,
            projeto_id: formDemanda.projetoId || undefined,
            data_vencimento: formDemanda.dataVencimento || undefined,
            origem: selected.canal as any || 'manual'
         });

         await atualizarTriagemItem(selected.id, { 
           status_triagem: 'liberado', 
           cliente_id: clienteId,
           tarefa_id: novaTarefa?.id 
         });
         
         setSelectedId(pendentes.filter(t => t.id !== selected.id)[0]?.id || null);
         toast.success('Demanda liberada para produção!');
      }
    } catch (e) {
      toast.error('Erro ao liberar demanda.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLiberarNovoCliente = async () => {
    if (!selected || !formCliente.nome || !formCliente.email) {
      toast.error('Preencha Nome e Email do cliente.');
      return;
    }
    setIsSubmitting(true);
    try {
      // 1. Criar Auth & Profile via Edge/Admin
      // Por enquanto, usando local (mas o admin-queries requer anon key role if running client side, 
      // mas vamos assumir que o admin tem JWT para roles, ou no nosso mock VITE_SUPABASE_SERVICE_ROLE_KEY está lá).
      let creds;
      try {
         creds = await criarAcessoCliente(formCliente.email, selected.id /*will update*/, formCliente.nome);
      } catch (authErr: any) {
         if (authErr.message?.includes('configure')) {
            // Em dev se faltar chave
            creds = { senha: 'MODO_DEV_N_CONFIGURADO' };
         } else {
            throw authErr;
         }
      }

      // 2. Criar Cliente
      const cl = await adicionarCliente({
        nome: formCliente.nome,
        email: formCliente.email,
        whatsapp: formCliente.whatsapp,
        tipo: formCliente.tipo as any,
        cor_tema: formCliente.corTema,
        creditos_mensais: formCliente.creditosMensais, 
        creditos_usados: 0,
        creditos_restantes: formCliente.creditosMensais
      });

      // (Em ambiente real, criaríamos o Contrato e Ciclo aqui também se Keep usando stored procedures)

      await atualizarTriagemItem(selected.id, { status_triagem: 'liberado', cliente_id: cl.id });

      setSelectedId(pendentes.filter(t => t.id !== selected.id)[0]?.id || null);
      
      setModalSenha({ open: true, email: formCliente.email, senha: creds.senha });
      carregarDadosIniciais(); // Refresh all to include new client
    } catch (e: any) {
       toast.error('Erro ao criar cliente: ' + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLiberarNovoProjeto = async () => {
    if (!selected || !formProjeto.clienteId || !formProjeto.nome) {
      toast.error('Preencha Cliente e Nome do projeto.');
      return;
    }
    if (formProjeto.etapas.length === 0) {
      toast.error('Adicione pelo menos 1 tarefa/etapa ao projeto antes de liberar.');
      return;
    }
    setIsSubmitting(true);
    try {
      // 1. Criar Projeto no banco (adicionarProjeto na store apenas adiciona localmente state, mas na real deveria ser chamada queries.createProjeto)
      // Como não criamos um return no adicionarProjeto (erro no setup inicial), vamos fazer direto com query ok, mas a store deve refletir.
      const queries = await import('../../lib/supabase/queries');
      const queryResult = await queries.createProjeto({
        cliente_id: formProjeto.clienteId,
        nome: formProjeto.nome,
        tipo: formProjeto.tipo,
        descricao: formProjeto.descricao,
        data_inicio: formProjeto.dataInicio || null,
        data_prazo: formProjeto.dataPrazo || null,
        status: 'briefing'
      });

      // 2. Criar tarefas
      const cl = clientes.find(c => c.id === formProjeto.clienteId);
      for (const e of formProjeto.etapas) {
         await adicionarTarefa({
           cliente_id: formProjeto.clienteId,
           projeto_id: queryResult.id,
           titulo: e.titulo,
           status: 'backlog',
           creditos_cobrados: e.creditos,
           servico: e.servicoId,
           responsavel_id: e.responsavelId,
           origem: 'manual'
         });
      }

      await atualizarTriagemItem(selected.id, { status_triagem: 'liberado', cliente_id: formProjeto.clienteId });
      
      setSelectedId(pendentes.filter(t => t.id !== selected.id)[0]?.id || null);
      toast.success(`Projeto ${queryResult.nome} criado com ${formProjeto.etapas.length} tarefas!`);
      carregarDadosIniciais();
    } catch (e: any) {
      toast.error('Erro ao criar projeto: ' + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArquivar = () => {
    if (!selected) return;
    if (confirm("Tem certeza? Este item de triagem será arquivado/ignorado.")) {
      atualizarTriagemItem(selected.id, { status_triagem: 'liberado' });
      setSelectedId(pendentes.filter(t => t.id !== selected.id)[0]?.id || null);
    }
  };

  const adcionarEtapaProjeto = () => {
    setFormProjeto(p => ({
      ...p,
      etapas: [...p.etapas, { id: crypto.randomUUID(), titulo: '', servicoId: '', responsavelId: '', creditos: 0 }]
    }));
  };

  const editarEtapaProjeto = (id: string, updates: any) => {
    setFormProjeto(p => ({
      ...p,
      etapas: p.etapas.map(e => e.id === id ? { ...e, ...updates } : e)
    }));
  };

  const excluirEtapaProjeto = (id: string) => {
    setFormProjeto(p => ({
      ...p,
      etapas: p.etapas.filter(e => e.id !== id)
    }));
  };

  // Utilities for grouping
  const servicosAgrupados = servicos.reduce((acc, servico) => {
    const cat = servico.categoria || 'Geral';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(servico);
    return acc;
  }, {} as Record<string, typeof servicos>);

  const getStatusBadgeDef = (status: string) => {
    if (status === 'aguardando') return { label: 'Aguardando', className: 'bg-slate-100 text-slate-600' };
    if (status === 'incompleto') return { label: 'Incompleto', className: 'bg-amber-100 text-amber-700' };
    return { label: 'Liberado', className: 'bg-green-100 text-green-700' };
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-slate-100">
      
      {/* BLOCO 1: Header compacto */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Central de Operações</h1>
          <p className="text-sm text-slate-500 mt-0.5">Olá, Lea. Aqui está o que precisa de atenção agora.</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button className="bg-blue-600 hover:bg-blue-700" />}>
            <Plus className="w-4 h-4 mr-1" /> Nova Entrada
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem 
              onClick={() => handleNovaEntrada('novo_cliente')} 
              onPointerUp={() => handleNovaEntrada('novo_cliente')}
              onSelect={() => handleNovaEntrada('novo_cliente')}
              className="cursor-pointer"
            >
              <UserPlus className="w-4 h-4 mr-2 text-emerald-500" /> Novo Cliente
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleNovaEntrada('novo_projeto')} 
              onPointerUp={() => handleNovaEntrada('novo_projeto')}
              onSelect={() => handleNovaEntrada('novo_projeto')}
              className="cursor-pointer"
            >
              <FolderPlus className="w-4 h-4 mr-2 text-purple-500" /> Novo Projeto
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleNovaEntrada('demanda')} 
              onPointerUp={() => handleNovaEntrada('demanda')}
              onSelect={() => handleNovaEntrada('demanda')}
              className="cursor-pointer"
            >
              <FileText className="w-4 h-4 mr-2 text-blue-500" /> Nova Demanda
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* BLOCO 2: KPIs em grid (responsivo para não gerar scroll) */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 shrink-0">
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          <div className={cn("flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3", pendentes.length > 0 && "ring-1 ring-blue-300")}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center bg-blue-100 text-blue-600 shrink-0">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xl font-bold text-slate-900 leading-none">{pendentes.length}</div>
              <div className="text-xs text-slate-500 mt-0.5 leading-tight">Na triagem</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center bg-violet-100 text-violet-600 shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xl font-bold text-slate-900 leading-none">{kpis.emProducao}</div>
              <div className="text-xs text-slate-500 mt-0.5 leading-tight">Em produção</div>
            </div>
          </div>

          <div className={cn("flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3", kpis.atrasadas > 0 && "ring-1 ring-red-300")}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center bg-red-100 text-red-600 shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <div className={cn("text-xl font-bold leading-none", kpis.atrasadas > 0 ? "text-red-600" : "text-slate-900")}>{kpis.atrasadas}</div>
              <div className="text-xs text-slate-500 mt-0.5 leading-tight">Atrasadas</div>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center bg-amber-100 text-amber-600 shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xl font-bold text-slate-900 leading-none">{kpis.aguardandoCliente}</div>
              <div className="text-xs text-slate-500 mt-0.5 leading-tight">Aguard. aprovação</div>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center bg-green-100 text-green-600 shrink-0">
              <CheckCircle className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xl font-bold text-slate-900 leading-none">{kpis.entreguesMes}</div>
              <div className="text-xs text-slate-500 mt-0.5 leading-tight">Entregues/mês</div>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 group relative">
            <div className="w-9 h-9 rounded-full flex items-center justify-center bg-orange-100 text-orange-600 shrink-0">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xl font-bold text-slate-900 leading-none">{kpis.saldoCritico.length}</div>
              <div className="text-xs text-slate-500 mt-0.5 leading-tight">Saldo crítico</div>
            </div>
            {kpis.saldoCritico.length > 0 && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 bg-gray-900 text-white text-xs rounded-lg py-2 px-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                <p className="font-bold border-b border-gray-700 pb-1 mb-1">Clientes c/ saldo baixo:</p>
                {kpis.saldoCritico.map(c => <div key={c.id} className="truncate">{c.nome}</div>)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* BLOCO 3: Área principal */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* COLUNA ESQUERDA — w-[380px] */}
        <div className="w-[380px] flex-shrink-0 bg-white border-r border-slate-200 flex flex-col">
          
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between shrink-0">
            <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">Entradas</span>
            <Badge variant="secondary" className="bg-blue-100 text-blue-700 rounded-full px-2 py-0.5 h-auto text-[10px]">{pendentes.length}</Badge>
          </div>

          {alertas.length > 0 && (
            <div className="px-3 pt-2 space-y-2 shrink-0">
              {alertas.map(a => (
                <div key={a.id} className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  <AlertTriangle className="text-red-500 w-3.5 h-3.5 shrink-0" />
                  <span className="text-xs text-red-700 font-medium flex-1 leading-tight">{a.texto}</span>
                  <button onClick={a.acao} className="text-xs text-red-600 underline hover:text-red-800 shrink-0">Ver</button>
                </div>
              ))}
            </div>
          )}

          {pendentes.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center px-4">
               <CheckCircle className="w-8 h-8 text-green-400" />
               <p className="text-sm font-semibold text-slate-600">Caixa limpa!</p>
               <p className="text-xs text-slate-400">Todas as entradas foram triadas.</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {pendentes.map(t => {
                const cliente = t.cliente_id ? clientes.find(c => c.id === t.cliente_id) : null;
                const isSelected = selectedId === t.id;
                const statusBadge = getStatusBadgeDef(t.status_triagem || 'aguardando');
                
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedId(t.id)}
                    className={cn(
                      "w-full text-left p-3 rounded-xl border transition-all duration-200 block",
                      isSelected 
                        ? "bg-blue-50 border-blue-200 ring-1 ring-blue-500/10 shadow-sm" 
                        : "bg-white border-transparent hover:border-slate-200 hover:bg-slate-50"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <TipoIcon tipo={t.tipo} className="w-4 h-4" />
                        <span className="font-semibold text-sm text-slate-900 border-b border-transparent truncate">
                          {t.tipo === 'demanda' ? (cliente?.nome || 'Demanda') : 
                           t.tipo === 'novo_cliente' ? 'Abertura de Cliente' : 'Novo Projeto'}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed h-8">
                      {t.conteudo_original || (t.tipo === 'novo_cliente' ? 'Preenchimento de cadastro...' : 'Definição de escopo...')}
                    </p>
                    <div className="mt-3 flex items-center justify-between">
                       <div className="flex items-center gap-1.5">
                          <OrigemIcon origem={t.canal} canal={t.canal} className="w-3.5 h-3.5" />
                          <span className="text-[10px] text-slate-500 tracking-wide">{t.canal_label}</span>
                       </div>
                        <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border", statusBadge.className, isSelected ? "border-current opacity-80" : "border-transparent")}>
                          {statusBadge.label}
                        </span>
                     </div>
                  </button>
                )
              })}
            </div>
          )}

          <div className="border-t border-slate-200 flex-shrink-0">
            <button onClick={() => setTimeExpanded(!timeExpanded)} className="px-4 py-2.5 flex items-center justify-between cursor-pointer w-full hover:bg-slate-50 transition-colors">
               <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">Time & Carga</span>
               <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform duration-300", timeExpanded && "rotate-180")} />
            </button>
            {timeExpanded && (
               <div className="max-h-[160px] overflow-y-auto px-3 pb-3 pt-1 space-y-1">
                 {cargaTime.map(m => (
                   <div key={m.id} className="flex items-center gap-2 py-1.5 px-1 rounded-lg hover:bg-slate-50">
                     <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200 overflow-hidden">
                        {m.avatar_url ? <img src={m.avatar_url} className="w-full h-full object-cover" /> : <UserPlus className="w-3 h-3 text-slate-400" />}
                     </div>
                     <span className="text-xs font-medium text-slate-700 flex-1 truncate">{m.nome}</span>
                     <span className={cn("text-[10px] px-2 rounded-full", m.emAndamento > 5 ? "bg-amber-100 text-amber-700 font-bold" : "bg-slate-100 text-slate-600 font-semibold")}>
                        {m.emAndamento}
                     </span>
                     {m.temUrgente && <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse shrink-0" title="Possui tarefa urgente" />}
                   </div>
                 ))}
               </div>
            )}
          </div>
        </div>

        {/* COLUNA DIREITA — flex-1 */}
        <div className="flex-1 bg-slate-50 flex flex-col overflow-hidden">
          {!selected ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <div className="bg-slate-200/60 rounded-2xl w-16 h-16 flex items-center justify-center mb-1">
                <Inbox className="w-7 h-7 text-slate-400" />
              </div>
              <p className="text-base font-semibold text-slate-600">Selecione uma entrada</p>
              <p className="text-sm text-slate-400">ou crie uma nova para começar</p>
            </div>
          ) : (
            <>
              {/* Header do painel */}
              <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0 shadow-sm relative z-10">
                 <div>
                   <Badge variant="outline" className="bg-slate-50 text-[10px] text-slate-500 uppercase tracking-widest px-2 py-0.5 rounded border-slate-200 mb-2.5">
                      {selected.tipo === 'novo_cliente' ? 'Criar Cliente e Acesso' : 
                       selected.tipo === 'novo_projeto' ? 'Definição de Novo Projeto' : 'Análise de Demanda'}
                   </Badge>
                   <h3 className="text-xl font-bold text-slate-900 leading-tight">
                     {selected.conteudo_original || (selected.tipo === 'novo_cliente' ? 'Novo Cliente' : 'Novo Projeto')}
                   </h3>
                 </div>
                 
                 <div className="flex items-center gap-2 mt-1 shrink-0">
                   {selected.dados_extras?.trello_card_url && (
                      <a href={selected.dados_extras.trello_card_url} target="_blank" rel="noopener noreferrer"
                         className="flex items-center gap-1.5 text-xs font-medium text-[#0052CC] bg-[#0052CC]/10 hover:bg-[#0052CC]/20 px-2.5 py-1.5 rounded-lg transition-colors mr-2">
                        <Trello className="w-3.5 h-3.5" /> Ver no Trello
                      </a>
                   )}
                 </div>
              </div>

              {/* Corpo (Formulários) */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                <div className="max-w-3xl mx-auto space-y-6">
                
                {/* --- FORM NOVO CLIENTE --- */}
                {selected.tipo === 'novo_cliente' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                         <label className="text-sm font-medium text-slate-900 block mb-1.5">Nome / Empresa *</label>
                         <Input value={formCliente.nome} onChange={e => setFormCliente({...formCliente, nome: e.target.value})} placeholder="Nome Fantasia" className="bg-white" />
                      </div>
                      <div>
                         <label className="text-sm font-medium text-slate-900 block mb-1.5">Email *</label>
                         <Input value={formCliente.email} onChange={e => setFormCliente({...formCliente, email: e.target.value})} placeholder="contato@empresa.com" type="email" className="bg-white" />
                         <p className="text-[10px] text-slate-400 mt-1">Será usado para gerar o acesso do painel.</p>
                      </div>
                      <div>
                         <label className="text-sm font-medium text-slate-900 block mb-1.5">WhatsApp</label>
                         <Input value={formCliente.whatsapp} onChange={e => setFormCliente({...formCliente, whatsapp: e.target.value})} placeholder="(11) 99999-9999" className="bg-white" />
                      </div>
                    </div>

                    <div className="border border-slate-200 rounded-xl p-5 bg-white shadow-sm space-y-5">
                       <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2"><FolderPlus className="w-4 h-4 text-blue-500" /> Plano e Faturamento</h4>
                       <div className="grid grid-cols-2 gap-4">
                          <div>
                             <label className="text-sm font-medium text-slate-700 block mb-1.5">Regime</label>
                             <select value={formCliente.tipo} onChange={e => setFormCliente({...formCliente, tipo: e.target.value})} className="w-full text-sm rounded-md border border-slate-200 px-3 py-2.5 bg-white focus:ring-2 focus:ring-blue-100 outline-none">
                               <option value="keep">Keep (Assinatura)</option>
                               <option value="build">Build (Projeto Unico)</option>
                               <option value="craft">Craft (Projeto Unico)</option>
                               <option value="avulso">Avulso</option>
                             </select>
                          </div>
                          {formCliente.tipo === 'keep' && (
                            <div>
                              <label className="text-sm font-medium text-slate-700 block mb-1.5">Plano Base</label>
                              <select value={formCliente.planoBase} onChange={e => {
                                 const p = planos?.find(x => x.id === e.target.value);
                                 setFormCliente({
                                   ...formCliente, planoBase: e.target.value,
                                   creditosMensais: p?.creditos_mensais || 0, valorMensal: p?.valor_mensal || 0,
                                   creditosAcumulam: p?.creditos_acumulam || false, revisoesIncluidas: p?.revisoes_incluidas || 1
                                 });
                              }} className="w-full text-sm rounded-md border border-slate-200 px-3 py-2.5 bg-white focus:ring-2 focus:ring-blue-100 outline-none">
                                <option value="" disabled>Selecione um plano</option>
                                {planos?.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                              </select>
                            </div>
                         )}
                      </div>

                      {formCliente.tipo === 'keep' && (
                        <div className="grid grid-cols-2 gap-4 pt-2">
                           <div>
                              <label className="text-xs text-slate-500 block mb-1">Créditos/Mês</label>
                              <Input type="number" value={formCliente.creditosMensais} onChange={e => setFormCliente({...formCliente, creditosMensais: Number(e.target.value)})} />
                           </div>
                           <div>
                              <label className="text-xs text-slate-500 block mb-1">Valor/Mês (R$)</label>
                              <Input type="number" value={formCliente.valorMensal} onChange={e => setFormCliente({...formCliente, valorMensal: Number(e.target.value)})} />
                           </div>
                        </div>
                      )}
                   </div>
                   <div>
                     <label className="text-sm font-medium text-slate-900 block mb-1.5">Cor Tema do Cliente (Painel Externo)</label>
                     <div className="flex items-center gap-3">
                        <input type="color" value={formCliente.corTema} onChange={e => setFormCliente({...formCliente, corTema: e.target.value})} className="w-10 h-10 rounded border" />
                        <span className="text-sm font-mono text-slate-500">{formCliente.corTema}</span>
                     </div>
                   </div>
                   <div>
                     <label className="text-sm font-medium text-slate-900 block mb-1.5">Observações Adicionais</label>
                     <Textarea value={formCliente.observacoes} onChange={e => setFormCliente({...formCliente, observacoes: e.target.value})} className="min-h-[80px]" />
                   </div>
                 </div>
               )}

               {/* --- FORM NOVO PROJETO --- */}
               {selected.tipo === 'novo_projeto' && (
                 <div className="space-y-6">
                   <div className="grid grid-cols-2 gap-4">
                     <div className="col-span-2">
                        <label className="text-sm font-medium text-slate-900 block mb-1.5">Cliente Selecionado *</label>
                        <select value={formProjeto.clienteId} onChange={e => setFormProjeto({...formProjeto, clienteId: e.target.value})} className="w-full text-sm rounded-md border border-slate-200 px-3 py-2 bg-white">
                           <option value="" disabled>Selecione um cliente cadastrado</option>
                           {clientes.map(c => <option key={c.id} value={c.id}>{c.nome} ({c.tipo})</option>)}
                        </select>
                     </div>
                     <div className="col-span-2 text-sm text-slate-500 bg-slate-50 p-2 rounded -mt-2">
                        {formProjeto.clienteId && clientes.find(c => c.id === formProjeto.clienteId)?.tipo === 'keep' 
                         ? 'ℹ️ Repare: como este cliente é do tipo Keep, as tarefas debitarão créditos do ciclo atuante ao serem criadas.' 
                         : 'ℹ️ Cliente By Demand (Build/Craft/Avulso). As etapas de projeto não deduzem créditos pré-comprados automaticamente.'}
                     </div>
                     <div>
                        <label className="text-sm font-medium text-slate-900 block mb-1.5">Nome/Título do Projeto *</label>
                        <Input value={formProjeto.nome} onChange={e => setFormProjeto({...formProjeto, nome: e.target.value})} placeholder="Ex: Campanha Black Friday..." />
                     </div>
                     <div>
                        <label className="text-sm font-medium text-slate-900 block mb-1.5">Tipo do Projeto</label>
                        <select value={formProjeto.tipo} onChange={e => setFormProjeto({...formProjeto, tipo: e.target.value})} className="w-full text-sm rounded-md border border-slate-200 px-3 py-2 bg-white">
                           <option value="build">Build</option>
                           <option value="craft">Craft</option>
                           <option value="avulso">Avulso</option>
                        </select>
                     </div>
                     <div className="col-span-2">
                        <label className="text-sm font-medium text-slate-900 block mb-1.5">Escopo Original (Briefing resumido)</label>
                        <Textarea value={formProjeto.descricao} onChange={e => setFormProjeto({...formProjeto, descricao: e.target.value})} className="min-h-[80px]" />
                     </div>
                   </div>

                   <div className="border border-slate-200 rounded-lg overflow-hidden flex flex-col mt-4">
                      <div className="bg-slate-100 p-3 border-b border-slate-200 font-semibold text-sm flex justify-between items-center text-slate-800">
                         <span>Escopo Detalhado (Tarefas ou Etapas do Projeto)</span>
                         <Badge variant="secondary" className="bg-white">{formProjeto.etapas.length}</Badge>
                      </div>
                      <div className="p-4 space-y-4 bg-slate-50/50">
                         {formProjeto.etapas.length === 0 ? (
                            <div className="text-center py-6 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-lg">
                               Nenhuma etapa adicionada.<br/>Clique abaixo para estruturar este projeto.
                            </div>
                         ) : (
                            formProjeto.etapas.map((etapa, idx) => (
                               <div key={etapa.id} className="relative bg-white border border-slate-200 p-3 rounded-lg shadow-sm flex items-start gap-3 group animate-in fade-in slide-in-from-bottom-2">
                                  <div className="pt-2 text-slate-300">
                                    <GripVertical className="w-4 h-4 cursor-grab" />
                                  </div>
                                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                                     <div className="col-span-2 md:col-span-1">
                                        <Input placeholder="Título da etapa" className="h-8 text-sm" value={etapa.titulo} onChange={e => editarEtapaProjeto(etapa.id, { titulo: e.target.value })} />
                                     </div>
                                     <div className="col-span-2 md:col-span-1">
                                        <select className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors" value={etapa.servicoId} onChange={e => {
                                           const serv = servicos.find(s => s.id === e.target.value);
                                           editarEtapaProjeto(etapa.id, { servicoId: e.target.value, creditos: serv?.creditos_padrao || 0 });
                                        }}>
                                           <option value="" disabled>Escolha um serviço...</option>
                                           {servicos.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                                        </select>
                                     </div>
                                     <div>
                                        <select className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors" value={etapa.responsavelId} onChange={e => editarEtapaProjeto(etapa.id, { responsavelId: e.target.value })}>
                                           <option value="" disabled>Responsável (Opcional)</option>
                                           {timeMembers.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                                        </select>
                                     </div>
                                     <div className="flex items-center gap-2">
                                        <Input type="number" placeholder="Cr" className="h-8 text-sm w-20" value={etapa.creditos} onChange={e => editarEtapaProjeto(etapa.id, { creditos: Number(e.target.value) })} />
                                        <span className="text-xs text-slate-500">cr</span>
                                     </div>
                                  </div>
                                  <button title="Remover" onClick={() => excluirEtapaProjeto(etapa.id)} className="pt-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                     <Trash2 className="w-4 h-4" />
                                  </button>
                               </div>
                            ))
                         )}
                         <Button variant="outline" className="w-full border-dashed gap-2 text-slate-600 bg-white" onClick={adcionarEtapaProjeto}>
                           <Plus className="w-4 h-4" /> Adicionar Etapa
                         </Button>
                      </div>
                   </div>
                 </div>
               )}

               {/* --- FORM DEMANDA AVULSA --- */}
               {selected.tipo === 'demanda' && (
                 <div className="space-y-6">
                   {selected.cliente_id && clientes.find(c => c.id === selected.cliente_id)?.tipo !== 'keep' && (
                      <div className="border border-purple-200 bg-purple-50 p-4 rounded-lg">
                         <label className="text-sm font-bold text-purple-900 block mb-2">Vincular a um Projeto</label>
                         <select 
                            value={formDemanda.projetoId} 
                            onChange={e => setFormDemanda({...formDemanda, projetoId: e.target.value})}
                            className="w-full text-sm rounded-md border border-purple-200 px-3 py-2 bg-white text-purple-900"
                         >
                            <option value="">Sem vínculo (avulso solto)</option>
                            {projetos.filter(p => p.cliente_id === selected.cliente_id && ['briefing', 'em_andamento', 'revisao'].includes(p.status)).map(p => (
                              <option key={p.id} value={p.id}>{p.nome}</option>
                            ))}
                         </select>
                      </div>
                   )}

                   <div>
                     <label className="text-sm font-medium text-slate-900 mb-1.5 block">
                       Cliente *
                     </label>
                     <select
                       value={formDemanda.clienteId || selected.cliente_id || ''}
                       onChange={e => {
                         setFormDemanda({...formDemanda, clienteId: e.target.value, projetoId: ''});
                         atualizarTriagemItem(selected.id, { cliente_id: e.target.value });
                         if (e.target.value) {
                           fetchCicloAtivo(e.target.value).then(setCicloAtivo).catch(() => setCicloAtivo(null));
                         }
                       }}
                       className="w-full text-sm rounded-md border border-slate-200 bg-white px-3 py-2"
                     >
                       <option value="" disabled>Selecione o cliente desta demanda</option>
                       {clientes.map(c => (
                         <option key={c.id} value={c.id}>{c.nome} — {c.tipo}</option>
                       ))}
                     </select>
                   </div>

                   <div>
                     <label className="text-sm font-medium text-slate-900 mb-1.5 block">Título da Demanda *</label>
                     <Input value={formDemanda.titulo} onChange={(e) => setFormDemanda({...formDemanda, titulo: e.target.value})} className="bg-slate-50 border-slate-200 text-slate-900" />
                   </div>

                   <div className="flex bg-slate-50 rounded-lg p-3 border border-slate-200 items-start gap-3">
                      <input type="checkbox" id="wait_info" className="mt-1" checked={formDemanda.aguardando} onChange={e => setFormDemanda({...formDemanda, aguardando: e.target.checked})} />
                      <div className="flex-1">
                         <label htmlFor="wait_info" className="text-sm font-semibold text-slate-800 cursor-pointer block">Aguardando mais informações (Bloqueado)</label>
                         <p className="text-xs text-slate-500 mb-2 mt-0.5">Pause a liberação sem arquivar a demanda até que você receba tudo que precisa.</p>
                         {formDemanda.aguardando && (
                            <Input placeholder="O que falta para começar?" value={formDemanda.infoFaltando} onChange={e => setFormDemanda({...formDemanda, infoFaltando: e.target.value})} className="bg-white text-sm h-8" />
                         )}
                      </div>
                   </div>

                   <div className={cn("transition-opacity", formDemanda.aguardando ? "opacity-40 pointer-events-none" : "opacity-100")}>
                      <div className="grid grid-cols-2 gap-4 mb-6">
                         <div>
                            <label className="text-sm font-medium text-slate-900 mb-1.5 block">Categoria/Serviço *</label>
                            <select 
                            className="w-full text-sm rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 h-10"
                            value={formDemanda.servicoId}
                            onChange={(e) => {
                               const srv = servicos.find(s => s.id === e.target.value);
                               setFormDemanda({...formDemanda, servicoId: e.target.value, creditos: srv?.creditos_padrao || 0});
                            }}
                            >
                            {Object.keys(servicosAgrupados).map(cat => (
                               <optgroup label={cat} key={cat}>
                                  {servicosAgrupados[cat].map(servico => (
                                  <option key={servico.id} value={servico.id}>{servico.nome} ({servico.creditos_padrao}c)</option>
                                  ))}
                               </optgroup>
                            ))}
                            </select>
                         </div>
                         <div>
                            <label className="text-sm font-medium text-slate-900 mb-1.5 block">Custo Padrão (Créditos)</label>
                            <Input type="number" value={formDemanda.creditos} onChange={e => setFormDemanda({...formDemanda, creditos: Number(e.target.value)})} className="bg-slate-50" />
                         </div>
                      </div>

                      <div className="border-t border-slate-100 pt-6 grid grid-cols-2 gap-4">
                         <div>
                            <label className="text-sm font-medium text-slate-900 mb-1.5 block">Responsável *</label>
                            <select 
                            value={formDemanda.responsavel}
                            onChange={(e) => setFormDemanda({...formDemanda, responsavel: e.target.value})}
                            className="w-full text-sm rounded-md border border-slate-200 bg-white px-3 py-2 text-slate-900 h-10"
                            >
                            {!formDemanda.responsavel && <option value="" disabled>Selecione um membro</option>}
                            {timeMembers.map(member => (
                               <option key={member.id} value={member.id}>{member.nome}</option>
                            ))}
                            </select>
                         </div>
                         <div>
                            <label className="text-sm font-medium text-slate-900 mb-1.5 block">Prazo Ideal</label>
                            <Input type="date" value={formDemanda.dataVencimento} onChange={e => setFormDemanda({...formDemanda, dataVencimento: e.target.value})} className="bg-white" />
                         </div>
                      </div>
                   </div>
                 </div>
               )}

                </div>
              </div>

              {/* Footer */}
              <div className="bg-white border-t border-slate-200 px-6 py-3 flex items-center justify-between shrink-0 z-10">
                 <Button variant="ghost" onClick={handleArquivar} disabled={isSubmitting} className="text-slate-500 hover:text-red-600">
                    Arquivar / Descartar
                 </Button>
                 <Button className={cn("gap-2", formDemanda.aguardando && selected.tipo === 'demanda' ? "bg-amber-500 hover:bg-amber-600" : "bg-blue-600 hover:bg-blue-700")} 
                        onClick={
                          selected.tipo === 'novo_cliente' ? handleLiberarNovoCliente : 
                          selected.tipo === 'novo_projeto' ? handleLiberarNovoProjeto : 
                          handleLiberarDemanda
                        } disabled={isSubmitting}>
                  {isSubmitting ? 'Processando...' : 
                     (formDemanda.aguardando && selected.tipo === 'demanda' ? 'Salvar Incompleto' : 
                      selected.tipo === 'novo_cliente' ? 'Gerar Acesso e Criar' : 
                      selected.tipo === 'novo_projeto' ? 'Criar Projeto' : 'Liberar para Produção')}
                  {!isSubmitting && <ArrowRight className="w-4 h-4" />}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* MODAL SENHA TEMPORÁRIA */}
      <Dialog open={modalSenha.open} onOpenChange={(val) => {
         if (!val) setModalSenha({ open: false, email: '', senha: '' });
      }}>
         <DialogContent className="sm:max-w-md">
            <DialogHeader>
               <DialogTitle className="text-emerald-700 flex items-center gap-2"><CheckCircle className="w-5 h-5" /> Cliente criado com sucesso!</DialogTitle>
               <DialogDescription className="pt-2 text-slate-600 text-sm">
                  Copie as credenciais abaixo e envie para o cliente pelo WhatsApp para liberar o acesso ao painel.
               </DialogDescription>
            </DialogHeader>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 font-mono space-y-3 mt-2">
               <div>
                  <span className="text-xs text-slate-500 uppercase tracking-wider block mb-1">Email (Login)</span>
                  <div className="flex gap-2">
                     <Input readOnly value={modalSenha.email} className="bg-white h-9" />
                  </div>
               </div>
               <div>
                  <span className="text-xs text-slate-500 uppercase tracking-wider block mb-1">Senha Provisória</span>
                  <div className="flex gap-2">
                     <Input readOnly value={modalSenha.senha} className="bg-white h-9 font-bold tracking-widest text-lg" />
                     <Button variant="outline" size="icon" onClick={() => {
                        navigator.clipboard.writeText(`Acesso liberado ao Arke!\nSeu Login: ${modalSenha.email}\nSua Senha: ${modalSenha.senha}\nAcesse: https://arke.work`);
                        toast.success('Copiado para a área de transferência!');
                     }}>
                        <Copy className="w-4 h-4 text-slate-600" />
                     </Button>
                  </div>
               </div>
            </div>
            <DialogFooter className="sm:justify-end border-t border-slate-100 pt-4 mt-2">
               <Button variant="ghost" onClick={() => setModalSenha({ open: false, email: '', senha: '' })}>Fechar</Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
    </div>
  );
}
