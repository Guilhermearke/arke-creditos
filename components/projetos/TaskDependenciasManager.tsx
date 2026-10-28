// @ts-nocheck
'use client';

import { useState } from 'react';
import { useArkeStore } from '@/lib/store';
import { TarefaDependencia } from '@/lib/types';
import { Plus, Trash2, Lock, Unlock } from 'lucide-react';
import { toast } from 'sonner';

interface TaskDependenciasManagerProps {
  tarefaId: string;
  dependencias: TarefaDependencia[];
}

export default function TaskDependenciasManager({
  tarefaId,
  dependencias,
}: TaskDependenciasManagerProps) {
  const { tarefas, adicionarDependencia, removerDependencia } = useArkeStore();
  const [isAdding, setIsAdding] = useState(false);
  const [selectedTarefaId, setSelectedTarefaId] = useState('');

  const tarefasDisponiveis = tarefas.filter(
    (t) =>
      t.id !== tarefaId &&
      !dependencias.some((d) => d.depende_de === t.id) &&
      t.projeto_id === tarefas.find((ta) => ta.id === tarefaId)?.projeto_id
  );

  const handleAddDependencia = async () => {
    if (!selectedTarefaId) {
      toast.error('Selecione uma tarefa');
      return;
    }

    try {
      await adicionarDependencia(tarefaId, selectedTarefaId);
      toast.success('Dependência adicionada!');
      setSelectedTarefaId('');
      setIsAdding(false);
    } catch (error) {
      console.error('Erro ao adicionar dependência:', error);
      toast.error('Erro ao adicionar dependência');
    }
  };

  const handleRemoveDependencia = async (dependeDeId: string) => {
    try {
      await removerDependencia(tarefaId, dependeDeId);
      toast.success('Dependência removida!');
    } catch (error) {
      console.error('Erro ao remover dependência:', error);
      toast.error('Erro ao remover dependência');
    }
  };

  return (
    <div className="bg-slate-50 p-3 rounded mb-3 space-y-2">
      {dependencias.length === 0 ? (
        <p className="text-sm text-slate-500">Nenhuma dependência</p>
      ) : (
        <div className="space-y-2">
          {dependencias.map((d) => {
            const tarefaBloqueadora = tarefas.find((t) => t.id === d.depende_de);
            return (
              <div
                key={d.id}
                className={`flex items-center justify-between p-2 rounded border ${
                  d.bloqueada
                    ? 'bg-yellow-50 border-yellow-300'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {d.bloqueada ? (
                      <Lock className="w-4 h-4 text-yellow-600" />
                    ) : (
                      <Unlock className="w-4 h-4 text-green-600" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        Depende de: <span className="font-semibold">{tarefaBloqueadora?.titulo}</span>
                      </p>
                      <p className="text-xs text-slate-600">
                        Status: {tarefaBloqueadora?.status || 'desconhecido'}
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveDependencia(d.depende_de)}
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
            value={selectedTarefaId}
            onChange={(e) => setSelectedTarefaId(e.target.value)}
            className="w-full border border-slate-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Selecione uma tarefa</option>
            {tarefasDisponiveis.map((t) => (
              <option key={t.id} value={t.id}>
                {t.titulo} ({t.status})
              </option>
            ))}
          </select>

          <div className="flex gap-2">
            <button
              onClick={() => setIsAdding(false)}
              className="flex-1 px-2 py-1 text-sm text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleAddDependencia}
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
          Adicionar Dependência
        </button>
      )}
    </div>
  );
}
