import React, { useMemo, useState } from 'react';
import { useArkeStore, StatusTarefa } from '../../lib/store';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, MoreHorizontal, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { OrigemIcon } from '@/components/integracoes/OrigemBadge';
import { TaskModal } from '@/components/tarefas/TaskModal';
import { CreateTaskModal } from '@/components/tarefas/CreateTaskModal';

const COLUNAS: { id: StatusTarefa; label: string }[] = [
  { id: 'backlog', label: 'Backlog' },
  { id: 'a_fazer', label: 'A Fazer' },
  { id: 'em_andamento', label: 'Em Andamento' },
  { id: 'em_revisao', label: 'Em Revisão' },
  { id: 'aprovado', label: 'Aprovado' },
  { id: 'entregue', label: 'Entregue' }
];

const prioridadeCores = {
  urgente: 'border-l-red-500',
  alta: 'border-l-orange-500',
  normal: 'border-l-blue-500',
  baixa: 'border-l-slate-400'
};

export default function AdminKanban() {
  const { tarefas, clientes, moverTarefaKanban } = useArkeStore();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Filtrar apenas tarefas visíveis no Kanban (não triagem/arquivado)
  const tarefasKanban = useMemo(() => {
    return tarefas.filter(t => COLUNAS.map(c => c.id).includes(t.status));
  }, [tarefas]);

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    
    moverTarefaKanban(draggableId, destination.droppableId as StatusTarefa);
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <TaskModal tarefaId={selectedTaskId} onClose={() => setSelectedTaskId(null)} />
      <CreateTaskModal open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen} origem="arke" />
      
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Kanban</h1>
          <p className="text-sm text-slate-500">Fluxo de produção e acompanhamento de entregas.</p>
        </div>
        {/* Barra de Filtros Visual */}
        <div className="flex gap-4 items-center">
          <div className="flex gap-2">
            <Badge variant="outline" className="bg-white hover:bg-slate-50 text-slate-600 font-medium cursor-pointer">Todos os Clientes</Badge>
            <Badge variant="outline" className="bg-white hover:bg-slate-50 text-slate-600 font-medium cursor-pointer">Todos os Times</Badge>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 gap-2 h-8">
            <Plus className="w-4 h-4" />
            Nova Tarefa
          </Button>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex-1 flex gap-4 overflow-x-auto pb-4 custom-scrollbar snap-x">
          {COLUNAS.map(coluna => {
            const tarefasDaColuna = tarefasKanban.filter(t => t.status === coluna.id);
            return (
              <div key={coluna.id} className="w-[280px] min-w-[280px] md:w-[320px] md:min-w-[320px] snap-center flex flex-col bg-slate-100/50 border border-slate-200/60 rounded-xl overflow-hidden shrink-0">
                <div className="p-3 border-b border-slate-200/50 bg-slate-100 flex items-center justify-between">
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
                        "flex-1 p-3 flex flex-col gap-3 min-h-[150px] transition-colors",
                        snapshot.isDraggingOver ? "bg-slate-100 flex-1" : ""
                      )}
                    >
                      {tarefasDaColuna.map((tarefa, index) => {
                        const cliente = clientes.find(c => c.id === tarefa.cliente_id);
                        return (
                          // @ts-ignore - 'key' is required by React but missing in lib types sometimes
                          <Draggable key={tarefa.id} draggableId={tarefa.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                onClick={() => setSelectedTaskId(tarefa.id)}
                                className={cn(
                                  "bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex flex-col gap-3 transition-shadow cursor-pointer",
                                  "border-l-4", prioridadeCores[tarefa.prioridade],
                                  snapshot.isDragging ? "shadow-lg ring-1 ring-blue-500/20" : "hover:shadow-md"
                                )}
                              >
                                <div className="flex justify-between items-start gap-2">
                                  <h4 className="font-medium text-slate-900 text-sm leading-snug line-clamp-2">
                                    {tarefa.titulo}
                                  </h4>
                                  <button className="text-slate-400 hover:text-slate-600 transition-colors p-0.5 shrink-0">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </button>
                                </div>
                                
                                <div className="flex flex-wrap items-center gap-2">
                                  {cliente && (
                                    <Badge variant="secondary" className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium">
                                      {cliente.nome}
                                    </Badge>
                                  )}
                                  {tarefa.creditos_cobrados !== undefined && (
                                    <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded">
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
                                        <Clock className="w-3.5 h-3.5" />
                                        <span>{format(new Date(tarefa.data_vencimento), "d MMM", { locale: ptBR })}</span>
                                      </div>
                                    )}
                                    {tarefa.responsavel_id && (
                                      <div className="w-6 h-6 rounded-full bg-slate-200 border border-white flex items-center justify-center text-[10px] text-slate-600 font-bold ml-1">
                                        {tarefa.responsavel_id === 'Nicolas' ? 'NC' : (tarefa.responsavel_id === 'Ana Júlia' ? 'AJ' : tarefa.responsavel_id.substring(0, 2).toUpperCase())}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {tarefasDaColuna.length === 0 && !snapshot.isDraggingOver && (
                        <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-lg p-6">
                           <p className="text-sm font-medium text-slate-400">Nenhuma tarefa aqui</p>
                        </div>
                      )}
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
  );
}
