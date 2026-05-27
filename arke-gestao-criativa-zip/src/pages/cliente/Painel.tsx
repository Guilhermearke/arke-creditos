import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { CheckCircle2, AlertCircle, Clock, ExternalLink, MessageCircle, MoreHorizontal, CheckCircle, ArrowRight, Layers, FileUp, Star, ThumbsUp, ThumbsDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, addMonths, differenceInHours, parseISO, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TaskModal } from '@/components/tarefas/TaskModal';
import { Textarea } from '@/components/ui/textarea';
import * as queries from '@/lib/supabase/queries';
import { useArkeStore } from '@/lib/store';
import { toast } from 'sonner';

export default function ClientePainel() {
  const { clienteId, clienteCorTema } = useAuth();
  const { clientes, isLoading: storeLoading } = useArkeStore();
  
  const [tarefas, setTarefas] = useState<any[]>([]);
  const [projetos, setProjetos] = useState<any[]>([]);
  const [cicloAtual, setCicloAtual] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('todas');
  const [selectedTask, setSelectedTask] = useState<string | null>(null);

  const [modalEvalOpen, setModalEvalOpen] = useState(false);
  const [selectedProjetoData, setSelectedProjetoData] = useState<any>(null);
  const [evalForm, setEvalForm] = useState({ nota: 0, feedback: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cliente = clientes.find(c => c.id === clienteId);

  const loadData = async () => {
    if (!clienteId) {
      setLoading(false);
      return;
    }
    try {
      const [t, c, p] = await Promise.all([
        queries.fetchTarefasCliente(clienteId),
        queries.fetchCicloAtualCliente(clienteId),
        queries.fetchProjetosCliente(clienteId)
      ]);
      setTarefas(t || []);
      setCicloAtual(c);
      setProjetos(p || []);
    } catch (err) {
      console.error("Erro painel cliente", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadData();
  }, [clienteId]);

  if (loading || storeLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-10 w-48 bg-slate-200 rounded mb-2" />
        <div className="h-4 w-64 bg-slate-200 rounded mb-8" />
        <div className="h-48 w-full bg-slate-200 rounded-xl" />
        <div className="grid md:grid-cols-2 gap-4 mt-8">
          <div className="h-32 bg-slate-200 rounded-xl" />
          <div className="h-32 bg-slate-200 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-10 text-center text-slate-500">
        Cliente não encontrado ou ainda não vinculado ao seu login.
      </div>
    );
  }

  const dataRenovacao = cicloAtual ? addMonths(new Date(cicloAtual.data_inicio), 1) : addMonths(new Date(), 1);
  const creditosDisponiveis = cicloAtual?.creditos_disponiveis ?? cliente?.creditos_mensais ?? 0;
  const creditosUsados = cicloAtual?.creditos_usados ?? 0;
  const creditosRestantes = creditosDisponiveis - creditosUsados;
  const porcentagem = creditosDisponiveis > 0 ? (creditosUsados / creditosDisponiveis) * 100 : 0;
  const estaAcabando = creditosDisponiveis > 0 && (creditosRestantes / creditosDisponiveis) < 0.2;

  // Filtragens
  const aguardandoAprovacao = tarefas.filter(t => t.status === 'em_revisao');
  const emAndamento = tarefas.filter(t => ['a_fazer', 'em_andamento'].includes(t.status));
  const concluidas = tarefas.filter(t => ['aprovado', 'entregue'].includes(t.status));

  let filteredTarefas = tarefas;
  if (selectedTab === 'aguardando') filteredTarefas = aguardandoAprovacao;
  if (selectedTab === 'andamento') filteredTarefas = emAndamento;
  if (selectedTab === 'concluidas') filteredTarefas = concluidas;

  const renderTaskCard = (t: any) => {
    let borderColor = 'border-slate-200';
    let badgeColor = 'bg-slate-100 text-slate-700';
    
    if (t.status === 'em_revisao') { borderColor = 'border-l-4 border-l-green-500 ring-1 ring-green-100'; badgeColor = 'bg-green-100 text-green-800'; }
    else if (t.status === 'em_andamento') { borderColor = 'border-l-4 border-l-blue-500'; badgeColor = 'bg-blue-100 text-blue-800'; }
    else if (t.status === 'aprovado' || t.status === 'entregue') { borderColor = 'border-l-4 border-l-slate-300 opacity-80'; badgeColor = 'bg-slate-200 text-slate-700'; }

    return (
      <Card key={t.id} className={cn("cursor-pointer transition-all hover:shadow-md border-y-0 border-r-0 relative group", borderColor)} onClick={() => setSelectedTask(t.id)}>
        <CardContent className="p-5 flex flex-col justify-center">
          <div className="flex items-center justify-between mb-2">
            <Badge variant="secondary" className={cn("border-0 pointer-events-none capitalize", badgeColor)}>
              {t.status.replace('_', ' ')}
            </Badge>
            {t.data_vencimento && <span className="text-xs text-slate-500 font-medium">Prazo: {format(new Date(t.data_vencimento), "dd/MMM", { locale: ptBR })}</span>}
          </div>
          <h4 className="text-lg font-semibold text-slate-900 leading-tight pr-8">{t.titulo}</h4>
          
          <div className="flex items-center justify-between mt-4">
             <div className="flex items-center gap-2">
                <span className="text-xs font-medium bg-slate-100 text-slate-500 px-2 py-0.5 rounded">{t.servico || 'Design'}</span>
             </div>
             {t.status === 'em_revisao' && (
                <div className="text-xs flex items-center font-bold text-green-600">
                   Ver e decidir <ArrowRight className="w-3 h-3 ml-1" />
                </div>
             )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const handleAvaliarProjeto = async () => {
     if (!selectedProjetoData || evalForm.nota === 0) return;
     setIsSubmitting(true);
     try {
        await queries.createAvaliacao({
           projeto_id: selectedProjetoData.id,
           cliente_id: clienteId,
           nota: evalForm.nota,
           feedback: evalForm.feedback
        });
        await queries.updateProjeto(selectedProjetoData.id, { status: 'aprovado' });
        toast.success(`Projeto avaliado com sucesso! Obrigado pelo feedback.`);
        setModalEvalOpen(false);
        loadData();
     } catch (err: any) {
        toast.error('Erro ao avaliar: ' + err.message);
     } finally {
        setIsSubmitting(false);
     }
  };

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500 pb-20">
      
      {/* Detail Modal */}
      <TaskModal 
        tarefaId={selectedTask} 
        onClose={() => setSelectedTask(null)} 
        isClienteView={true} 
        onUpdate={loadData}
      />

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Olá, {cliente.nome}</h1>
          <p className="text-slate-500 mt-1">Acompanhe suas entregas e projetos.</p>
        </div>
      </div>

      {cliente.tipo === 'keep' ? (
        <Card 
          className="border-0 shadow-xl shadow-blue-900/5 text-white" 
          style={{ backgroundImage: `linear-gradient(to bottom right, var(--cliente-accent), #0f172a)` }}
        >
          <CardContent className="p-8">
            <div className="flex justify-between items-start">
               <div>
                  <p className="font-medium text-white/70 uppercase tracking-widest text-sm mb-2">Saldo do Ciclo</p>
                  <div className="flex items-end gap-3">
                    <h2 className="text-6xl font-bold font-mono tracking-tighter">{creditosRestantes}</h2>
                    <span className="text-xl font-medium text-white/80 mb-2">créditos</span>
                  </div>
               </div>
               <div className="text-right">
                  <p className="text-sm text-white/80 mb-1">{creditosUsados} de {creditosDisponiveis} créditos usados</p>
                  <p className="text-xs text-white/60">Renova em {format(dataRenovacao, "dd/MM")}</p>
               </div>
            </div>

            <div className="mt-8 space-y-2">
               <div className="w-full bg-black/20 rounded-full h-3 overflow-hidden">
                  <div 
                    className={cn("h-3 rounded-full transition-all duration-1000", estaAcabando ? "bg-red-400" : "bg-white")}
                    style={{ width: `${Math.min(porcentagem, 100)}%` }}
                  ></div>
               </div>
               {estaAcabando && (
                  <p className="text-xs font-medium text-red-200 flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" /> Seu saldo está acabando. Fale com o time se precisar de um adicional.
                  </p>
               )}
               {!cicloAtual && (
                  <p className="text-xs font-medium text-amber-200 flex items-center">
                    <Clock className="w-3 h-3 mr-1" /> Aguardando configuração do plano pelo time da Arke.
                  </p>
               )}
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Projetos Dashboard */
        projetos.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center">
              Seus Projetos
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
              {projetos.map(proj => {
                const total = proj.tarefas?.filter((t: any) => t.status !== 'arquivado' && t.visivel_cliente).length || 0;
                const done = proj.tarefas?.filter((t: any) => ['entregue', 'aprovado'].includes(t.status) && t.visivel_cliente).length || 0;
                const perc = total > 0 ? (done / total) * 100 : 0;
                
                const asPendingEval = proj.status === 'entregue' && proj.entregas?.length > 0 && !proj.avaliacao;
                // Calculo de horas restantes para auto-aprovacao (72 horas apos ultima entrega)
                let hoursLeft = 0;
                if (asPendingEval) {
                   const lastEntrega = proj.entregas.sort((a:any, b:any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
                   const limit = new Date(lastEntrega.created_at);
                   limit.setHours(limit.getHours() + 72);
                   hoursLeft = differenceInHours(limit, new Date());
                }

                return (
                  <Card key={proj.id} className="border-slate-200 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: 'var(--cliente-accent)' }}></div>
                    <CardContent className="p-5 pl-6 flex flex-col h-full">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="font-bold text-slate-900 text-lg">{proj.nome}</h4>
                        <Badge variant="outline" className={cn("text-[10px] uppercase font-bold", 
                            proj.status === 'entregue' ? 'bg-amber-100 text-amber-800 border-transparent' : 
                            proj.status === 'aprovado' ? 'bg-green-100 text-green-700 border-transparent' : 'bg-slate-50'
                        )}>{proj.status === 'entregue' ? 'Aguardando sua avaliação' : proj.status.replace('_', ' ')}</Badge>
                      </div>
                      
                      {proj.status === 'aprovado' && proj.avaliacao && (
                         <div className="mb-4 bg-slate-50 border border-slate-100 p-3 rounded-lg flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500">Projeto Concluído e Avaliado</span>
                            <div className="flex gap-1">
                               {[1,2,3,4,5].map(s => <Star key={s} className={cn("w-3.5 h-3.5", s <= proj.avaliacao.nota ? "text-yellow-400 fill-current" : "text-slate-300")} />)}
                            </div>
                         </div>
                      )}

                      <div className="flex-1"></div>

                      {asPendingEval ? (
                        <div className="mt-4 bg-amber-50 border border-amber-200 p-4 rounded-xl flex flex-col items-center text-center">
                           <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 mb-2">
                             <FileUp className="w-5 h-5" />
                           </div>
                           <p className="text-sm font-bold text-amber-900">Entrega Final Disponível!</p>
                           <p className="text-xs text-amber-700 mt-1 mb-3">
                              Avalie o projeto para liberar o download oficial.<br/>Aprovação automática em <strong>{Math.max(hoursLeft, 0)}h</strong>.
                           </p>
                           <Button className="w-full bg-amber-500 hover:bg-amber-600 font-bold" onClick={() => {
                              setSelectedProjetoData(proj);
                              setEvalForm({ nota: 0, feedback: '' });
                              setModalEvalOpen(true);
                           }}>Visualizar & Avaliar</Button>
                        </div>
                      ) : (
                        <div className="space-y-2 mt-4">
                          <div className="flex justify-between text-xs font-medium">
                            <span className="text-slate-500">Progresso de Etapas ({done}/{total})</span>
                            <span className="text-slate-900">{Math.round(perc)}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div className="h-2 rounded-full bg-slate-800 transition-all" style={{ width: `${perc}%`, backgroundColor: 'var(--cliente-accent)' }}></div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )
      )}

      {/* Entregas Tab (Tarefas Avulsas) */}
      <div className="mt-12">
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <div className="flex items-center justify-between mb-4 border-b border-slate-200">
            <TabsList className="bg-transparent h-auto p-0 gap-6">
              <TabsTrigger value="todas" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[color:var(--cliente-accent)] rounded-none px-0 py-3 text-sm font-medium">Todas Demandas</TabsTrigger>
              <TabsTrigger value="aguardando" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[color:var(--cliente-accent)] rounded-none px-0 py-3 text-sm font-medium flex items-center gap-2">
                Aguardando Aprovação {aguardandoAprovacao.length > 0 && <span className="bg-red-500 text-white w-4 h-4 rounded-full flex items-center justify-center text-[10px]">{aguardandoAprovacao.length}</span>}
              </TabsTrigger>
              <TabsTrigger value="andamento" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[color:var(--cliente-accent)] rounded-none px-0 py-3 text-sm font-medium">Processando</TabsTrigger>
              <TabsTrigger value="concluidas" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[color:var(--cliente-accent)] rounded-none px-0 py-3 text-sm font-medium">Itens Concluídos</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value={selectedTab} className="mt-6 focus-visible:outline-none">
            {filteredTarefas.length === 0 ? (
              <div className="text-center p-12 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                <CheckCircle className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                <h3 className="font-semibold text-slate-700">Nenhuma demanda em andamento.</h3>
                <p className="text-slate-500 text-sm mt-1">Envie uma solicitação pelo Slack ou Painel para iniciarmos.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTarefas.map(renderTaskCard)}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* MODAL AVALIAÇÃO PROJETO */}
      <Dialog open={modalEvalOpen} onOpenChange={setModalEvalOpen}>
         <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden">
            <div className="bg-slate-900 border-b border-slate-800 p-6">
               <DialogTitle className="text-white text-xl flex items-center gap-2">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" /> Entrega: {selectedProjetoData?.nome}
               </DialogTitle>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh] bg-slate-50">
               <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3">Links Disponibilizados pela Arke</h4>
               <div className="space-y-3 mb-8">
                  {selectedProjetoData?.entregas?.map((ent: any) => (
                     <a key={ent.id} href={ent.url} target="_blank" rel="noreferrer" className="block bg-white border border-slate-200 p-4 rounded-lg hover:border-blue-400 hover:shadow-md transition-all group">
                        <div className="flex justify-between items-start">
                           <div className="flex items-center gap-3">
                              <ExternalLink className="w-5 h-5 text-blue-500" />
                              <div>
                                 <h5 className="font-bold text-slate-800 group-hover:text-blue-600">{ent.titulo}</h5>
                                 <p className="text-xs text-slate-500 mt-0.5 max-w-sm truncate">{ent.url}</p>
                              </div>
                           </div>
                           <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-transparent">Visualizar Arquivo</Badge>
                        </div>
                     </a>
                  ))}
               </div>

               <div className="bg-white border text-center border-slate-200 p-6 rounded-xl shadow-sm">
                  <h4 className="text-lg font-bold text-slate-900">Como você avalia esta entrega?</h4>
                  <p className="text-sm text-slate-500 mt-1">Sua avaliação aprova o projeto e ajuda nosso time a evoluir.</p>
                  
                  <div className="flex justify-center gap-2 mt-6 mb-6">
                     {[1,2,3,4,5].map(star => (
                        <button key={star} type="button" onClick={() => setEvalForm({...evalForm, nota: star})} className="group transition-transform active:scale-90">
                           <Star className={cn("w-10 h-10 transition-colors", star <= evalForm.nota ? "text-yellow-400 fill-current" : "text-slate-200 group-hover:text-yellow-200")} />
                        </button>
                     ))}
                  </div>

                  {evalForm.nota > 0 && (
                     <div className="animate-in fade-in slide-in-from-bottom-2">
                        <Textarea 
                           placeholder="Deixe um comentário curto (opcional) sobre o trabalho entregue..." 
                           value={evalForm.feedback} 
                           onChange={e => setEvalForm({...evalForm, feedback: e.target.value})}
                           className="min-h-[80px] bg-slate-50"
                        />
                     </div>
                  )}
               </div>
            </div>

            <DialogFooter className="p-4 bg-white border-t border-slate-200">
               <Button variant="ghost" onClick={() => setModalEvalOpen(false)}>Avaliar Depois</Button>
               <Button onClick={handleAvaliarProjeto} className="bg-blue-600 hover:bg-blue-700" disabled={evalForm.nota === 0 || isSubmitting}>
                  {isSubmitting ? 'Salvando...' : 'Confirmar Aprovação'}
               </Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
    </div>
  );
}
