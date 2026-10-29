// @ts-nocheck
'use client';

import { useEffect, useState } from 'react';
import { useArkeStore } from '@/lib/store';
import { toast } from 'sonner';
import { ArrowLeft, Plus } from 'lucide-react';
import CreateTaskModal from './CreateTaskModal';
import TaskCard from './TaskCard';

interface ProjectDetailProps {
  projetoId: string;
  onBack: () => void;
}

export default function ProjectDetail({ projetoId, onBack }: ProjectDetailProps) {
  const { projetos, tarefas, carregarTarefasDoProjeto } = useArkeStore();
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);

  const projeto = projetos.find((p) => p.id === projetoId);
  const projetoTarefas = tarefas.filter((t) => t.projeto_id === projetoId);

  useEffect(() => {
    if (projetoId) {
      carregarTarefasDoProjeto(projetoId);
    }
  }, [projetoId, carregarTarefasDoProjeto]);

  if (!projeto) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-slate-500">Projeto não encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-slate-700" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{projeto.nome}</h1>
            <p className="text-slate-600 mt-1">{projeto.descricao}</p>
          </div>
        </div>

        {/* Status bar */}
        <div className="bg-white rounded-lg p-4 mb-6 flex items-center justify-between">
          <div>
            <span className="text-sm text-slate-600">Status: </span>
            <span className="font-semibold text-slate-900 capitalize">{projeto.status}</span>
          </div>
          <button
            onClick={() => setIsCreateTaskModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nova Tarefa
          </button>
        </div>

        {/* Tarefas */}
        <div>
          <h2 className="text-xl font-semibold text-slate-900 mb-4">
            Tarefas ({projetoTarefas.length})
          </h2>

          {projetoTarefas.length === 0 ? (
            <div className="bg-white rounded-lg p-12 text-center text-slate-500">
              <p>Nenhuma tarefa neste projeto ainda</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {projetoTarefas.map((tarefa) => (
                <TaskCard key={tarefa.id} tarefa={tarefa} />
              ))}
            </div>
          )}
        </div>
      </div>

      <CreateTaskModal
        isOpen={isCreateTaskModalOpen}
        onClose={() => setIsCreateTaskModalOpen(false)}
        projetoId={projetoId}
      />
    </div>
  );
}
