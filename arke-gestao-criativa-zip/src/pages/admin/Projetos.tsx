import React, { useState, useEffect } from 'react';
import { useArkeStore } from '@/lib/store';
import { Card, CardContent } from '@/components/ui/card';
import { Layers, Plus, Calendar, FilterX, Activity, ArrowRight, X, Link as LinkIcon, HardDrive, FileUp, Star } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CreateTaskModal } from '@/components/tarefas/CreateTaskModal';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { createEntregaProjeto, fetchEntregasProjeto, updateProjeto, getAvaliacaoProjeto } from '@/lib/supabase/queries';

export default function AdminProjetos() {
  const { projetos, clientes, tarefas, adicionarProjeto, timeMembers, carregarDadosIniciais } = useArkeStore();
  const { role } = useAuth();
  
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProjetoId, setSelectedProjetoId] = useState<string | null>(null);
  
  // Custom Filters
  const [selTipo, setSelTipo] = useState<string>('');
  const [selStatus, setSelStatus] = useState<string>('');
  const [selCliente, setSelCliente] = useState<string>('');

  // Form State
  const [nome, setNome] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [tipo, setTipo] = useState('build');
  const [descricao, setDescricao] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataPrazo, setDataPrazo] = useState('');

  // Entrega State
  const [entregas, setEntregas] = useState<any[]>([]);
  const [avaliacao, setAvaliacao] = useState<any>(null);
  const [showEntregaForm, setShowEntregaForm] = useState(false);
  const [entregaForm, setEntregaForm] = useState({
     titulo: '', descricao: '', tipo_entrega: 'link' as 'link'|'drive'|'arquivo_hospedado', url: ''
  });
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
     if (selectedProjetoId) {
        fetchEntregasProjeto(selectedProjetoId).then(setEntregas).catch(console.error);
        getAvaliacaoProjeto(selectedProjetoId).then(setAvaliacao).catch(console.error);
        setShowEntregaForm(false);
     } else {
        setEntregas([]);
        setAvaliacao(null);
     }
  }, [selectedProjetoId]);

  const clientesProjeto = clientes.filter(c => ['build', 'craft', 'avulso'].includes(c.tipo));
  const projetosAtivos = projetos.filter(p => p.status !== 'cancelado');
  const projetosFiltrados = projetosAtivos.filter(p => {
    if (selTipo && p.tipo !== selTipo) return false;
    if (selStatus && p.status !== selStatus) return false;
    if (selCliente && p.cliente_id !== selCliente) return false;
    return true;
  });

  const getProgress = (projId: string) => {
    const projTarefas = tarefas.filter(t => t.projeto_id === projId && t.status !== 'arquivado');
    if (projTarefas.length === 0) return { total: 0, concluido: 0, pct: 0 };
    const concluidas = projTarefas.filter(t => ['entregue', 'aprovado'].includes(t.status)).length;
    return {
      total: projTarefas.length,
      concluido: concluidas,
      pct: Math.round((concluidas / projTarefas.length) * 100)
    };
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !clienteId || !tipo || role === 'time') return;
    
    await adicionarProjeto({
      nome, cliente_id: clienteId, tipo, status: 'briefing', descricao, data_inicio: dataInicio, data_prazo: dataPrazo
    });
    
    setNome(''); setClienteId(''); setTipo('build'); setDescricao(''); setDataInicio(''); setDataPrazo('');
    setModalOpen(false);
  };

  const handlePublishEntrega = async () => {
    if (!selectedProjetoId || !entregaForm.titulo || !entregaForm.url) return;
    setIsPublishing(true);
    try {
       const selectedProjeto = projetos.find(p => p.id === selectedProjetoId);
       const availDate = new Date();
       availDate.setDate(availDate.getDate() + 90); // 90 dias

       const obj = {
          projeto_id: selectedProjetoId,
          cliente_id: selectedProjeto?.cliente_id,
          titulo: entregaForm.titulo,
          descricao: entregaForm.descricao || null,
          tipo_entrega: entregaForm.tipo_entrega,
          url: entregaForm.url,
          disponivel_ate: availDate.toISOString()
       };

       await createEntregaProjeto(obj);
       await updateProjeto(selectedProjetoId, { status: 'entregue' });
       
       toast.success('Entrega publicada com sucesso! O cliente já pode acessar no painel dele.');
       
       const ents = await fetchEntregasProjeto(selectedProjetoId);
       setEntregas(ents);
       carregarDadosIniciais(); // Refresh projects list to update status
       setShowEntregaForm(false);
    } catch (e: any) {
       toast.error('Erro ao publicar entrega: ' + e.message);
    } finally {
       setIsPublishing(false);
    }
  };

  const selectedProjeto = projetos.find(p => p.id === selectedProjetoId);
  const selectedProjetoTarefas = tarefas.filter(t => t.projeto_id === selectedProjetoId && t.status !== 'arquivado');
  const allTasksFinished = selectedProjetoTarefas.length > 0 && selectedProjetoTarefas.every(t => ['entregue', 'aprovado'].includes(t.status));

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6">
      {role !== 'time' && (
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="sm:max-w-[500px]">
             <DialogHeader><DialogTitle>Novo Projeto</DialogTitle></DialogHeader>
             <form onSubmit={handleCreate} className="space-y-4">
                 {/* Manter mesmos campos do novo projeto */}
               <div>
                 <label className="text-sm font-medium text-slate-700 block mb-1">Cliente *</label>
                 <select required value={clienteId} onChange={e => setClienteId(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                   <option value="" disabled>Selecione um cliente (Build, Craft, Avulso)</option>
                   {clientesProjeto.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                 </select>
               </div>
               <div>
                 <label className="text-sm font-medium text-slate-700 block mb-1">Nome do Projeto *</label>
                 <Input autoFocus required value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Landing Page Tech" />
               </div>
               <div>
                 <label className="text-sm font-medium text-slate-700 block mb-1">Tipo de Projeto *</label>
                 <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-sm"><input type="radio" value="build" checked={tipo === 'build'} onChange={e => setTipo(e.target.value)} /> Build</label>
                    <label className="flex items-center gap-2 text-sm"><input type="radio" value="craft" checked={tipo === 'craft'} onChange={e => setTipo(e.target.value)} /> Craft</label>
                    <label className="flex items-center gap-2 text-sm"><input type="radio" value="avulso" checked={tipo === 'avulso'} onChange={e => setTipo(e.target.value)} /> Avulso</label>
                 </div>
               </div>
               <div>
                 <label className="text-sm font-medium text-slate-700 block mb-1">Descrição</label>
                 <Textarea value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Escopo macro do projeto..." className="resize-y min-h-[80px]" />
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="text-sm font-medium text-slate-700 block mb-1">Data de Início</label>
                   <Input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
                 </div>
                 <div>
                   <label className="text-sm font-medium text-slate-700 block mb-1">Data Prazo</label>
                   <Input type="date" value={dataPrazo} onChange={e => setDataPrazo(e.target.value)} />
                 </div>
               </div>
               <DialogFooter>
                 <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 border rounded-md">Cancelar</button>
                 <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md">Salvar</button>
               </DialogFooter>
             </form>
          </DialogContent>
        </Dialog>
      )}
      
      {/* LEFT LIST PANEL */}
      <div className={cn("flex flex-col flex-1", selectedProjetoId ? "hidden lg:flex lg:w-1/2 flex-none" : "")}>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Projetos</h1>
            <p className="text-sm text-slate-500">Gestão de escopos fechados.</p>
          </div>
          {role !== 'time' && (
            <button onClick={() => setModalOpen(true)} className="bg-[#2563EB] hover:bg-blue-700 text-white flex items-center font-medium px-4 py-2 text-sm rounded-md transition-colors active:scale-95 shadow-sm">
              <Plus className="w-4 h-4 mr-2" /> Novo Projeto
            </button>
          )}
        </div>

        {/* FILTERS */}
        <div className="flex gap-4 mb-4 flex-wrap bg-slate-50 border border-slate-200 p-3 rounded-lg items-center">
          <select value={selTipo} onChange={e => setSelTipo(e.target.value)} className="border border-slate-200 bg-white rounded p-1.5 text-sm outline-none px-2 text-slate-700 font-medium">
            <option value="">Todos os Tipos</option>
            <option value="build">Build</option>
            <option value="craft">Craft</option>
            <option value="avulso">Avulso</option>
          </select>
          <select value={selStatus} onChange={e => setSelStatus(e.target.value)} className="border border-slate-200 bg-white rounded p-1.5 text-sm outline-none px-2 text-slate-700 font-medium">
            <option value="">Todos os Status</option>
            <option value="briefing">Briefing</option>
            <option value="em_andamento">Em andamento</option>
            <option value="entregue">Entregue</option>
            <option value="aprovado">Aprovado</option>
          </select>
          <select value={selCliente} onChange={e => setSelCliente(e.target.value)} className="border border-slate-200 bg-white rounded p-1.5 text-sm outline-none px-2 text-slate-700 font-medium max-w-[200px] truncate">
            <option value="">Todos os Clientes</option>
            {clientesProjeto.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
          {(selTipo || selStatus || selCliente) && (
            <Button variant="ghost" size="sm" onClick={() => { setSelTipo(''); setSelStatus(''); setSelCliente(''); }} className="text-slate-500 hover:text-red-500 font-medium h-8">
              <FilterX className="w-4 h-4 mr-2" /> Limpar
            </Button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto pb-4 custom-scrollbar">
          {projetosFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center border-dashed border-2 border-slate-200 rounded-xl bg-slate-50">
              <Layers className="w-8 h-8 text-slate-400 mb-2" />
              <h2 className="text-lg font-bold text-slate-700">Nenhum projeto encontrado</h2>
              <p className="text-sm text-slate-500 max-w-sm mt-1">Crie um novo projeto para gerenciar demandas de escopo definido.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
              {projetosFiltrados.map(proj => {
                const cliente = proj.cliente || clientes.find(c => c.id === proj.cliente_id);
                const isLate = proj.data_prazo && isPast(new Date(proj.data_prazo)) && !['entregue', 'aprovado'].includes(proj.status);
                const progress = getProgress(proj.id);
                const isSelected = selectedProjetoId === proj.id;

                return (
                  <Card key={proj.id} onClick={() => setSelectedProjetoId(proj.id)} className={cn(
                    "shadow-sm transition-all cursor-pointer relative overflow-hidden group",
                    isSelected ? "ring-2 ring-blue-500 border-transparent shadow-md" : "border-slate-200 hover:border-blue-300 hover:shadow-md"
                  )}>
                    {cliente?.cor_tema && (
                      <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: cliente.cor_tema }}></div>
                    )}
                    <CardContent className="p-5 pl-6">
                      <div className="flex justify-between items-start mb-3">
                        <Badge variant="outline" className="text-[10px] bg-slate-50 capitalize font-semibold tracking-wide text-slate-600 border-slate-200">
                          {proj.tipo}
                        </Badge>
                        <Badge className={cn("text-[10px] font-medium capitalize", ['entregue', 'aprovado'].includes(proj.status) ? 'bg-green-100 text-green-700 hover:bg-green-100' : 'bg-blue-50 text-blue-700 hover:bg-blue-50')}>
                          {proj.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <h3 className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors line-clamp-1">{proj.nome}</h3>
                      <p className="text-sm font-medium text-slate-500 mt-1 line-clamp-1">{cliente?.nome}</p>

                      <div className="flex items-center gap-4 mt-4">
                        <div className="flex-1">
                          <div className="flex justify-between text-[10px] uppercase font-bold text-slate-500 mb-1">
                            <span>Progresso</span>
                            <span>{progress.pct}%</span>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-blue-500 h-full rounded-full transition-all duration-500" style={{ width: `${progress.pct}%` }}></div>
                          </div>
                        </div>
                        {proj.data_prazo && (
                           <div className="flex items-center gap-1.5 text-xs font-semibold">
                             <Calendar className={cn("w-3.5 h-3.5", isLate ? "text-red-500" : "text-slate-400")} />
                             <span className={isLate ? "text-red-600" : "text-slate-600"}>{format(new Date(proj.data_prazo), 'dd/MM/yy')}</span>
                           </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT DETALHE PANEL */}
      {selectedProjeto && (
        <div className="flex-1 max-w-2xl bg-white border border-slate-200 shadow-xl rounded-xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-right-8 duration-300 relative pb-4">
          <div className="p-6 border-b border-slate-200 bg-slate-50 shrink-0 relative">
            <button onClick={() => setSelectedProjetoId(null)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 mb-2">
               <Badge variant="outline" className="text-[10px] bg-white capitalize font-semibold tracking-wide text-slate-600">
                  {selectedProjeto.tipo}
               </Badge>
               <span className="text-xs font-semibold text-slate-400">&bull;</span>
               <span className="text-sm font-medium text-slate-600">{clientes.find(c => c.id === selectedProjeto.cliente_id)?.nome}</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">{selectedProjeto.nome}</h2>
            
            <div className="flex gap-6 max-w-sm">
               <div className="flex-1">
                  <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Início</p>
                  <p className="text-sm font-semibold text-slate-900">{selectedProjeto.data_inicio ? format(new Date(selectedProjeto.data_inicio), "dd MMM, yyyy", { locale: ptBR }) : '—'}</p>
               </div>
               <div className="flex-1">
                  <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Prazo Final</p>
                  <p className={cn("text-sm font-semibold", selectedProjeto.data_prazo && isPast(new Date(selectedProjeto.data_prazo)) ? 'text-red-600' : 'text-slate-900')}>
                     {selectedProjeto.data_prazo ? format(new Date(selectedProjeto.data_prazo), "dd MMM, yyyy", { locale: ptBR }) : '—'}
                  </p>
               </div>
            </div>

            {selectedProjeto.descricao && (
               <p className="mt-4 text-sm text-slate-600 bg-white p-3 rounded-lg border border-slate-200 leading-relaxed font-medium">
                  {selectedProjeto.descricao}
               </p>
            )}

            {/* PIPELINE VISUAL */}
            <div className="mt-6 flex flex-col gap-1.5">
               <p className="text-[10px] uppercase font-bold text-slate-500 mb-1 tracking-wider">Etapa do Projeto</p>
               <div className="flex justify-between relative bg-slate-200 h-2 rounded-full overflow-visible items-center w-full max-w-[80%]">
                 <div className="absolute left-0 h-2 bg-blue-500 rounded-full transition-all" style={{ width: selectedProjeto.status === 'briefing' ? '10%' : selectedProjeto.status === 'em_andamento' ? '50%' : '100%' }}></div>
                 <div className={cn("w-4 h-4 rounded-full border-2 border-white z-10", selectedProjeto.status === 'briefing' || selectedProjeto.status === 'em_andamento' || selectedProjeto.status === 'entregue' || selectedProjeto.status === 'aprovado' ? 'bg-blue-500' : 'bg-slate-300')} title="Briefing" style={{ transform: 'translateX(-50%)' }}></div>
                 <div className={cn("w-4 h-4 rounded-full border-2 border-white z-10 absolute left-1/2", selectedProjeto.status === 'em_andamento' || selectedProjeto.status === 'entregue' || selectedProjeto.status === 'aprovado' ? 'bg-blue-500' : 'bg-slate-300')} title="Em Andamento" style={{ transform: 'translateX(-50%)' }}></div>
                 <div className={cn("w-4 h-4 rounded-full border-2 border-white z-10 absolute left-full", selectedProjeto.status === 'entregue' || selectedProjeto.status === 'aprovado' ? 'bg-blue-500' : 'bg-slate-300')} title="Concluído/Entregue" style={{ transform: 'translateX(-50%)' }}></div>
               </div>
               <div className="flex justify-between w-full max-w-[80%] text-[10px] font-bold text-slate-400 mt-1 uppercase w-full relative">
                 <span className="-ml-1" style={{ width: '33%' }}>Briefing</span>
                 <span className="text-center absolute left-1/2" style={{ transform: 'translateX(-50%)' }}>Em And.</span>
                 <span className="text-right absolute right-0" style={{ transform: 'translateX(50%)' }}>Concluído</span>
               </div>
            </div>
          </div>

          <div className="p-6 flex-1 overflow-y-auto flex flex-col bg-white custom-scrollbar">
             
             {/* AVALIAÇÃO SE HOUVER */}
             {avaliacao && (
               <div className="mb-6 bg-slate-900 border border-slate-800 rounded-xl p-5 text-white flex items-center justify-between">
                  <div>
                     <p className="text-sm font-semibold text-slate-300 mb-1">Avaliação do Cliente</p>
                     <div className="flex gap-1.5">
                        {[1, 2, 3, 4, 5].map(star => (
                           <Star key={star} className={cn("w-5 h-5", star <= avaliacao.nota ? "text-yellow-400 fill-current" : "text-slate-600")} />
                        ))}
                     </div>
                  </div>
                  <Badge className="bg-white/10 hover:bg-white/10 text-white border-0">Nota {avaliacao.nota}/5</Badge>
               </div>
             )}

             {/* ENTREGAS */}
             {entregas.length > 0 && (
               <div className="mb-8">
                  <h3 className="font-bold tracking-tight text-slate-900 border-b border-slate-200 pb-2 mb-4">Entregas Publicadas</h3>
                  <div className="space-y-3">
                     {entregas.map(ent => (
                        <div key={ent.id} className="border border-green-200 bg-green-50/50 rounded-lg p-4 flex gap-4 items-start">
                           <div className="bg-white border border-green-200 p-2 rounded-lg text-green-600 shrink-0">
                              <FileUp className="w-5 h-5" />
                           </div>
                           <div className="flex-1">
                              <h4 className="font-bold text-slate-900">{ent.titulo}</h4>
                              {ent.descricao && <p className="text-sm text-slate-600 mt-1">{ent.descricao}</p>}
                              <a href={ent.url} target="_blank" rel="noreferrer" className="text-sm font-semibold text-blue-600 hover:underline mt-2 inline-flex items-center gap-1">
                                 Acessar material original <ArrowRight className="w-3.5 h-3.5" />
                              </a>
                           </div>
                           <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">Visível ao cliente</Badge>
                        </div>
                     ))}
                  </div>
               </div>
             )}

             {/* ENTREGA FINAL UI */}
             {allTasksFinished && !showEntregaForm && selectedProjeto.status !== 'aprovado' && (
                <div className="mb-8 bg-blue-50 border border-blue-200 rounded-xl p-5 flex flex-col items-center text-center">
                   <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-blue-600 shadow-sm mb-3">
                      <Layers className="w-6 h-6" />
                   </div>
                   <h3 className="font-bold text-slate-900">Todas as tarefas finalizadas!</h3>
                   <p className="text-sm text-slate-600 mt-1 max-w-sm">Pronto para entregar o material consolidado para o cliente aprovar?</p>
                   <Button onClick={() => setShowEntregaForm(true)} className="mt-4 bg-blue-600 hover:bg-blue-700">Publicar Entrega Final</Button>
                </div>
             )}

             {/* ENTREGA FORM */}
             {showEntregaForm && (
                <div className="mb-8 border border-slate-200 rounded-xl overflow-hidden shadow-sm animate-in zoom-in-95 duration-200">
                   <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 text-sm">Publicar Entrega</h4>
                      <Button variant="ghost" size="sm" onClick={() => setShowEntregaForm(false)} className="h-6 px-2 text-slate-500 hover:text-slate-800"><X className="w-4 h-4" /></Button>
                   </div>
                   <div className="p-4 space-y-4 bg-white">
                      <div>
                         <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Formato da entrega</label>
                         <div className="flex gap-2">
                            <label className={cn("border rounded-md px-3 py-2 flex items-center gap-2 text-sm cursor-pointer hover:bg-slate-50", entregaForm.tipo_entrega === 'link' ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-700")}>
                               <input type="radio" className="hidden" checked={entregaForm.tipo_entrega === 'link'} onChange={() => setEntregaForm({...entregaForm, tipo_entrega: 'link'})} />
                               <LinkIcon className="w-4 h-4" /> Link Externo
                            </label>
                            <label className={cn("border rounded-md px-3 py-2 flex items-center gap-2 text-sm cursor-pointer hover:bg-slate-50", entregaForm.tipo_entrega === 'drive' ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-700")}>
                               <input type="radio" className="hidden" checked={entregaForm.tipo_entrega === 'drive'} onChange={() => setEntregaForm({...entregaForm, tipo_entrega: 'drive'})} />
                               <HardDrive className="w-4 h-4" /> Google Drive
                            </label>
                         </div>
                      </div>
                      <div>
                         <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Título da Entrega *</label>
                         <Input value={entregaForm.titulo} onChange={e => setEntregaForm({...entregaForm, titulo: e.target.value})} placeholder="Ex: Identidade Visual Completa" />
                      </div>
                      <div>
                         <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">URL (Link) *</label>
                         <Input value={entregaForm.url} onChange={e => setEntregaForm({...entregaForm, url: e.target.value})} placeholder="https://..." type="url" />
                      </div>
                      <div>
                         <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Mensagem (Opcional)</label>
                         <Textarea value={entregaForm.descricao} onChange={e => setEntregaForm({...entregaForm, descricao: e.target.value})} placeholder="Detalhes para o cliente..." className="resize-none min-h-[60px]" />
                      </div>
                      <Button onClick={handlePublishEntrega} className="w-full bg-blue-600 hover:bg-blue-700" disabled={!entregaForm.titulo || !entregaForm.url || isPublishing}>
                         {isPublishing ? 'Publicando...' : 'Publicar para o Cliente'}
                      </Button>
                   </div>
                </div>
             )}


            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold tracking-tight text-slate-900 border-b border-slate-200 pb-2 flex-grow mr-4">Tarefas de Execução</h3>
              {role !== 'time' && (
                <Button onClick={() => setIsTaskModalOpen(true)} size="sm" variant="outline" className="border-dashed border-2 text-slate-600 hover:text-blue-600 hover:border-blue-600 hover:bg-blue-50 h-8 font-semibold">
                  <Plus className="w-3.5 h-3.5 mr-1.5" /> Nova Atividade
                </Button>
              )}
            </div>

            {selectedProjetoTarefas.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-50/50 rounded-xl border border-slate-100">
                <Activity className="w-8 h-8 text-slate-300 mb-2" />
                <p className="text-sm font-semibold text-slate-600">O projeto ainda não tem tarefas ativas.</p>
                <p className="text-xs text-slate-400 mt-1">Crie escopos menores para organizar a produção.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {selectedProjetoTarefas.map(tTarefa => {
                  const resp = timeMembers.find(m => m.id === tTarefa.responsavel_id);
                  return (
                    <div key={tTarefa.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors bg-white hover:shadow-sm">
                      <div className="flex items-center gap-3">
                         <div className={cn("w-1.5 h-6 rounded-full", ['entregue', 'aprovado'].includes(tTarefa.status) ? 'bg-green-500' : 'bg-slate-200')}></div>
                         <div>
                           <p className="text-sm font-semibold text-slate-900">{tTarefa.titulo}</p>
                           <div className="flex items-center gap-2 mt-0.5">
                             <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{tTarefa.status.replace('_', ' ')}</span>
                           </div>
                         </div>
                      </div>
                      {resp && (
                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600" title={resp.nome}>
                          {resp.nome.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {selectedProjetoId && role !== 'time' && (
        <CreateTaskModal 
           open={isTaskModalOpen} 
           onOpenChange={setIsTaskModalOpen} 
           origem="arke" 
           defaultProjetoId={selectedProjetoId}
        />
      )}
    </div>
  );
}

