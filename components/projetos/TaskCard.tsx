// @ts-nocheck
'use client';

import { useState } from 'react';
import { Tarefa } from '@/lib/types';
import { Plus, X, AlertCircle, CheckCircle } from 'lucide-react';
import TaskServicosManager from './TaskServicosManager';
import TaskResponsaveisManager from './TaskResponsaveisManager';
import TaskDependenciasManager from './TaskDependenciasManager';
import TaskTimer from './TaskTimer';

interface TaskCardProps {
  tarefa: Tarefa;
}

export default function TaskCard({ tarefa }: TaskCardProps) {
  const [expandedSection, setExpandedSection] = useState<'servicos' | 'responsaveis' | 'dependencias' | null>(null);

  // Calcula total de créditos
  const totalCreditos = tarefa.servico?.creditos || 0;

  // Verifica se está bloqueada
  const estaBloqueada = (tarefa.dependencias || []).some((d) => d.bloqueada);

  return (
    <div
      className={`rounded-lg border-2 transition-all ${
        estaBloqueada
          ? 'border-yellow-300 bg-yellow-50'
          : 'border-slate-200 bg-white hover:shadow-md'
      }`}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-slate-900">{tarefa.titulo}</h3>
              {estaBloqueada && (
                <div className="flex items-center gap-1 bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
                  <AlertCircle className="w-3 h-3" />
                  Bloqueada
                </div>
              )}
            </div>
            {tarefa.descricao && (
              <p className="text-sm text-slate-600 mb-2">{tarefa.descricao}</p>
            )}
          </div>
          <span className={`text-xs font-semibold px-2 py-1 rounded ${
            tarefa.prioridade === 'urgente'
              ? 'bg-red-100 text-red-700'
              : tarefa.prioridade === 'alta'
              ? 'bg-orange-100 text-orange-700'
              : tarefa.prioridade === 'normal'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-green-100 text-green-700'
          }`}>
            {tarefa.prioridade}
          </span>
        </div>

        {/* Serviços */}
        <div className="mb-3">
          <button
            onClick={() =>
              setExpandedSection(expandedSection === 'servicos' ? null : 'servicos')
            }
            className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900 mb-2"
          >
            <span>📦 Serviços ({(tarefa.servicos || []).length})</span>
            {totalCreditos > 0 && (
              <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                {totalCreditos} créditos
              </span>
            )}
          </button>
          {expandedSection === 'servicos' && (
            <TaskServicosManager tarefaId={tarefa.id} servicos={tarefa.servicos || []} />
          )}
        </div>

        {/* Responsáveis */}
        <div className="mb-3">
          <button
            onClick={() =>
              setExpandedSection(expandedSection === 'responsaveis' ? null : 'responsaveis')
            }
            className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900 mb-2"
          >
            <span>👥 Responsáveis ({(tarefa.responsaveis || []).length})</span>
          </button>
          {expandedSection === 'responsaveis' && (
            <TaskResponsaveisManager tarefaId={tarefa.id} responsaveis={tarefa.responsaveis || []} />
          )}
        </div>

        {/* Timer de Trabalho */}
        {(tarefa.responsaveis || []).length > 0 && (
          <div className="mb-3">
            <TaskTimer tarefaId={tarefa.id} responsavelId={(tarefa.responsaveis || [])[0].responsavel_id} />
          </div>
        )}

        {/* Dependências */}
        <div>
          <button
            onClick={() =>
              setExpandedSection(expandedSection === 'dependencias' ? null : 'dependencias')
            }
            className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900 mb-2"
          >
            <span>🔗 Dependências ({(tarefa.dependencias || []).length})</span>
          </button>
          {expandedSection === 'dependencias' && (
            <TaskDependenciasManager tarefaId={tarefa.id} dependencias={tarefa.dependencias || []} />
          )}
        </div>

        {/* Status */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200 mt-3">
          <span className="text-xs text-slate-500">
            Status: <span className="font-semibold">{tarefa.status}</span>
          </span>
          {tarefa.data_vencimento && (
            <span className="text-xs text-slate-500">
              Vence em: {new Date(tarefa.data_vencimento).toLocaleDateString('pt-BR')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
