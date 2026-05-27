import React, { useState } from 'react';
import { useArkeStore, Subtarefa } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, GripVertical, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import * as queries from '@/lib/supabase/queries';
import { toast } from 'sonner';

interface Props {
  tarefaId: string;
  subtarefas: Subtarefa[];
  setSubtarefas: React.Dispatch<React.SetStateAction<Subtarefa[]>>;
}

export function TabSubtarefas({ tarefaId, subtarefas, setSubtarefas }: Props) {
  const { toggleSubtarefa, adicionarSubtarefa, excluirSubtarefa } = useArkeStore();
  const [novaTitulo, setNovaTitulo] = useState('');
  
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaTitulo.trim()) return;
    
    const titulo = novaTitulo.trim();
    setNovaTitulo('');
    
    try {
      const order = subtarefas.length;
      await adicionarSubtarefa(tarefaId, titulo, order);
      // To show local optimistically, we don't have the generated ID though, so let's just refetch them or reload the modal. 
      // Actually we will append with a temp id, and reload on next open, or better:
      const nova = await queries.createSubtarefa({ tarefa_id: tarefaId, titulo, ordem: order, concluida: false });
      setSubtarefas(prev => [...prev, nova]);
    } catch (e) {
      toast.error('Erro ao adicionar subtarefa');
    }
  };

  const handleToggle = async (id: string, concluida: boolean) => {
    // Optimistic update
    setSubtarefas(prev => prev.map(s => s.id === id ? { ...s, concluida: !concluida } : s));
    try {
      await toggleSubtarefa(tarefaId, id, !concluida);
    } catch (e) {
      // Revert
      setSubtarefas(prev => prev.map(s => s.id === id ? { ...s, concluida } : s));
      toast.error('Erro ao alternar subtarefa');
    }
  };

  const handleDelete = async (id: string) => {
    const backup = [...subtarefas];
    setSubtarefas(prev => prev.filter(s => s.id !== id));
    try {
      await excluirSubtarefa(tarefaId, id);
    } catch (e) {
      setSubtarefas(backup);
      toast.error('Erro ao excluir subtarefa');
    }
  };

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    
    const startIndex = result.source.index;
    const endIndex = result.destination.index;
    
    if (startIndex === endIndex) return;

    const list = Array.from(subtarefas);
    const [removed] = list.splice(startIndex, 1);
    list.splice(endIndex, 0, removed);
    
    setSubtarefas(list);

    // Update orders in DB
    try {
      await Promise.all(list.map((item, index) => 
        queries.updateSubtarefa(item.id, { ordem: index })
      ));
    } catch (e) {
      toast.error('Erro ao reordenar subtarefas');
    }
  };

  const concluidas = subtarefas.filter(s => s.concluida).length;
  const total = subtarefas.length;
  const porcentagem = total > 0 ? (concluidas / total) * 100 : 0;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-slate-900">Checklist da Tarefa</h3>
        {total > 0 && (
          <span className="text-sm font-medium text-slate-500">
            {concluidas} de {total} concluídas
          </span>
        )}
      </div>

      {total > 0 && (
        <div className="w-full bg-slate-100 rounded-full h-1.5 mb-6">
          <div 
            className="bg-green-500 h-1.5 rounded-full transition-all duration-500" 
            style={{width: `${porcentagem}%`}}
          ></div>
        </div>
      )}

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="subtarefasList">
          {(provided) => (
            <div className="space-y-2 mb-6" {...provided.droppableProps} ref={provided.innerRef}>
              {subtarefas.map((sub, index) => (
                // @ts-expect-error key is valid React prop but Draggable typing is outdated
                <Draggable key={sub.id} draggableId={sub.id} index={index}>
                  {(provided, snapshot) => (
                    <div 
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border group transition-colors",
                        sub.concluida ? "bg-slate-50/50 border-slate-100" : "bg-white border-slate-200 shadow-sm",
                        snapshot.isDragging && "shadow-md opacity-90 scale-[1.02] border-blue-200"
                      )}
                    >
                      <div {...provided.dragHandleProps} className="cursor-grab text-slate-300 hover:text-slate-500 transition-opacity">
                        <GripVertical className="w-4 h-4" />
                      </div>
                      
                      <Checkbox 
                        checked={sub.concluida} 
                        onCheckedChange={() => handleToggle(sub.id, sub.concluida)}
                        className="w-5 h-5 rounded-md border-slate-300 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                      />
                      
                      <span className={cn(
                        "flex-1 text-sm transition-all text-slate-700",
                        sub.concluida && "text-slate-400 line-through"
                      )}>
                        {sub.titulo}
                      </span>

                      <button 
                        type="button" 
                        onClick={() => handleDelete(sub.id)}
                        className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <form onSubmit={handleAdd} className="flex gap-2">
        <Input 
          placeholder="Adicionar nova subtarefa..." 
          value={novaTitulo}
          onChange={e => setNovaTitulo(e.target.value)}
          className="bg-slate-50 border-slate-200"
        />
        <Button type="submit" variant="secondary" className="gap-2 shrink-0">
          <Plus className="w-4 h-4" />
          Adicionar
        </Button>
      </form>
    </div>
  );
}
