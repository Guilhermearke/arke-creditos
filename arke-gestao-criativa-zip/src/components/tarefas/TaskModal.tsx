import React, { useState, useEffect } from 'react';
import { useArkeStore, Tarefa, Subtarefa, Comentario } from '@/lib/store';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrigemIcon } from '@/components/integracoes/OrigemBadge';
import { TabDetalhes } from './TabDetalhes';
import { TabSubtarefas } from './TabSubtarefas';
import { TabComentarios } from './TabComentarios';
import { TabAtividade } from './TabAtividade';
import * as queries from '@/lib/supabase/queries';
import { Loader2 } from 'lucide-react';

interface TaskModalProps {
  tarefaId: string | null;
  onClose: () => void;
  isClienteView?: boolean;
  isTimeView?: boolean;
  onUpdate?: () => void;
}

export function TaskModal({ tarefaId, onClose, isClienteView, isTimeView, onUpdate }: TaskModalProps) {
  const { tarefas, clientes } = useArkeStore();
  const [activeTab, setActiveTab] = useState('detalhes');

  const [subtarefas, setSubtarefas] = useState<Subtarefa[]>([]);
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (tarefaId) {
      setLoading(true);
      Promise.all([
        queries.fetchSubtarefas(tarefaId),
        queries.fetchComentarios(tarefaId)
      ]).then(([subs, coms]) => {
        if (mounted) {
          setSubtarefas(subs || []);
          setComentarios(coms || []);
          setLoading(false);
        }
      }).catch(err => {
        console.error("Erro fetch modal", err);
        if (mounted) setLoading(false);
      });
    }
    return () => { mounted = false; };
  }, [tarefaId]);

  if (!tarefaId) return null;
  
  const tarefa = tarefas.find(t => t.id === tarefaId);
  if (!tarefa) return null;

  const cliente = clientes.find(c => c.id === tarefa.cliente_id);

  return (
    <Dialog open={!!tarefaId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl w-[95vw] h-[85vh] p-0 flex flex-col gap-0 bg-white border-0 overflow-hidden shadow-2xl">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
            <p className="text-slate-500 font-medium">Carregando detalhes...</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <OrigemIcon origem={tarefa.origem} className="w-5 h-5" />
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{cliente?.nome} &bull; {tarefa.status.replace('_', ' ')}</p>
                  <h2 className="text-xl font-bold text-slate-900 leading-tight">{tarefa.titulo}</h2>
                </div>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
              <div className="px-6 pt-2 bg-slate-50 border-b border-slate-200">
                <TabsList className="bg-transparent h-auto p-0 gap-6">
                  <TabsTrigger value="detalhes" className="opacity-60 data-[state=active]:opacity-100 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-0 py-3 text-sm font-medium">Detalhes</TabsTrigger>
                  {!isClienteView && (
                    <TabsTrigger value="subtarefas" className="opacity-60 data-[state=active]:opacity-100 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-0 py-3 text-sm font-medium flex items-center gap-2">
                      Subtarefas
                      <span className="bg-slate-200 text-slate-700 w-5 h-5 rounded-full flex items-center justify-center text-[10px]">{subtarefas.length}</span>
                    </TabsTrigger>
                  )}
                  <TabsTrigger value="comentarios" className="opacity-60 data-[state=active]:opacity-100 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-0 py-3 text-sm font-medium flex items-center gap-2">
                    Comentários
                    <span className="bg-slate-200 text-slate-700 w-5 h-5 rounded-full flex items-center justify-center text-[10px]">{comentarios.filter(c => isClienteView ? !c.interno : true).length}</span>
                  </TabsTrigger>
                  {!isClienteView && (
                    <TabsTrigger value="atividade" className="opacity-60 data-[state=active]:opacity-100 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-0 py-3 text-sm font-medium">Atividade</TabsTrigger>
                  )}
                </TabsList>
              </div>

              <div className="flex-1 overflow-y-auto bg-white p-6 custom-scrollbar">
                <TabsContent value="detalhes" className="m-0 focus-visible:outline-none">
                  <TabDetalhes tarefa={tarefa} cliente={cliente} isClienteView={isClienteView} isTimeView={isTimeView} onUpdate={onUpdate} />
                </TabsContent>
                
                {!isClienteView && (
                  <TabsContent value="subtarefas" className="m-0 focus-visible:outline-none">
                    <TabSubtarefas 
                      tarefaId={tarefa.id} 
                      subtarefas={subtarefas} 
                      setSubtarefas={setSubtarefas} 
                    />
                  </TabsContent>
                )}
                
                <TabsContent value="comentarios" className="m-0 focus-visible:outline-none h-full">
                  <TabComentarios 
                    tarefaId={tarefa.id} 
                    comentarios={comentarios} 
                    setComentarios={setComentarios} 
                  />
                </TabsContent>

                {!isClienteView && (
                  <TabsContent value="atividade" className="m-0 focus-visible:outline-none h-full">
                    <TabAtividade tarefaId={tarefa.id} />
                  </TabsContent>
                )}
              </div>
            </Tabs>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
