// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useArkeStore } from '@/lib/store';
import { TarefaServico } from '@/lib/types';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface TaskServicosManagerProps {
  tarefaId: string;
  servicos: TarefaServico[];
}

export default function TaskServicosManager({
  tarefaId,
  servicos,
}: TaskServicosManagerProps) {
  const { servicos: todosServicos, adicionarServicoAoTarefa, removerServicoDoTarefa } = useArkeStore();
  const [isAdding, setIsAdding] = useState(false);
  const [selectedServicoId, setSelectedServicoId] = useState('');
  const [quantidade, setQuantidade] = useState(1);

  const servicosDisponiveis = todosServicos.filter(
    (s) => !servicos.some((ts) => ts.servico_id === s.id)
  );

  const handleAddServico = async () => {
    if (!selectedServicoId) {
      toast.error('Selecione um serviço');
      return;
    }

    try {
      await adicionarServicoAoTarefa(tarefaId, {
        servico_id: selectedServicoId,
        quantidade,
        creditos_padrao: null,
      } as any);

      toast.success('Serviço adicionado!');
      setSelectedServicoId('');
      setQuantidade(1);
      setIsAdding(false);
    } catch (error) {
      console.error('Erro ao adicionar serviço:', error);
      toast.error('Erro ao adicionar serviço');
    }
  };

  const handleRemoveServico = async (servicoId: string) => {
    try {
      await removerServicoDoTarefa(tarefaId, servicoId);
      toast.success('Serviço removido!');
    } catch (error) {
      console.error('Erro ao remover serviço:', error);
      toast.error('Erro ao remover serviço');
    }
  };

  return (
    <div className="bg-slate-50 p-3 rounded mb-3 space-y-2">
      {servicos.length === 0 ? (
        <p className="text-sm text-slate-500">Nenhum serviço adicionado</p>
      ) : (
        <div className="space-y-2">
          {servicos.map((ts) => {
            const servico = todosServicos.find((s) => s.id === ts.servico_id);
            return (
              <div
                key={ts.id}
                className="flex items-center justify-between bg-white p-2 rounded border border-slate-200"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">{servico?.nome}</p>
                  <p className="text-xs text-slate-600">
                    {ts.quantidade}x × {servico?.creditos || 0} = {ts.creditos_total} créditos
                  </p>
                </div>
                <button
                  onClick={() => handleRemoveServico(ts.servico_id)}
                  className="text-red-600 hover:text-red-700 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {isAdding ? (
        <div className="bg-white p-3 rounded border border-blue-200 space-y-2">
          <select
            value={selectedServicoId}
            onChange={(e) => setSelectedServicoId(e.target.value)}
            className="w-full border border-slate-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Selecione um serviço</option>
            {servicosDisponiveis.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nome} ({s.creditos} cr)
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-700">Quantidade:</label>
            <input
              type="number"
              min="1"
              step="0.5"
              value={quantidade}
              onChange={(e) => setQuantidade(Number(e.target.value))}
              className="w-20 border border-slate-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setIsAdding(false)}
              className="flex-1 px-2 py-1 text-sm text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleAddServico}
              className="flex-1 px-2 py-1 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
            >
              Adicionar
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          <Plus className="w-4 h-4" />
          Adicionar Serviço
        </button>
      )}
    </div>
  );
}
