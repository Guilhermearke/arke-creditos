import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useArkeStore } from '@/lib/store';
import { X } from 'lucide-react';
import { fetchPlanos, createContrato, createCiclo } from '@/lib/supabase/queries';
import { toast } from 'sonner';

interface CreateClienteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateClienteModal({ isOpen, onClose }: CreateClienteModalProps) {
  const { adicionarCliente } = useArkeStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [planos, setPlanos] = useState<any[]>([]);

  // Form State
  const [nome, setNome] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [tipo, setTipo] = useState<'keep' | 'build' | 'craft' | 'avulso'>('keep');
  const [corTema, setCorTema] = useState('#2563EB');

  // Keep Form State
  const [planoId, setPlanoId] = useState('');
  const [creditosMensais, setCreditosMensais] = useState(0);
  const [valorMensal, setValorMensal] = useState(0);
  const [creditosAcumulam, setCreditosAcumulam] = useState(false);
  const [revisoesIncluidas, setRevisoesIncluidas] = useState(1);
  const [revisaoPercentual, setRevisaoPercentual] = useState(20);

  useEffect(() => {
    if (isOpen) {
      fetchPlanos().then(res => setPlanos(res));
    }
  }, [isOpen]);

  const handlePlanoChange = (id: string) => {
    setPlanoId(id);
    const plano = planos.find(p => p.id === id);
    if (plano) {
      setCreditosMensais(plano.creditos_mensais || 0);
      setValorMensal(plano.valor_mensal || 0);
      setCreditosAcumulam(plano.creditos_acumulam || false);
      setRevisoesIncluidas(plano.revisoes_incluidas || 1);
      setRevisaoPercentual(plano.revisao_percentual || 20);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;

    setIsSubmitting(true);
    try {
      const novoCliente = await adicionarCliente({
        nome,
        empresa,
        email,
        whatsapp,
        tipo,
        cor_tema: corTema,
        creditos_mensais: tipo === 'keep' ? creditosMensais : 0, 
        creditos_restantes: tipo === 'keep' ? creditosMensais : 0,
        creditos_usados: 0
      });

      if (tipo === 'keep') {
        const contrato = await createContrato({
           cliente_id: novoCliente.id,
           plano_id: planoId || null,
           nome: planos.find(p => p.id === planoId)?.nome || 'Contrato Base',
           creditos_mensais: creditosMensais,
           valor_mensal: valorMensal,
           revisoes_incluidas: revisoesIncluidas,
           revisao_percentual: revisaoPercentual
        });

        const agora = new Date();
        const mesAtual = agora.getMonth() + 1;
        const anoAtual = agora.getFullYear();

        await createCiclo({
           contrato_id: contrato.id,
           cliente_id: novoCliente.id,
           mes: mesAtual,
           ano: anoAtual,
           creditos_disponiveis: creditosMensais
        });

        toast.success(`Cliente criado com ciclo de ${creditosMensais} créditos para ${mesAtual}/${anoAtual}`);
      } else {
        toast.success('Cliente adicionado com sucesso!');
      }

      onClose();
      // Reset form
      setNome('');
      setEmpresa('');
      setEmail('');
      setWhatsapp('');
      setTipo('keep');
      setCorTema('#2563EB');
      setPlanoId('');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao salvar cliente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Cliente</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Nome do Cliente *</label>
            <input autoFocus type="text" required value={nome} onChange={(e) => setNome(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ex: João Silva" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Empresa</label>
            <input type="text" value={empresa} onChange={(e) => setEmpresa(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ex: Tech Corp" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">E-mail</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="email@empresa.com" />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">WhatsApp</label>
              <input type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="(00) 00000-0000" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Tipo de Plano *</label>
              <select value={tipo} onChange={(e) => setTipo(e.target.value as any)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="keep">Keep (Assinatura)</option>
                <option value="build">Build (Desenvolvimento)</option>
                <option value="craft">Craft (Identidade/UX)</option>
                <option value="avulso">Avulso (Demanda Varejo)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Cor Tema</label>
              <div className="flex gap-2 items-center">
                <input type="color" value={corTema} onChange={(e) => setCorTema(e.target.value)} className="w-10 h-10 rounded cursor-pointer border-0 p-0" />
                <input type="text" value={corTema} onChange={(e) => setCorTema(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>

          {tipo === 'keep' && (
            <div className="border border-blue-100 bg-blue-50/50 p-4 rounded-lg space-y-4 mt-2">
               <h4 className="font-semibold text-sm text-blue-900">Configuração de Contrato Keep</h4>
               
               <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Plano Base</label>
                  <select value={planoId} onChange={(e) => handlePlanoChange(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="" disabled>Selecione um plano ou customize abaixo</option>
                    {planos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                  </select>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <label className="text-sm font-medium text-slate-700">Créditos Mensais</label>
                     <input type="number" required value={creditosMensais} onChange={(e) => setCreditosMensais(Number(e.target.value))} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-sm font-medium text-slate-700">Valor Mensal (R$)</label>
                     <input type="number" required value={valorMensal} onChange={(e) => setValorMensal(Number(e.target.value))} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm" />
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <label className="text-sm font-medium text-slate-700">Revisões Incluídas</label>
                     <input type="number" required value={revisoesIncluidas} onChange={(e) => setRevisoesIncluidas(Number(e.target.value))} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm" />
                  </div>
                  <div className="flex items-end space-y-2 pb-2">
                     <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                       <input type="checkbox" checked={creditosAcumulam} onChange={(e) => setCreditosAcumulam(e.target.checked)} className="rounded border-slate-300" />
                       Créditos acumulam?
                     </label>
                  </div>
               </div>
            </div>
          )}

          <DialogFooter className="pt-4">
            <div className="flex justify-end gap-2 w-full">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors" disabled={isSubmitting}>Cancelar</button>
              <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50" disabled={isSubmitting}>{isSubmitting ? 'Salvando...' : 'Salvar Cliente'}</button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
