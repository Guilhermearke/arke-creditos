import React, { useState, useRef } from 'react';
import { useArkeStore, Tarefa, Cliente, StatusTarefa } from '@/lib/store';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link2, Clock, CheckCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import * as queries from '@/lib/supabase/queries';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
  tarefa: Tarefa;
  cliente?: Cliente;
  isClienteView?: boolean;
  isTimeView?: boolean;
  onUpdate?: () => void;
}

export function TabDetalhes({ tarefa, cliente, isClienteView, isTimeView, onUpdate }: Props) {
  const { atualizarTarefa, timeMembers } = useArkeStore();
  const { clienteId } = useAuth();
  
  const [desc, setDesc] = useState(tarefa.descricao || tarefa.conteudo_original || '');
  const [titulo, setTitulo] = useState(tarefa.titulo);
  const [linkEntrega, setLinkEntrega] = useState(tarefa.link_entrega || '');
  const [linkArquivo, setLinkArquivo] = useState(tarefa.link_arquivo || '');
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  const [confirmStatusModal, setConfirmStatusModal] = useState<{ open: boolean, nextStatus?: StatusTarefa, cicloAtivo?: any, isAvulsoConfirm?: boolean }>({ open: false });
  const [tempLink, setTempLink] = useState('');

  const [confirmAprovacaoModal, setConfirmAprovacaoModal] = useState(false);
  const [ajusteModal, setAjusteModal] = useState(false);
  const [textoAjuste, setTextoAjuste] = useState('');

  const timeoutRef = useRef<NodeJS.Timeout>(null);

  const handleUpdate = async (field: keyof Tarefa, value: any, instant = false) => {
    if (isClienteView) return; // Cliente não pode editar campos padroes
    
    if (instant) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      try {
        await atualizarTarefa(tarefa.id, { [field]: value });
        toast.success('Atualizado com sucesso.');
        if (onUpdate) onUpdate();
      } catch (e) {
        toast.error('Erro ao atualizar.');
      }
      return;
    }

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(async () => {
      try {
        await atualizarTarefa(tarefa.id, { [field]: value });
        if (onUpdate) onUpdate();
      } catch (e) {
        toast.error('Erro ao salvar alterações.');
      }
    }, 800) as any;
  };

  const handleStatusChange = async (val: string) => {
    const nextStatus = val as StatusTarefa;
    
    if (nextStatus === 'em_andamento' && cliente?.tipo === 'keep') {
      try {
        const agora = new Date();
        const ciclo = await queries.getCicloAtivo(tarefa.cliente_id, agora.getMonth() + 1, agora.getFullYear());
        
        if (!ciclo) {
          toast.error("Este cliente não tem ciclo ativo. Configure em Clientes.");
          return;
        }

        const creditos = tarefa.creditos_cobrados || 0;
        
        if (creditos > ciclo.creditos_restantes) {
          setConfirmStatusModal({ open: true, nextStatus, cicloAtivo: ciclo, isAvulsoConfirm: true });
          return;
        }

        // Se tem saldo, debita (reserva)
        await queries.debitarCreditos(ciclo.id, creditos, tarefa.id, clienteId);
        handleUpdate('status', nextStatus, true);
      } catch (e) {
        toast.error('Erro ao verificar ciclo do cliente.');
      }
    } else if (nextStatus === 'arquivado' && tarefa.status === 'em_andamento' && cliente?.tipo === 'keep') {
      try {
        const agora = new Date();
        const ciclo = await queries.getCicloAtivo(tarefa.cliente_id, agora.getMonth() + 1, agora.getFullYear());
        if (ciclo) {
           await queries.liberarCreditos(ciclo.id, tarefa.creditos_cobrados || 0, tarefa.id);
        }
        handleUpdate('status', nextStatus, true);
      } catch (e) {
        toast.error('Erro ao liberar créditos.');
      }
    } else if (nextStatus === 'em_revisao') {
      setTempLink(linkEntrega);
      setConfirmStatusModal({ open: true, nextStatus });
    } else if (nextStatus === 'entregue') {
      setConfirmStatusModal({ open: true, nextStatus });
    } else {
      handleUpdate('status', nextStatus, true);
    }
  };

  const confirmStatus = async () => {
    const s = confirmStatusModal.nextStatus;
    
    if (s === 'em_andamento' && confirmStatusModal.isAvulsoConfirm) {
        // Confirmou o avulso
        const ciclo = confirmStatusModal.cicloAtivo;
        const excedente = (tarefa.creditos_cobrados || 0) - ciclo.creditos_restantes;
        const valorCreditoAvulso = 14; // ou pegar do DB/store
        const valorSoma = excedente * valorCreditoAvulso;

        try {
           // Usa o que tem
           if (ciclo.creditos_restantes > 0) {
              await queries.debitarCreditos(ciclo.id, ciclo.creditos_restantes, tarefa.id, clienteId);
           }
           await atualizarTarefa(tarefa.id, { 
              status: s, 
              credito_avulso: true, 
              valor_avulso: valorSoma,
              metadata: { ...tarefa.metadata, creditos_excedentes: excedente }
           });
           toast.success('Tarefa iniciada. O excedente será cobrado como avulso.');
           setConfirmStatusModal({ open: false });
           if (onUpdate) onUpdate();
        } catch(e) {
           toast.error('Erro atualizar tarefa com avulso.');
        }
    } else if (s === 'em_revisao') {
      if (!tempLink) {
        toast.error('Link de entrega é obrigatório para revisão.');
        return;
      }
      try {
        new URL(tempLink);
      } catch (_) {
        toast.error('O link de entrega precisa ser uma URL válida (ex: https://...).');
        return;
      }
      setLinkEntrega(tempLink);
      try {
        await atualizarTarefa(tarefa.id, { status: s, link_entrega: tempLink });
        toast.success('Atualizado para em revisão');
        setConfirmStatusModal({ open: false });
        if (onUpdate) onUpdate();
      } catch (e) {
        toast.error('Erro ao atualizar');
      }
    } else if (s === 'entregue') {
      handleUpdate('status', s, true);
      setConfirmStatusModal({ open: false });
    }
  };

  const handleAprovar = async () => {
    try {
      // Optimistic locally
      atualizarTarefa(tarefa.id, { status: 'aprovado' });
      await queries.createAprovacao({
        tarefa_id: tarefa.id,
        cliente_id: clienteId,
        aprovado: true
      });
      await queries.updateTarefaStatus(tarefa.id, 'aprovado');
      toast.success('Entrega aprovada! ✓');
      setConfirmAprovacaoModal(false);
      if (onUpdate) onUpdate();
    } catch (e) {
      toast.error('Erro ao aprovar entrega');
      // Rollback not fully required for strict preview here
    }
  };

  const handleAjuste = async () => {
    if (!textoAjuste.trim()) return;
    try {
      // Optimistic locally
      atualizarTarefa(tarefa.id, { status: 'em_andamento' });
      await queries.createComentarioCliente({
        tarefa_id: tarefa.id,
        autor_id: clienteId,
        conteudo: textoAjuste,
        interno: false
      });
      await queries.updateTarefaStatus(tarefa.id, 'em_andamento');
      toast.success('Ajuste solicitado. Seu time foi notificado.');
      setAjusteModal(false);
      setTextoAjuste('');
      if (onUpdate) onUpdate();
    } catch (e) {
      toast.error('Erro ao solicitar ajuste');
    }
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Container Título Editável */}
      <section>
        <h3 className="text-sm font-semibold text-slate-900 mb-2 block">Título</h3>
        {isEditingTitle && !isClienteView ? (
          <Input 
            autoFocus
            value={titulo}
            onChange={e => {
              setTitulo(e.target.value);
              handleUpdate('titulo', e.target.value);
            }}
            onBlur={() => setIsEditingTitle(false)}
            onKeyDown={e => e.key === 'Enter' && setIsEditingTitle(false)}
            className="text-lg font-bold"
          />
        ) : (
          <h2 
            className={cn("text-lg font-bold text-slate-900 p-2 -ml-2 rounded", !isClienteView && "cursor-pointer hover:bg-slate-50")}
            onClick={() => !isClienteView && setIsEditingTitle(true)}
            title={!isClienteView ? "Clique para editar" : ""}
          >
            {titulo}
          </h2>
        )}
      </section>

      {isClienteView && tarefa.status === 'em_revisao' && (
        <section className="bg-green-50 border border-green-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-green-900 flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-5 h-5" />
              Sua entrega está pronta para revisão!
            </h3>
            <p className="text-green-700 text-sm">
              Por favor, visualize o arquivo pelo link abaixo e deixe sua decisão.
            </p>
          </div>
          <div className="flex gap-3 w-full md:w-auto mt-2 md:mt-0">
            <Button variant="outline" className="flex-1 md:flex-none border-red-200 text-red-700 bg-red-50 hover:bg-red-100 hover:text-red-800" onClick={() => setAjusteModal(true)}>Solicitar Ajuste</Button>
            <Button className="flex-1 md:flex-none bg-green-600 hover:bg-green-700 text-white" onClick={() => setConfirmAprovacaoModal(true)}>Aprovar Entrega</Button>
          </div>
        </section>
      )}

      {ajusteModal && (
        <section className="bg-red-50/50 border border-red-100 p-4 rounded-xl animate-in fade-in slide-in-from-top-2">
          <h4 className="font-semibold text-red-900 mb-2 text-sm">Descreva o ajuste necessário</h4>
          <Textarea 
            placeholder="O que precisamos mudar?" 
            value={textoAjuste}
            onChange={e => setTextoAjuste(e.target.value)}
            className="bg-white border-red-200 resize-none min-h-[100px] mb-3"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setAjusteModal(false)}>Cancelar</Button>
            <Button size="sm" className="bg-red-600 hover:bg-red-700" onClick={handleAjuste}>Enviar Ajuste</Button>
          </div>
        </section>
      )}

      {/* Container de descrição */}
      <section>
        <h3 className="text-sm font-semibold text-slate-900 mb-3 block">Descrição / Briefing</h3>
        {isClienteView ? (
          <div className="text-slate-700 whitespace-pre-wrap text-sm bg-slate-50 p-4 rounded-lg border border-slate-100">
            {desc || 'Sem descrição.'}
          </div>
        ) : (
          <Textarea 
            placeholder="Adicione orientações, briefing e detalhes da demanda..." 
            className="min-h-[120px] bg-slate-50 border-slate-200 resize-none text-slate-700"
            value={desc}
            onChange={(e) => {
              setDesc(e.target.value);
              handleUpdate('descricao', e.target.value);
            }}
          />
        )}
      </section>

      {/* Grid de Atributos */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-6 py-6 border-y border-slate-100">
        <div>
          <span className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wider">Status</span>
          {isClienteView ? (
            <Badge variant="outline" className="font-semibold text-xs uppercase bg-white border-slate-200 text-slate-700 h-9 px-3 w-full justify-start">
              {tarefa.status.replace('_', ' ')}
            </Badge>
          ) : (
            <Select value={tarefa.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="font-semibold text-xs uppercase bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {['backlog', 'a_fazer', 'em_andamento', 'em_revisao', 'aprovado', 'entregue', 'arquivado']
                  .filter(s => {
                    if (isTimeView) {
                       return s !== 'triagem' && s !== 'arquivado';
                    }
                    return true;
                  })
                  .map(s => (
                  <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        
        {!isClienteView && (
          <div>
            <span className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wider">Responsável</span>
            <Select value={tarefa.responsavel_id || 'nenhum'} onValueChange={val => handleUpdate('responsavel_id', val === 'nenhum' ? null : val, true)} disabled={isTimeView}>
              <SelectTrigger className={cn("font-medium text-sm bg-white", isTimeView && "opacity-70")}>
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
        )}

        <div>
          <span className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wider">Prazo</span>
          {isClienteView ? (
            <div className="font-medium text-sm text-slate-900 border border-slate-200 rounded-md h-9 flex items-center px-3 bg-white">
              {tarefa.data_vencimento ? format(new Date(tarefa.data_vencimento), "dd/MM/yyyy") : 'Sem prazo'}
            </div>
          ) : (
            <Input 
              type="date"
              value={tarefa.data_vencimento ? tarefa.data_vencimento.split('T')[0] : ''}
              onChange={(e) => handleUpdate('data_vencimento', e.target.value, true)}
              className="text-sm font-medium bg-white"
              disabled={isTimeView}
            />
          )}
        </div>
        
        {!isClienteView && (
          <div>
            <span className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wider">Prioridade</span>
            <div className={cn("flex bg-slate-100 rounded-md p-1 gap-1 h-9", isTimeView && "pointer-events-none opacity-70")}>
              {(['baixa', 'normal', 'alta', 'urgente'] as const).map(p => (
                <button
                  key={p} type="button"
                  onClick={() => handleUpdate('prioridade', p, true)}
                  className={cn(
                    "flex-1 text-[10px] uppercase font-bold rounded transition-colors",
                    tarefa.prioridade === p 
                      ? p === 'urgente' ? 'bg-red-100 text-red-700 shadow-sm' : p === 'alta' ? 'bg-orange-100 text-orange-700 shadow-sm' : p === 'normal' ? 'bg-blue-100 text-blue-700 shadow-sm' : 'bg-slate-200 text-slate-700 shadow-sm'
                      : "text-slate-400 hover:text-slate-700 hover:bg-slate-200/50"
                  )}
                  title={p}
                >
                  {p.substring(0, 1)}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Seção Keep / Créditos */}
      {!isClienteView && !isTimeView && cliente?.tipo === 'keep' && (
        <section className="bg-blue-50/50 border border-blue-100 rounded-xl p-5">
           <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-blue-900">Informações Keep</h3>
              <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-0">Créditos Ativos</Badge>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <span className="block text-xs font-medium text-blue-700/70 mb-1 uppercase tracking-wider">Custo Previsto</span>
                <div className="text-lg font-bold text-blue-900">{tarefa.creditos_cobrados || 0} cr</div>
              </div>
              <div>
                <span className="block text-xs font-medium text-blue-700/70 mb-1 uppercase tracking-wider">É revisão?</span>
                <div className="text-sm font-medium text-blue-900 mt-1">
                  {tarefa.e_revisao ? `Sim, revisão #${tarefa.numero_revisao}` : 'Não'}
                </div>
              </div>
              <div>
                <span className="block text-xs font-medium text-blue-700/70 mb-1 uppercase tracking-wider">Saldo após entrega</span>
                <div className="text-sm font-medium text-blue-900 mt-1">{cliente.creditos_restantes - (tarefa.creditos_cobrados || 0)} cr</div>
              </div>
           </div>
        </section>
      )}

      {/* Entrega */}
      {(linkEntrega || linkArquivo || !isClienteView) && (
        <section className="bg-slate-50 border border-slate-100 p-5 rounded-xl">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Links de Entrega
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Link de Revisão/Aprovação</label>
              {isClienteView ? (
                linkEntrega ? <a href={linkEntrega} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center text-sm"><Link2 className="w-4 h-4 mr-1"/> Acessar Entrega</a> : <span className="text-sm text-slate-400">Ainda não disponível</span>
              ) : (
                <div className="flex gap-2">
                  <Input 
                     placeholder="https://figma.com/..." 
                     value={linkEntrega}
                     onChange={e => {
                       setLinkEntrega(e.target.value);
                       handleUpdate('link_entrega', e.target.value);
                     }}
                     className="bg-white"
                  />
                </div>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Link do Arquivo Final</label>
              {isClienteView ? (
                linkArquivo ? <a href={linkArquivo} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center text-sm"><Link2 className="w-4 h-4 mr-1"/> Acessar Arquivo Final</a> : <span className="text-sm text-slate-400">Ainda não disponível</span>
              ) : (
                <div className="flex gap-2">
                  <Input 
                     placeholder="https://drive.google.com/..." 
                     value={linkArquivo}
                     onChange={e => {
                       setLinkArquivo(e.target.value);
                       handleUpdate('link_arquivo', e.target.value);
                     }}
                     className="bg-white"
                  />
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      <Dialog open={confirmStatusModal.open} onOpenChange={(o) => !o && setConfirmStatusModal({ open: false })}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Confirmar Mudança de Status</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {confirmStatusModal.nextStatus === 'em_andamento' && confirmStatusModal.isAvulsoConfirm && (
              <div className="text-sm text-red-600 font-medium bg-red-50 p-4 border border-red-100 rounded-lg">
                <p>O cliente não possui créditos suficientes no ciclo atual.</p>
                <p className="mt-2 text-slate-800">
                  Créditos disponíveis: <strong>{confirmStatusModal.cicloAtivo?.creditos_restantes || 0}</strong><br/>
                  Custo da tarefa: <strong>{tarefa.creditos_cobrados || 0}</strong><br/>
                  Excedente cobrado como avulso: <strong>{(tarefa.creditos_cobrados || 0) - (confirmStatusModal.cicloAtivo?.creditos_restantes || 0)} créditos (R$ {((tarefa.creditos_cobrados || 0) - (confirmStatusModal.cicloAtivo?.creditos_restantes || 0)) * 14})</strong>
                </p>
                <p className="mt-2 font-semibold">Deseja prosseguir e gerar cobrança avulsa?</p>
              </div>
            )}
            {confirmStatusModal.nextStatus === 'em_revisao' && (
              <>
                <p className="text-sm text-slate-600">Para enviar para revisão, você deve informar o link de entrega (Figma, Drive, Vimeo, etc):</p>
                <Input 
                  autoFocus
                  placeholder="Link de entrega..."
                  value={tempLink}
                  onChange={e => setTempLink(e.target.value)}
                />
              </>
            )}
            {confirmStatusModal.nextStatus === 'entregue' && (
              <p className="text-sm text-red-600 font-medium bg-red-50 p-4 border border-red-100 rounded-lg">
                Confirmar entrega e débito de créditos?
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmStatusModal({ open: false })}>Cancelar</Button>
            <Button onClick={confirmStatus} className="bg-blue-600 hover:bg-blue-700">Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={confirmAprovacaoModal} onOpenChange={setConfirmAprovacaoModal}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Confirmar Aprovação</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-slate-600">
              Tem certeza que deseja aprovar esta entrega? Após aprovada, enviaremos os arquivos finais (caso aplicável).
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmAprovacaoModal(false)}>Ainda não</Button>
            <Button onClick={handleAprovar} className="bg-green-600 hover:bg-green-700">Sim, aprovar entrega</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
