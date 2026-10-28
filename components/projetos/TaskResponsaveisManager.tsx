// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useArkeStore } from '@/lib/store';
import { TarefaResponsavel } from '@/lib/types';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';

interface TaskResponsaveisManagerProps {
  tarefaId: string;
  responsaveis: TarefaResponsavel[];
}

interface Profile {
  id: string;
  nome: string;
  role: 'time' | 'cliente' | 'admin';
}

export default function TaskResponsaveisManager({
  tarefaId,
  responsaveis,
}: TaskResponsaveisManagerProps) {
  const { adicionarResponsavelAoTarefa, removerResponsavelDoTarefa } = useArkeStore();
  const [isAdding, setIsAdding] = useState(false);
  const [selectedResponsavelId, setSelectedResponsavelId] = useState('');
  const [profiles, setProfiles] = useState<Profile[]>([]);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, nome, role')
      .in('role', ['time', 'cliente']);

    if (!error && data) {
      setProfiles(data);
    }
  };

  const responsaveisDisponiveis = profiles.filter(
    (p) => !responsaveis.some((r) => r.responsavel_id === p.id)
  );

  const handleAddResponsavel = async () => {
    if (!selectedResponsavelId) {
      toast.error('Selecione um responsável');
      return;
    }

    const responsavel = profiles.find((p) => p.id === selectedResponsavelId);
    if (!responsavel) return;

    try {
      await adicionarResponsavelAoTarefa(tarefaId, {
        responsavel_id: selectedResponsavelId,
        role_responsavel: responsavel.role,
      } as any);

      toast.success('Responsável adicionado!');
      setSelectedResponsavelId('');
      setIsAdding(false);
    } catch (error) {
      console.error('Erro ao adicionar responsável:', error);
      toast.error('Erro ao adicionar responsável');
    }
  };

  const handleRemoveResponsavel = async (responsavelId: string) => {
    try {
      await removerResponsavelDoTarefa(tarefaId, responsavelId);
      toast.success('Responsável removido!');
    } catch (error) {
      console.error('Erro ao remover responsável:', error);
      toast.error('Erro ao remover responsável');
    }
  };

  return (
    <div className="bg-slate-50 p-3 rounded mb-3 space-y-2">
      {responsaveis.length === 0 ? (
        <p className="text-sm text-slate-500">Nenhum responsável atribuído</p>
      ) : (
        <div className="space-y-2">
          {responsaveis.map((r) => {
            const profile = profiles.find((p) => p.id === r.responsavel_id);
            return (
              <div
                key={r.id}
                className="flex items-center justify-between bg-white p-2 rounded border border-slate-200"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">{profile?.nome || 'Desconhecido'}</p>
                  <p className="text-xs text-slate-600">{r.role_responsavel}</p>
                </div>
                <button
                  onClick={() => handleRemoveResponsavel(r.responsavel_id)}
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
            value={selectedResponsavelId}
            onChange={(e) => setSelectedResponsavelId(e.target.value)}
            className="w-full border border-slate-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Selecione um responsável</option>
            {responsaveisDisponiveis.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
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
              onClick={handleAddResponsavel}
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
          Adicionar Responsável
        </button>
      )}
    </div>
  );
}
