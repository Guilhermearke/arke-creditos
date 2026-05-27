import React, { useMemo, useState, useEffect } from 'react';
import { useArkeStore, StatusTarefa, Tarefa } from '../../lib/store';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, MoreHorizontal, Plus, KanbanSquare, List, CalendarDays, ChevronDown, FilterX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  format, 
  isSameDay, 
  addDays, 
  isPast, 
  isFuture, 
  nextSunday, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek,
  eachDayOfInterval,
  isToday,
  isSameMonth
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { OrigemIcon } from '@/components/integracoes/OrigemBadge';
import { TaskModal } from '@/components/tarefas/TaskModal';
import { CreateTaskModal } from '@/components/tarefas/CreateTaskModal';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';

type ViewMode = 'kanban' | 'lista' | 'calendario';
type DateTab = 'todas' | 'hoje' | 'amanha' | 'esta_semana' | 'depois' | 'atrasadas';

const COLUNAS: { id: StatusTarefa; label: string }[] = [
  { id: 'backlog', label: 'Backlog' },
  { id: 'a_fazer', label: 'A Fazer' },
  { id: 'em_andamento', label: 'Em Andamento' },
  { id: 'em_revisao', label: 'Em Revisão' },
  { id: 'aprovado', label: 'Aprovado' },
  { id: 'entregue', label: 'Entregue' }
];

const prioridadeCores = {
  urgente: 'border-l-red-500 bg-red-100',
  alta: 'border-l-orange-500 bg-orange-100',
  normal: 'border-l-blue-500 bg-blue-100',
  baixa: 'border-l-slate-400 bg-slate-100'
};

const prioridadeBadge = {
  urgente: 'text-red-700',
  alta: 'text-orange-700',
  normal: 'text-blue-700',
  baixa: 'text-slate-700'
};

// CSS Grid Month Calendar Helper
const generateCalendarDays = (currentDate: Date) => {
  const start = startOfWeek(startOfMonth(currentDate));
  const end = endOfWeek(endOfMonth(currentDate));
  return eachDayOfInterval({ start, end });
};

export default function Producao() {
  const { tarefas, clientes, servicos, timeMembers, projetos, moverTarefaKanban, isLoading } = useArkeStore();
  
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  // Persisted view mode
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem('arke_producao_view');
    return (saved as ViewMode) || 'kanban';
  });

  useEffect(() => {
    localStorage.setItem('arke_producao_view', viewMode);
  }, [viewMode]);

  // Date Tabs Filter
  const [activeTab, setActiveTab] = useState<DateTab>('todas');
  
  // Custom Filters
  const [showFilters, setShowFilters] = useState(() => {
    return localStorage.getItem('arke_producao_show_filters') === 'true';
  });
  
  useEffect(() => {
    localStorage.setItem('arke_producao_show_filters', showFilters.toString());
  }, [showFilters]);

  const [selClientes, setSelClientes] = useState<string[]>([]);
  const [selResponsaveis, setSelResponsaveis] = useState<string[]>([]);
  const [selCategorias, setSelCategorias] = useState<string[]>([]);
  const [selPrioridades, setSelPrioridades] = useState<string[]>([]);
  const [selOrigens, setSelOrigens] = useState<string[]>([]);
  const [selProjetos, setSelProjetos] = useState<string[]>([]);
  
  // List View Sorting & Grouping
  const [sortField, setSortField] = useState<'titulo' | 'data_vencimento' | 'prioridade' | 'status'>('data_vencimento');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [groupByProject, setGroupByProject] = useState(false);

  // Calendar state
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  const resetFilters = () => {
    setSelClientes([]);
    setSelResponsaveis([]);
    setSelCategorias([]);
    setSelPrioridades([]);
    setSelOrigens([]);
    setSelProjetos([]);
  };

  // Base list of tasks (excluding triagem and arquivado)
  const baseTarefas = useMemo(() => {
    return tarefas.filter(t => t.status !== 'triagem' && t.status !== 'arquivado');
  }, [tarefas]);

  // Derive counts for tabs (based on all active filters EXCEPT the date tab itself)
  const baseFilteredForTabs = useMemo(() => {
    return baseTarefas.filter(t => {
      // Apply the multi-select filters
      if (selClientes.length > 0 && (!t.cliente_id || !selClientes.includes(t.cliente_id))) return false;
      if (selResponsaveis.length > 0 && (!t.responsavel_id || !selResponsaveis.includes(t.responsavel_id))) return false;
      
      const srvCategoria = servicos.find(s => s.nome === t.servico)?.categoria || 'Geral';
      if (selCategorias.length > 0 && !selCategorias.includes(srvCategoria)) return false;
      
      if (selPrioridades.length > 0 && !selPrioridades.includes(t.prioridade)) return false;
      if (selOrigens.length > 0 && !selOrigens.includes(t.origem)) return false;
      
      if (selProjetos.length > 0) {
        if (!t.projeto_id || !selProjetos.includes(t.projeto_id)) return false;
      }
      
      return true;
    });
  }, [baseTarefas, selClientes, selResponsaveis, selCategorias, selPrioridades, selOrigens, selProjetos, servicos]);

  const categorizeDate = (dataVencimento?: string, status?: string): DateTab[] => {
    const categories: DateTab[] = ['todas'];
    if (!dataVencimento) return categories;
    
    const date = new Date(dataVencimento);
    const today = new Date();
    
    const isLate = isPast(date) && !isSameDay(date, today) && !['entregue', 'aprovado'].includes(status || '');
    if (isLate) categories.push('atrasadas');

    if (isSameDay(date, today)) {
       categories.push('hoje');
       categories.push('esta_semana'); // Today is in this week
    } else if (isSameDay(date, addDays(today, 1))) {
       categories.push('amanha');
       categories.push('esta_semana'); // Tomorrow is likely in this week, but accurately we check nextSunday:
       if (date <= nextSunday(today)) {
          // already pushed
       }
    } else if (date > today && date <= nextSunday(today)) {
       categories.push('esta_semana');
    } else if (date > nextSunday(today)) {
       categories.push('depois');
    }
    
    return categories;
  };

  const getTabCount = (tab: DateTab) => {
    return baseFilteredForTabs.filter(t => categorizeDate(t.data_vencimento, t.status).includes(tab)).length;
  };

  // Final filtered list respecting tabs and filters
  const tarefasFiltradas = useMemo(() => {
    return baseFilteredForTabs.filter(t => categorizeDate(t.data_vencimento, t.status).includes(activeTab));
  }, [baseFilteredForTabs, activeTab]);

  // List View Sorted Task
  const listSorted = useMemo(() => {
    return [...tarefasFiltradas].sort((a, b) => {
      if (groupByProject) {
        const projA = a.projeto_id || 'zzzzzz';
        const projB = b.projeto_id || 'zzzzzz';
        if (projA !== projB) {
          if (projA === 'zzzzzz') return 1;
          if (projB === 'zzzzzz') return -1;
          const nomeA = projetos.find(p => p.id === projA)?.nome || '';
          const nomeB = projetos.find(p => p.id === projB)?.nome || '';
          return nomeA.localeCompare(nomeB);
        }
      }

      let valA = a[sortField] || '';
      let valB = b[sortField] || '';
      
      if (sortField === 'prioridade') {
        const order = { urgente: 1, alta: 2, normal: 3, baixa: 4 };
        valA = order[a.prioridade] || 5;
        valB = order[b.prioridade] || 5;
      }
      
      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [tarefasFiltradas, sortField, sortDir, groupByProject, projetos]);

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    moverTarefaKanban(draggableId, destination.droppableId as StatusTarefa);
  };

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  // Extracts options
  const categoriasUnicas = Array.from(new Set(servicos.map(s => s.categoria).filter(Boolean)));
  const origensUnicas = ['arke', 'slack', 'trello', 'clickup', 'painel_cliente', 'manual'];
  const prioridades = ['baixa', 'normal', 'alta', 'urgente'];

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <TaskModal tarefaId={selectedTaskId} onClose={() => setSelectedTaskId(null)} />
      <CreateTaskModal open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen} origem="arke" />

      {/* HEADER */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Produção</h1>
        <div className="flex items-center gap-4">
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button onClick={() => setViewMode('kanban')} className={cn("px-3 py-1.5 rounded-md text-sm font-medium flex items-center transition-colors", viewMode === 'kanban' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700')}>
              <KanbanSquare className="w-4 h-4 mr-2" /> Kanban
            </button>
            <button onClick={() => setViewMode('lista')} className={cn("px-3 py-1.5 rounded-md text-sm font-medium flex items-center transition-colors", viewMode === 'lista' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700')}>
              <List className="w-4 h-4 mr-2" /> Lista
            </button>
            <button onClick={() => setViewMode('calendario')} className={cn("px-3 py-1.5 rounded-md text-sm font-medium flex items-center transition-colors", viewMode === 'calendario' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700')}>
              <CalendarDays className="w-4 h-4 mr-2" /> Calendário
            </button>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 h-9">
            <Plus className="w-4 h-4 mr-2" /> Nova Tarefa
          </Button>
        </div>
      </div>

      {/* TABS */}
      <div className="flex border-b border-slate-200 mb-3 overflow-x-auto custom-scrollbar pb-1">
        {(['todas', 'hoje', 'amanha', 'esta_semana', 'depois', 'atrasadas'] as DateTab[]).map(tab => {
          const labels = {
            todas: 'Todas', hoje: 'Hoje', amanha: 'Amanhã', 
            esta_semana: 'Esta semana', depois: 'Depois', atrasadas: 'Atrasadas'
          };
          const count = getTabCount(tab);
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-4 py-2 border-b-2 font-medium text-sm transition-colors whitespace-nowrap",
                isActive ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              )}
            >
              {labels[tab]} <span className={cn("ml-1 rounded-full px-2 py-0.5 text-xs", isActive ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-500")}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* FILTER TOGGLE & PANEL */}
      <div className="mb-4 flex flex-col gap-2">
        <button onClick={() => setShowFilters(!showFilters)} className="text-sm font-medium text-slate-500 hover:text-slate-700 flex items-center self-start px-2 py-1 -ml-2 rounded-md hover:bg-slate-50">
          <ChevronDown className={cn("w-4 h-4 mr-1 transition-transform", showFilters && "rotate-180")} />
          Filtros { (selClientes.length > 0 || selResponsaveis.length > 0 || selCategorias.length > 0 || selPrioridades.length > 0 || selOrigens.length > 0 || selProjetos.length > 0) && <span className="ml-2 w-2 h-2 rounded-full bg-blue-500"></span> }
        </button>

        {showFilters && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex gap-4 flex-wrap items-end mb-2">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Cliente</label>
              <select multiple className="text-sm border border-slate-200 rounded p-1 w-40 bg-white" value={selClientes} onChange={e => setSelClientes(Array.from(e.target.selectedOptions, o => (o as HTMLOptionElement).value))}>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Responsável</label>
              <select multiple className="text-sm border border-slate-200 rounded p-1 w-40 bg-white" value={selResponsaveis} onChange={e => setSelResponsaveis(Array.from(e.target.selectedOptions, o => (o as HTMLOptionElement).value))}>
                {timeMembers.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
              </select>
            </div>
             <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Serviço/Categoria</label>
              <select multiple className="text-sm border border-slate-200 rounded p-1 w-40 bg-white" value={selCategorias} onChange={e => setSelCategorias(Array.from(e.target.selectedOptions, o => (o as HTMLOptionElement).value))}>
                {categoriasUnicas.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Prioridade</label>
              <select multiple className="text-sm border border-slate-200 rounded p-1 w-32 bg-white" value={selPrioridades} onChange={e => setSelPrioridades(Array.from(e.target.selectedOptions, o => (o as HTMLOptionElement).value))}>
                {prioridades.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Origem</label>
              <select multiple className="text-sm border border-slate-200 rounded p-1 w-32 bg-white" value={selOrigens} onChange={e => setSelOrigens(Array.from(e.target.selectedOptions, o => (o as HTMLOptionElement).value))}>
                {origensUnicas.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Projeto</label>
              <select multiple className="text-sm border border-slate-200 rounded p-1 w-40 bg-white" value={selProjetos} onChange={e => setSelProjetos(Array.from(e.target.selectedOptions, o => (o as HTMLOptionElement).value))}>
                {projetos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </div>
            {(selClientes.length > 0 || selResponsaveis.length > 0 || selCategorias.length > 0 || selPrioridades.length > 0 || selOrigens.length > 0 || selProjetos.length > 0) && (
              <Button variant="ghost" size="sm" onClick={resetFilters} className="text-slate-500 hover:text-red-600 self-end mb-1">
                <FilterX className="w-4 h-4 mr-2" /> Limpar
              </Button>
            )}
          </div>
        )}
      </div>

      {/* VIEWS */}
      
      {viewMode === 'kanban' && (
        <div className="flex-1 overflow-hidden flex flex-col">
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex-1 flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
              {COLUNAS.map(coluna => {
                const tarefasDaColuna = tarefasFiltradas.filter(t => t.status === coluna.id);
                return (
                  <div key={coluna.id} className="w-[320px] min-w-[320px] flex flex-col bg-slate-100/50 border border-slate-200/60 rounded-xl overflow-hidden shrink-0 h-full">
                    <div className="p-3 border-b border-slate-200/50 bg-slate-100 flex items-center justify-between shrink-0">
                      <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">{coluna.label}</h3>
                      <span className="text-xs font-semibold text-slate-500 bg-slate-200/50 px-2 pl-2 py-0.5 rounded-full">
                        {tarefasDaColuna.length}
                      </span>
                    </div>
                    
                    <Droppable droppableId={coluna.id}>
                      {(provided, snapshot) => (
                        <div 
                          ref={provided.innerRef} 
                          {...provided.droppableProps}
                          className={cn(
                            "flex-1 p-3 flex flex-col gap-3 min-h-[150px] transition-colors overflow-y-auto overflow-x-hidden",
                            snapshot.isDraggingOver ? "bg-slate-100/80" : ""
                          )}
                        >
                          {isLoading ? (
                            <>
                              <Skeleton className="h-28 w-full rounded-lg bg-white/50" />
                              <Skeleton className="h-28 w-full rounded-lg bg-white/50" />
                            </>
                          ) : tarefasDaColuna.map((tarefa, index) => {
                            const cliente = clientes.find(c => c.id === tarefa.cliente_id);
                            const servicoCat = servicos.find(s => s.nome === tarefa.servico)?.categoria || 'Geral';
                            return (
                              // @ts-ignore
                              <Draggable key={tarefa.id} draggableId={tarefa.id} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    onClick={() => setSelectedTaskId(tarefa.id)}
                                    className={cn(
                                      "bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex flex-col gap-3 transition-shadow cursor-pointer",
                                      "border-l-4", prioridadeCores[tarefa.prioridade].split(' ')[0],
                                      snapshot.isDragging ? "shadow-lg ring-1 ring-blue-500/20" : "hover:shadow-md"
                                    )}
                                  >
                                    <div className="flex justify-between items-start gap-2">
                                      <h4 className="font-medium text-slate-900 text-sm leading-snug line-clamp-2">
                                        {tarefa.titulo}
                                      </h4>
                                    </div>
                                    
                                    <div className="flex flex-wrap items-center gap-2">
                                      {cliente && (
                                        <Badge variant="secondary" className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium">
                                          {cliente.nome}
                                        </Badge>
                                      )}
                                      {tarefa.projeto_id && (
                                        <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">
                                          {projetos.find(p => p.id === tarefa.projeto_id)?.nome || 'Projeto'}
                                        </Badge>
                                      )}
                                      <Badge variant="outline" className="text-[10px] text-slate-500 border-slate-200 uppercase tracking-wide px-1.5">{servicoCat}</Badge>
                                      {tarefa.creditos_cobrados !== undefined && (
                                        <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded ml-auto">
                                          {tarefa.creditos_cobrados} cr
                                        </span>
                                      )}
                                    </div>

                                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-1">
                                      <div className="flex items-center gap-1.5 text-slate-400">
                                        <OrigemIcon origem={tarefa.origem} className="w-3.5 h-3.5" />
                                        {tarefa.link_entrega && <span className="w-2 h-2 rounded-full bg-green-500" title="Link anexado"></span>}
                                      </div>
                                      
                                      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                                        {tarefa.data_vencimento && (
                                          <div className="flex items-center gap-1">
                                            <Clock className={cn("w-3.5 h-3.5", isPast(new Date(tarefa.data_vencimento)) && !isSameDay(new Date(tarefa.data_vencimento), new Date()) ? 'text-red-500' : '')} />
                                            <span className={cn(isPast(new Date(tarefa.data_vencimento)) && !isSameDay(new Date(tarefa.data_vencimento), new Date()) ? 'text-red-600' : '')}>{format(new Date(tarefa.data_vencimento), "d MMM", { locale: ptBR })}</span>
                                          </div>
                                        )}
                                        {tarefa.responsavel_id && (
                                          <div className="w-6 h-6 rounded-full bg-slate-200 border border-white flex items-center justify-center text-[10px] text-slate-600 font-bold ml-1" title={timeMembers.find(m => m.id === tarefa.responsavel_id)?.nome}>
                                            {timeMembers.find(m => m.id === tarefa.responsavel_id)?.nome?.substring(0, 2).toUpperCase() || tarefa.responsavel_id.substring(0, 2).toUpperCase()}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            );
                          })}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                );
              })}
            </div>
          </DragDropContext>
        </div>
      )}

      {viewMode === 'lista' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex-1 overflow-y-auto flex flex-col">
          <div className="p-3 border-b border-slate-200 flex justify-end bg-slate-50">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
              <Checkbox checked={groupByProject} onCheckedChange={(c) => setGroupByProject(c as boolean)} />
              Agrupar por Projeto
            </label>
          </div>
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider sticky top-0 border-b border-slate-200 z-10">
                <tr>
                  <th className="px-4 py-3 w-10"></th>
                  <th className="px-4 py-3 cursor-pointer hover:bg-slate-100" onClick={() => toggleSort('titulo')}>Título {sortField === 'titulo' && (sortDir === 'asc' ? '↑' : '↓')}</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Projeto</th>
                  <th className="px-4 py-3 md:table-cell hidden">Responsável</th>
                  <th className="px-4 py-3 lg:table-cell hidden">Serviço</th>
                  <th className="px-4 py-3 cursor-pointer hover:bg-slate-100" onClick={() => toggleSort('status')}>Status {sortField === 'status' && (sortDir === 'asc' ? '↑' : '↓')}</th>
                  <th className="px-4 py-3 cursor-pointer hover:bg-slate-100" onClick={() => toggleSort('prioridade')}>Prioridade {sortField === 'prioridade' && (sortDir === 'asc' ? '↑' : '↓')}</th>
                  <th className="px-4 py-3 cursor-pointer hover:bg-slate-100" onClick={() => toggleSort('data_vencimento')}>Vencimento {sortField === 'data_vencimento' && (sortDir === 'asc' ? '↑' : '↓')}</th>
                  <th className="px-4 py-3 md:table-cell hidden">Créditos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  [1, 2, 3, 4, 5].map(i => (
                    <tr key={i}>
                      <td colSpan={10} className="px-4 py-3">
                        <Skeleton className="h-6 w-full rounded" />
                      </td>
                    </tr>
                  ))
                ) : listSorted.map(tarefa => {
                  const cliente = clientes.find(c => c.id === tarefa.cliente_id);
                  const projeto = projetos.find(p => p.id === tarefa.projeto_id);
                  const isLate = tarefa.data_vencimento && isPast(new Date(tarefa.data_vencimento)) && !isSameDay(new Date(tarefa.data_vencimento), new Date()) && !['entregue', 'aprovado'].includes(tarefa.status);
                  const m = timeMembers.find(m => m.id === tarefa.responsavel_id);
                  const srvCat = servicos.find(s => s.nome === tarefa.servico)?.categoria || 'Geral';
                  return (
                    <tr 
                      key={tarefa.id} 
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <Checkbox onClick={(e) => e.stopPropagation()} />
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900 cursor-pointer" onClick={() => setSelectedTaskId(tarefa.id)}>
                        {tarefa.titulo}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {cliente?.nome || '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {projeto ? <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100">{projeto.nome}</span> : '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-600 md:table-cell hidden">
                        {m?.nome || '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-600 lg:table-cell hidden">
                        <div className="flex flex-col">
                          <span>{tarefa.servico}</span>
                          <span className="text-[10px] uppercase text-slate-400">{srvCat}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary" className="bg-slate-100 text-slate-700 font-medium whitespace-nowrap">
                          {tarefa.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 capitalize text-xs font-semibold">
                           <span className={cn("w-2 h-2 rounded-full", prioridadeCores[tarefa.prioridade].split(' ')[1])}></span>
                           <span className={prioridadeBadge[tarefa.prioridade]}>{tarefa.prioridade}</span>
                        </div>
                      </td>
                      <td className={cn("px-4 py-3", isLate ? "text-red-600 font-semibold" : "text-slate-600")}>
                        {tarefa.data_vencimento ? format(new Date(tarefa.data_vencimento), "dd MMM, yy", { locale: ptBR }) : '—'}
                      </td>
                      <td className="px-4 py-3 md:table-cell hidden font-medium text-slate-600">
                        {tarefa.creditos_cobrados || 0}
                      </td>
                    </tr>
                  )
                })}
                {!isLoading && listSorted.length === 0 && (
                   <tr><td colSpan={10} className="text-center py-8 text-slate-500">Nenhuma tarefa encontrada.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {viewMode === 'calendario' && (
        <div className="flex-1 flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <h2 className="font-bold text-lg text-slate-800 capitalize">
              {format(calendarMonth, 'MMMM yyyy', { locale: ptBR })}
            </h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setCalendarMonth(startOfMonth(new Date()))}>Hoje</Button>
              <Button variant="outline" size="sm" onClick={() => setCalendarMonth(addDays(calendarMonth, -30))}>&lt;</Button>
              <Button variant="outline" size="sm" onClick={() => setCalendarMonth(addDays(calendarMonth, 30))}>&gt;</Button>
            </div>
          </div>
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-semibold text-slate-500 uppercase py-2">
            <div>Dom</div><div>Seg</div><div>Ter</div><div>Qua</div><div>Qui</div><div>Sex</div><div>Sáb</div>
          </div>
          <div className="flex-1 grid grid-cols-7 grid-rows-5 overflow-y-auto">
            {generateCalendarDays(calendarMonth).map((day, i) => {
              const isCurrentMonth = isSameMonth(day, calendarMonth);
              const isTodayDate = isToday(day);
              
              const dayTasks = tarefasFiltradas.filter(t => t.data_vencimento && isSameDay(new Date(t.data_vencimento), day));
              const displayTasks = dayTasks.slice(0, 3);
              const remaining = dayTasks.length - 3;
              
              return (
                <div key={day.toISOString()} className={cn(
                  "border-r border-b border-slate-100 p-1.5 flex flex-col min-h-[100px]",
                  !isCurrentMonth && "bg-slate-50/50 text-slate-400",
                  isTodayDate && "bg-blue-50/30 border-blue-200"
                )}>
                  <div className={cn(
                    "text-xs font-semibold mb-1 w-6 h-6 flex items-center justify-center rounded-full self-end",
                    isTodayDate ? "bg-blue-600 text-white" : "text-slate-500"
                  )}>
                    {format(day, 'd')}
                  </div>
                  <div className="flex flex-col gap-1 flex-1 overflow-y-auto custom-scrollbar pr-1">
                    {displayTasks.map(t => (
                      <div 
                        key={t.id} 
                        onClick={() => setSelectedTaskId(t.id)}
                        className={cn(
                          "text-[10px] font-medium px-1.5 py-0.5 rounded truncate cursor-pointer transition-colors border",
                          prioridadeCores[t.prioridade].split(' ')[1], // e.g. bg-blue-100
                          "border-" + prioridadeCores[t.prioridade].split(' ')[1].replace('bg-', ''), // generic hack or standard
                          "hover:brightness-95"
                        )}
                        title={t.titulo}
                      >
                        {t.titulo}
                      </div>
                    ))}
                    {remaining > 0 && (
                      <div className="text-[10px] font-medium text-slate-500 text-center hover:bg-slate-100 rounded cursor-pointer" onClick={() => setViewMode('lista')}>
                        +{remaining} mais
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
