import React from 'react';
import { useArkeStore } from '@/lib/store';
import { format } from 'date-fns';

export function TabAtividade({ tarefaId }: { tarefaId: string }) {
  const { atividades } = useArkeStore();
  const log = atividades[tarefaId] || [];

  return (
    <div className="max-w-2xl px-2">
      <h3 className="font-semibold text-slate-900 mb-6">Histórico da Tarefa</h3>
      <div className="relative border-l-2 border-slate-200 ml-3 space-y-8">
        {log.map((item, i) => (
          <div key={item.id} className="relative pl-6">
            {/* Timeline dot */}
            <div className="absolute w-3 h-3 bg-slate-200 rounded-full -left-[7px] top-1.5 border-2 border-white"></div>
            
            <p className="text-sm font-medium text-slate-900 mb-0.5">{item.texto}</p>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-slate-600">{item.autor}</span>
              <span>&bull;</span>
              <span>{format(new Date(item.data), "dd/MM/yyyy 'às' HH:mm")}</span>
            </div>
          </div>
        ))}

        {log.length === 0 && (
          <div className="pl-6 text-slate-400 text-sm py-4">Sem atividades registradas.</div>
        )}
      </div>
    </div>
  );
}
