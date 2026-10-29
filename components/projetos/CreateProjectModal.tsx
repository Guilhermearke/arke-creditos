// @ts-nocheck
'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import type { Cliente } from '@/lib/types';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientes: Cliente[];
  onSuccess: (projeto: any) => void;
}

export default function CreateProjectModal({
  isOpen,
  onClose,
  clientes,
  onSuccess,
}: CreateProjectModalProps) {
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [tipo, setTipo] = useState<'keep' | 'build' | 'craft' | 'avulso'>('keep');
  const [dataInicio, setDataInicio] = useState('');
  const [dataPrazo, setDataPrazo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Debug: mostrar estado quando modal abre
  useEffect(() => {
    if (isOpen) {
      console.log('Modal aberto. Estado atual:', {
        nome,
        clienteId,
        tipo,
        isSubmitting,
      });
    }
  }, [isOpen, nome, clienteId, tipo, isSubmitting]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validação
    if (!nome.trim()) {
      console.error('Nome vazio:', nome);
      return;
    }
    if (!clienteId) {
      console.error('Cliente vazio:', clienteId);
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('Enviando projeto:', {
        cliente_id: clienteId,
        nome,
        descricao,
        tipo,
        status: 'briefing',
        data_inicio: dataInicio || null,
        data_prazo: dataPrazo || null,
      });

      onSuccess({
        cliente_id: clienteId,
        nome,
        descricao,
        tipo,
        status: 'briefing',
        data_inicio: dataInicio || null,
        data_prazo: dataPrazo || null,
      });

      // Reset form
      setNome('');
      setDescricao('');
      setClienteId('');
      setTipo('keep');
      setDataInicio('');
      setDataPrazo('');
    } catch (error) {
      console.error('Erro ao criar projeto:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo Projeto</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Cliente *</label>
            <select
              required
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione um cliente</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Nome do Projeto *</label>
            <input
              autoFocus
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: Landing Page"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Descrição</label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Descrição do projeto..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Tipo</label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as any)}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="keep">Keep</option>
                <option value="build">Build</option>
                <option value="craft">Craft</option>
                <option value="avulso">Avulso</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Status</label>
              <input
                type="text"
                disabled
                value="Briefing"
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm bg-slate-100 text-slate-600 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Data Início</label>
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Data Prazo</label>
              <input
                type="date"
                value={dataPrazo}
                onChange={(e) => setDataPrazo(e.target.value)}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <DialogFooter className="pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Salvando...' : 'Criar Projeto'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
