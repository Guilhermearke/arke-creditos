import React, { useState, useMemo } from 'react';
import { useArkeStore, Tarefa } from '@/lib/store';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { X, Plus, Trash2 } from 'lucide-react';
import * as queries from '@/lib/supabase/queries';
import { toast } from 'sonner';

interface CreateTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clienteIdPadrao?: string;
  defaultProjetoId?: string;
  origem: 'arke' | 'painel_cliente';
}

export function CreateTaskModal({ open, onOpenChange, clienteIdPadrao, defaultProjetoId, origem }: CreateTaskModalProps) {
  const { clientes, projetos, timeMembers, servicos, templates, adicionarTarefa, adicionarSubtarefa, tarefas } = useArkeStore();

  const [templateId, setTemplateId] = useState('nenhum');
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [subtarefas, setSubtarefas] = useState<{ id: string, titulo: string }[]>([]);
  const [novaSubtarefa, setNovaSubtarefa] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [clienteId, setClienteId] = useState(clienteIdPadrao || '');
  const [projetoId, setProjetoId] = useState(defaultProjetoId || '');
  const [servicoId, setServicoId] = useState('');
  
  const [creditos, setCreditos] = useState(0);
  const [eRevisao, setERevisao] = useState(false);
  const [numeroRevisao, setNumeroRevisao] = useState(1);
  const [tarefaOriginalId, setTarefaOriginalId] = useState('');
  const [creditosRevisaoCobrados, setCreditosRevisaoCobrados] = useState(0);
  
  const [responsavelId, setResponsavelId] = useState('');
  const [prioridade, setPrioridade] = useState<'baixa' | 'normal' | 'alta' | 'urgente'>('normal');
  const [dataVencimento, setDataVencimento] = useState('');
  
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const cliente = clientes.find(c => c.id === clienteId);
  const isKeep = cliente?.tipo === 'keep';
  const isProjetoClient = cliente && ['build', 'craft', 'avulso'].includes(cliente.tipo);
  
  const clienteProjetos = projetos.filter(p => p.cliente_id === clienteId && p.status !== 'cancelado' && p.status !== 'concluido');
  const servicoSelecionado = servicos.find(s => s.id === servicoId);

  // Load template
  const handleTemplateChange = (val: string) => {
    setTemplateId(val);
    if (val === 'nenhum') return;
    const t = templates.find(x => x.id === val);
    if (t) {
      if (!titulo) setTitulo(t.nome);
      
      const srv = servicos.find(s => s.nome === t.categoria);
      if (srv) {
        setServicoId(srv.id);
      }
      setCreditos(t.creditos_padrao);
      setSubtarefas(t.subtarefas_padrao.map((st, i) => ({ id: `temp-${i}`, titulo: st })));
    }
  };

  const addTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (tagInput.trim() && !tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
        setTagInput('');
      }
    }
  };
  
  const addSubtarefa = (e: React.KeyboardEvent | React.MouseEvent) => {
    if (('key' in e && e.key === 'Enter') || e.type === 'click') {
      e.preventDefault();
      if (novaSubtarefa.trim()) {
        setSubtarefas([...subtarefas, { id: `new-${Date.now()}`, titulo: novaSubtarefa.trim() }]);
        setNovaSubtarefa('');
      }
    }
  };

  const removeSubtarefa = (id: string) => {
    setSubtarefas(subtarefas.filter(s => s.id !== id));
  };

  const handleServicoChange = (val: string) => {
    setServicoId(val);
    const srv = servicos.find(s => s.id === val);
    if (srv) setCreditos(srv.creditos_padrao);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteId || !titulo || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const nova: Partial<Tarefa> = {
        cliente_id: clienteId,
        projeto_id: (isProjetoClient && projetoId && projetoId !== 'nenhum') ? projetoId : undefined,
        titulo,
        descricao,
        status: origem === 'painel_cliente' ? 'triagem' : 'backlog',
        prioridade,
        origem,
        creditos_cobrados: isKeep ? creditos : undefined,
        data_vencimento: dataVencimento || undefined,
        responsavel_id: responsavelId && responsavelId !== 'nenhum' ? responsavelId : undefined,
        tags,
        servico: servicoSelecionado?.nome,
        e_revisao: isKeep ? eRevisao : undefined,
        numero_revisao: isKeep && eRevisao ? numeroRevisao : undefined
      };

      const criada = await adicionarTarefa(nova);
      
      if (criada && subtarefas.length > 0) {
        for (let i = 0; i < subtarefas.length; i++) {
          await adicionarSubtarefa(criada.id, subtarefas[i].titulo, i);
        }
      }

      toast.success('Tarefa criada', { duration: 4000 });
      onOpenChange(false);
      resetForm();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao salvar. Tente novamente.', {
        duration: 4000,
        action: { label: 'Tentar novamente', onClick: () => handleCreate(e) }
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setTemplateId('nenhum');
    setTitulo('');
    setDescricao('');
    setSubtarefas([]);
    setServicoId('');
    setCreditos(0);
    setERevisao(false);
    setNumeroRevisao(1);
    setResponsavelId('');
    setPrioridade('normal');
    setDataVencimento('');
    setTags([]);
    setTagInput('');
    setProjetoId(defaultProjetoId || '');
  };

  const categoriasServicos = useMemo(() => {
    const cats: Record<string, typeof servicos> = {};
    servicos.forEach(s => {
      if (!cats[s.categoria]) cats[s.categoria] = [];
      cats[s.categoria].push(s);
    });
    return cats;
  }, [servicos]);

  const saldoApos = (cliente?.creditos_restantes || 0) - creditos;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl w-[95vw] bg-white p-0 gap-0 overflow-hidden flex flex-col h-[90vh] md:h-auto md:max-h-[85vh]">
        <DialogHeader className="p-6 border-b border-slate-200 bg-slate-50 shrink-0">
          <DialogTitle className="text-xl">{origem === 'painel_cliente' ? 'Nova Solicitação' : 'Criar Nova Tarefa'}</DialogTitle>
        </DialogHeader>

        <form id="create-task-form" onSubmit={handleCreate} className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* COLUNA ESQUERDA - 2/3 */}
          <div className="flex-[2] p-6 border-r border-slate-200 overflow-y-auto custom-scrollbar flex flex-col gap-6">
            
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Usar Template?</label>
              <Select value={templateId} onValueChange={handleTemplateChange}>
                <SelectTrigger className="w-full bg-slate-50">
                  <SelectValue placeholder="Selecione um template..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nenhum">Nenhum (Começar do zero)</SelectItem>
                  {templates.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Título da Tarefa <span className="text-red-500">*</span></label>
              <Input 
                autoFocus
                required
                value={titulo}
                onChange={e => setTitulo(e.target.value)}
                placeholder="Ex: Landing Page Tech, Criativo Black Friday..."
                className="text-lg font-medium py-6"
              />
            </div>

            <div className="space-y-1.5 flex-1 flex flex-col">
              <label className="text-sm font-semibold text-slate-700">Descrição / Briefing</label>
              <Textarea 
                value={descricao}
                onChange={e => setDescricao(e.target.value)}
                placeholder="Detalhe o escopo, referências, links importantes..."
                className="resize-none flex-1 min-h-[160px]"
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-700 flex items-center justify-between">
                Subtarefas pré-definidas
                <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{subtarefas.length}</span>
              </label>
              <div className="flex items-center gap-2">
                <Input 
                  value={novaSubtarefa}
                  onChange={e => setNovaSubtarefa(e.target.value)}
                  onKeyDown={addSubtarefa}
                  placeholder="Adicionar subtarefa e pressionar Enter..."
                  className="text-sm bg-slate-50" 
                />
                <Button type="button" variant="secondary" onClick={addSubtarefa} className="shrink-0"><Plus className="w-4 h-4 mr-2" />Add</Button>
              </div>
              <div className="space-y-2 mt-2">
                {subtarefas.map(s => (
                  <div key={s.id} className="flex items-center justify-between p-2 border border-slate-200 rounded-md bg-white hover:border-slate-300 group">
                    <span className="text-sm text-slate-700 font-medium">{s.titulo}</span>
                    <button type="button" onClick={() => removeSubtarefa(s.id)} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* COLUNA DIREITA - 1/3 */}
          <div className="flex-1 bg-slate-50 p-6 overflow-y-auto custom-scrollbar flex flex-col gap-5 border-t md:border-t-0 border-slate-200">
            
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Cliente <span className="text-red-500">*</span></label>
              <Select value={clienteId} onValueChange={(val) => { setClienteId(val); setProjetoId(''); }} required>
                <SelectTrigger className="w-full bg-white">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {cliente && (
                <div className="mt-1">
                  <Badge variant="outline" className="text-[10px] bg-white capitalize text-slate-600 border-slate-200">{cliente.tipo}</Badge>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Serviço</label>
              <Select value={servicoId} onValueChange={handleServicoChange}>
                <SelectTrigger className="w-full bg-white">
                  <SelectValue placeholder="Selecione o serviço..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(categoriasServicos).map(cat => (
                    <SelectGroup key={cat}>
                      <SelectLabel className="bg-slate-100">{cat}</SelectLabel>
                      {categoriasServicos[cat].map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isKeep && (
              <div className="p-4 bg-white border border-slate-200 rounded-lg space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1 space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 uppercase">Créditos</label>
                    <Input type="number" value={creditos} onChange={e => setCreditos(Number(e.target.value))} className="text-center font-bold h-9" />
                  </div>
                  <div className="flex-1 flex flex-col justify-end">
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer h-9 mb-0">
                       <Checkbox checked={eRevisao} onCheckedChange={(c) => setERevisao(c as boolean)} />
                       É Revisão?
                    </label>
                  </div>
                </div>
                
                {eRevisao && (
                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 uppercase">Selecione a tarefa original</label>
                      <Select 
                        value={tarefaOriginalId} 
                        onValueChange={(val) => {
                          setTarefaOriginalId(val);
                          // Atualiza o numero revisao e calculos
                          queries.contarRevisoesTarefa(val).then(async count => {
                            const newRev = count + 1;
                            setNumeroRevisao(newRev);
                            
                            const tOrig = tarefas.find(x => x.id === val);
                            const baseCred = tOrig?.creditos_cobrados || 0;
                            // Assumindo padrao 20% e 1 inclusa. Ideal: buscar contrato do cliente.
                            const creditosRevisao = queries.calcularCreditosRevisao(baseCred, 20, newRev, 1);
                            setCreditosRevisaoCobrados(creditosRevisao);
                            setCreditos(creditosRevisao); // A tarefa de revisao vai cobrar isso
                          });
                        }}
                      >
                        <SelectTrigger className="w-full bg-white h-9">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent className="max-h-56">
                          {tarefas.filter(t => t.cliente_id === clienteId).map(t => (
                            <SelectItem key={t.id} value={t.id}>{t.titulo}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 uppercase">Número da Revisão</label>
                      <Input type="number" readOnly value={numeroRevisao} className="h-9 bg-slate-50" />
                    </div>
                  </div>
                )}

                {cliente && (
                  <div className={cn("p-3 rounded-md text-sm border font-medium", saldoApos < 0 ? "bg-red-50 text-red-800 border-red-200" : "bg-blue-50 text-blue-800 border-blue-200")}>
                    {eRevisao && tarefaOriginalId ? (
                      <>
                        <strong>Revisão #{numeroRevisao}</strong> — {creditosRevisaoCobrados === 0 ? "Gratuita" : `+${creditosRevisaoCobrados} créditos`}
                        <div className="mt-1 text-xs text-slate-500">Saldo após: {saldoApos} cr</div>
                      </>
                    ) : saldoApos < 0 ? (
                      <>Excede saldo em <strong className="text-red-900">{Math.abs(saldoApos)} cr</strong>. Valor avulso estimado: <strong className="text-red-900">R$ {(Math.abs(saldoApos) * 14).toFixed(2).replace('.',',')}</strong></>
                    ) : (
                      <>Esta tarefa consome <strong className="text-blue-900">{creditos} cr</strong>.<br/>Saldo após criação: <strong className="text-blue-900">{saldoApos} cr</strong></>
                    )}
                  </div>
                )}
              </div>
            )}

            {isProjetoClient && (
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold text-slate-700">Projeto</label>
                  <a href="/admin/projetos" target="_blank" className="text-[10px] font-bold uppercase text-blue-600 hover:underline">
                    + Criar projeto
                  </a>
                </div>
                <Select value={projetoId} onValueChange={setProjetoId}>
                  <SelectTrigger className="w-full bg-white">
                    <SelectValue placeholder="Nenhum (Avulsa)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nenhum">Nenhum projeto (Tarefa avulsa)</SelectItem>
                    {clienteProjetos.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Responsável</label>
              <Select value={responsavelId} onValueChange={setResponsavelId}>
                <SelectTrigger className="w-full bg-white">
                  <SelectValue placeholder="Não atribuído" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nenhum">Não atribuído</SelectItem>
                  {timeMembers.map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Prioridade</label>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5">
                {(['baixa', 'normal', 'alta', 'urgente'] as const).map(p => (
                  <button
                    key={p} type="button"
                    onClick={() => setPrioridade(p)}
                    className={cn(
                      "text-[10px] uppercase font-bold py-2 rounded-md border transition-colors",
                      prioridade === p 
                        ? p === 'urgente' ? 'bg-red-100 border-red-300 text-red-700' : p === 'alta' ? 'bg-orange-100 border-orange-300 text-orange-700' : p === 'normal' ? 'bg-blue-100 border-blue-300 text-blue-700' : 'bg-slate-200 border-slate-400 text-slate-700'
                        : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700"
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Data de Vencimento</label>
              <Input type="date" value={dataVencimento} onChange={e => setDataVencimento(e.target.value)} className="bg-white" />
            </div>

            <div className="space-y-1.5 mt-2">
              <label className="text-sm font-semibold text-slate-700">Tags</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map(t => (
                  <Badge key={t} variant="secondary" className="bg-slate-200 text-slate-700 text-xs gap-1 pr-1">
                    {t}
                    <button type="button" onClick={() => setTags(tags.filter(xt => xt !== t))} className="hover:text-red-500 rounded-full p-0.5"><X className="w-3 h-3" /></button>
                  </Badge>
                ))}
              </div>
              <Input 
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={addTag}
                placeholder="Nova tag + Enter..."
                className="text-sm bg-white"
              />
            </div>

          </div>
        </form>

        <DialogFooter className="p-4 border-t border-slate-200 bg-slate-50 shrink-0 flex justify-between items-center">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="text-slate-500" disabled={isSubmitting}>Cancelar</Button>
          <Button type="submit" form="create-task-form" className="bg-blue-600 hover:bg-blue-700 font-semibold px-8 h-10" disabled={!titulo || !clienteId || isSubmitting}>
            {isSubmitting ? 'Processando...' : (origem === 'painel_cliente' ? 'Enviar Solicitação' : 'Criar Tarefa')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
