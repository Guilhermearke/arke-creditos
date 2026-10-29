// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useArkeStore } from '@/lib/store';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

interface TaskTimerProps {
  tarefaId: string;
  responsavelId: string;
}

interface Sessao {
  id: string;
  data_inicio: string;
  data_fim?: string;
}

export default function TaskTimer({ tarefaId, responsavelId }: TaskTimerProps) {
  const { iniciarSessao, pausarSessao, sessoes } = useArkeStore();
  const [timerAtivo, setTimerAtivo] = useState(false);
  const [tempoDecorrido, setTempoDecorrido] = useState(0);
  const [sessaoAtual, setSessaoAtual] = useState<Sessao | null>(null);
  const [totalTempo, setTotalTempo] = useState(0);

  // Busca sessão ativa ao carregar
  useEffect(() => {
    const buscarSessaoAtiva = async () => {
      try {
        const { fetchSessaoAtiva } = await import('@/lib/supabase/queries');
        const sessao = await fetchSessaoAtiva(tarefaId, responsavelId);
        if (sessao) {
          setSessaoAtual(sessao);
          setTimerAtivo(true);
        }
      } catch (error) {
        console.error('Erro ao buscar sessão ativa:', error);
      }
    };

    buscarSessaoAtiva();
  }, [tarefaId, responsavelId]);

  // Calcula tempo total das sessões
  useEffect(() => {
    const minhasSessoes = sessoes.filter(
      (s) => s.tarefa_id === tarefaId && s.responsavel_id === responsavelId
    );

    let total = 0;
    minhasSessoes.forEach((s) => {
      const inicio = new Date(s.data_inicio);
      const fim = s.data_fim ? new Date(s.data_fim) : new Date();
      total += (fim.getTime() - inicio.getTime()) / 1000 / 60; // em minutos
    });

    setTotalTempo(Math.floor(total));
  }, [sessoes, tarefaId, responsavelId]);

  // Timer que roda a cada segundo
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (timerAtivo && sessaoAtual) {
      interval = setInterval(() => {
        const agora = new Date();
        const inicio = new Date(sessaoAtual.data_inicio);
        const decorrido = Math.floor((agora.getTime() - inicio.getTime()) / 1000); // em segundos
        setTempoDecorrido(decorrido);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [timerAtivo, sessaoAtual]);

  const formatarTempo = (segundos: number) => {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segs = segundos % 60;

    if (horas > 0) {
      return `${horas}h ${minutos}min ${segs}s`;
    }
    return `${minutos}min ${segs}s`;
  };

  const handlePlay = async () => {
    try {
      await iniciarSessao(tarefaId, responsavelId, 'desenvolvimento');
      setTimerAtivo(true);
      toast.success('Sessão iniciada!');
    } catch (error) {
      console.error('Erro ao iniciar sessão:', error);
      toast.error('Erro ao iniciar sessão');
    }
  };

  const handlePause = async () => {
    if (!sessaoAtual) return;

    try {
      await pausarSessao(sessaoAtual.id);
      setTimerAtivo(false);
      setTempoDecorrido(0);
      setSessaoAtual(null);
      toast.success('Sessão pausada!');
    } catch (error) {
      console.error('Erro ao pausar sessão:', error);
      toast.error('Erro ao pausar sessão');
    }
  };

  const handleReset = () => {
    setSessaoAtual(null);
    setTempoDecorrido(0);
    setTimerAtivo(false);
  };

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50/70 p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-blue-700">Tempo em foco</p>
          <div className="mt-1 font-mono text-2xl font-bold leading-none text-blue-950 sm:text-3xl">
            {formatarTempo(tempoDecorrido)}
          </div>
          <div className="mt-1 text-xs font-medium text-blue-700">
            Total neste item: {Math.floor(totalTempo / 60)}h {totalTempo % 60}min
          </div>
        </div>

        <div className="flex shrink-0 gap-2">
        {!timerAtivo ? (
          <button
            onClick={handlePlay}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
          >
            <Play className="w-4 h-4" />
            Iniciar
          </button>
        ) : (
          <button
            onClick={handlePause}
            className="flex items-center gap-2 rounded-lg bg-yellow-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-yellow-700"
          >
            <Pause className="w-4 h-4" />
            Pausar
          </button>
        )}

        {(timerAtivo || tempoDecorrido > 0) && (
          <button
            onClick={handleReset}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
          >
            <RotateCcw className="w-4 h-4" />
            Resetar
          </button>
        )}
        </div>
      </div>

      {/* Histórico de sessões */}
      {sessoes.filter((s) => s.tarefa_id === tarefaId && s.responsavel_id === responsavelId).length > 0 && (
        <div className="mt-3 border-t border-blue-200 pt-3">
          <p className="text-xs font-semibold text-blue-700 mb-2">Histórico:</p>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {sessoes
              .filter((s) => s.tarefa_id === tarefaId && s.responsavel_id === responsavelId)
              .map((s) => {
                const inicio = new Date(s.data_inicio);
                const fim = s.data_fim ? new Date(s.data_fim) : new Date();
                const minutos = Math.floor((fim.getTime() - inicio.getTime()) / 1000 / 60);
                return (
                  <div key={s.id} className="text-xs text-blue-600 bg-white/50 p-1.5 rounded">
                    {inicio.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} -{' '}
                    {fim.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} ({minutos}
                    min)
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
