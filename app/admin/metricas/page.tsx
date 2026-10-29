// @ts-nocheck
'use client';

import { useEffect, useState } from 'react';
import { useArkeStore } from '@/lib/store';
import { AlertCircle, TrendingUp } from 'lucide-react';

export default function MetricasPage() {
  const { projetos, tarefas, sessoes, carregarDadosIniciais } = useArkeStore();
  const [dataInicio, setDataInicio] = useState<Date | null>(null);
  const [dataFim, setDataFim] = useState<Date | null>(null);

  useEffect(() => {
    carregarDadosIniciais();
    setDataInicio(new Date(new Date().setDate(new Date().getDate() - 7))); // últimos 7 dias
    setDataFim(new Date());
  }, [carregarDadosIniciais]);

  // Calcula métricas
  const calcularCargaPorPessoa = () => {
    const carga: Record<string, { totalMinutos: number; tarefas: number; nome?: string }> = {};

    sessoes.forEach((s) => {
      if (!dataInicio || !dataFim) return;
      const inicio = new Date(s.data_inicio);
      if (inicio < dataInicio || inicio > dataFim) return;

      const fim = s.data_fim ? new Date(s.data_fim) : new Date();
      const minutos = (fim.getTime() - inicio.getTime()) / 1000 / 60;

      if (!carga[s.responsavel_id]) {
        carga[s.responsavel_id] = { totalMinutos: 0, tarefas: new Set().size };
      }
      carga[s.responsavel_id].totalMinutos += minutos;
    });

    return Object.entries(carga).map(([id, dados]) => ({
      id,
      horas: (dados.totalMinutos / 60).toFixed(1),
      minutos: dados.totalMinutos,
    }));
  };

  const calcularTempoMedioPorServico = () => {
    const tempos: Record<string, number[]> = {};

    tarefas.forEach((t) => {
      if (!dataInicio || !dataFim) return;
      const criada = new Date(t.created_at);
      if (criada < dataInicio || criada > dataFim) return;

      if (!t.servico_id) return;

      if (!tempos[t.servico_id]) {
        tempos[t.servico_id] = [];
      }

      const minutos = sessoes
        .filter((sess) => sess.tarefa_id === t.id)
        .reduce((sum, sess) => {
          const fim = sess.data_fim ? new Date(sess.data_fim) : new Date();
          const inicio = new Date(sess.data_inicio);
          return sum + (fim.getTime() - inicio.getTime()) / 1000 / 60;
        }, 0);

      if (minutos > 0) {
        tempos[t.servico_id].push(minutos);
      }
    });

    return Object.entries(tempos).map(([servicoId, minutosArray]) => ({
      servicoId,
      media: (minutosArray.reduce((a, b) => a + b, 0) / minutosArray.length / 60).toFixed(2),
      total: minutosArray.length,
    }));
  };

  const cargaPorPessoa = calcularCargaPorPessoa();
  const temposPorServico = calcularTempoMedioPorServico();

  const gargalos = cargaPorPessoa.filter((c) => parseFloat(c.horas) > 24);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">📊 Métricas Operacionais</h1>
          <p className="text-slate-600">
            Últimos 7 dias: {dataInicio?.toLocaleDateString('pt-BR')} a{' '}
            {dataFim?.toLocaleDateString('pt-BR')}
          </p>
        </div>

        {/* Gargalos */}
        {gargalos.length > 0 && (
          <div className="bg-red-50 border border-red-300 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-red-900 mb-2">⚠️ Gargalos Detectados</h3>
                <ul className="text-sm text-red-700 space-y-1">
                  {gargalos.map((g) => (
                    <li key={g.id}>
                      Pessoa {g.id.slice(0, 8)} com {g.horas}h de carga (limite: 24h)
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Carga por Pessoa */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">👥 Carga de Trabalho</h2>

          {cargaPorPessoa.length === 0 ? (
            <p className="text-slate-500">Nenhum rastreamento de tempo neste período</p>
          ) : (
            <div className="space-y-3">
              {cargaPorPessoa.sort((a, b) => parseFloat(b.horas) - parseFloat(a.horas)).map((c) => (
                <div key={c.id} className="flex items-center gap-4">
                  <div className="w-40 text-sm font-medium text-slate-700 truncate">
                    {c.id.slice(0, 8)}...
                  </div>
                  <div className="flex-1">
                    <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full ${
                          parseFloat(c.horas) > 24
                            ? 'bg-red-500'
                            : parseFloat(c.horas) > 20
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min((parseFloat(c.horas) / 30) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-16 text-right">
                    <p className="text-sm font-semibold text-slate-900">{c.horas}h</p>
                    <p className="text-xs text-slate-500">{c.minutos}min</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tempo Médio por Serviço */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">⏱️ Tempo Médio por Serviço</h2>

          {temposPorServico.length === 0 ? (
            <p className="text-slate-500">Nenhum serviço com rastreamento de tempo</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2 px-4 font-semibold text-slate-900">Serviço</th>
                    <th className="text-right py-2 px-4 font-semibold text-slate-900">Tempo Médio</th>
                    <th className="text-right py-2 px-4 font-semibold text-slate-900">Tarefas</th>
                  </tr>
                </thead>
                <tbody>
                  {temposPorServico
                    .sort((a, b) => parseFloat(b.media) - parseFloat(a.media))
                    .map((t) => (
                      <tr key={t.servicoId} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-4">{t.servicoId.slice(0, 8)}...</td>
                        <td className="py-3 px-4 text-right font-semibold">{t.media}h</td>
                        <td className="py-3 px-4 text-right text-slate-600">{t.total}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Cards de KPI */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-sm text-slate-600 mb-1">Total de Horas Rastreadas</p>
            <p className="text-2xl font-bold text-slate-900">
              {(
                cargaPorPessoa.reduce((sum, c) => sum + parseFloat(c.horas), 0) / cargaPorPessoa.length
              ).toFixed(1)}
              h
            </p>
            <p className="text-xs text-slate-500 mt-1">Média por pessoa</p>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-sm text-slate-600 mb-1">Pessoas Rastreando</p>
            <p className="text-2xl font-bold text-slate-900">{cargaPorPessoa.length}</p>
            <p className="text-xs text-slate-500 mt-1">Neste período</p>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-sm text-slate-600 mb-1">Serviços Rastreados</p>
            <p className="text-2xl font-bold text-slate-900">{temposPorServico.length}</p>
            <p className="text-xs text-slate-500 mt-1">Com tempo registrado</p>
          </div>
        </div>
      </div>
    </div>
  );
}
