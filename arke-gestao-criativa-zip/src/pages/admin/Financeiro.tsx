import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CircleDollarSign, CheckCircle2, Download, AlertCircle } from 'lucide-react';
import { useArkeStore } from '@/lib/store';
import { toast } from 'sonner';
import { fetchAvulsosACobrar, fetchContratosKeepAtivos, marcarTarefaComoCobrada } from '@/lib/supabase/queries';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

export default function AdminFinanceiro() {
  const [avulsos, setAvulsos] = useState<any[]>([]);
  const [contratos, setContratos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [dataAvulsos, dataContratos] = await Promise.all([
        fetchAvulsosACobrar(),
        fetchContratosKeepAtivos()
      ]);
      setAvulsos(dataAvulsos);
      setContratos(dataContratos);
    } catch (error: any) {
      toast.error('Erro ao carregar dados financeiros.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const mrTotal = contratos.reduce((sum, c) => sum + (Number(c.valor_mensal) || 0), 0);
  
  // Agrupar avulsos por cliente
  const avulsosGroupedArray = useMemo(() => {
    const map = new Map<string, { clienteNome: string; totalValor: number; tarefas: any[] }>();
    avulsos.forEach(t => {
      const g = map.get(t.cliente_id) || { clienteNome: t.cliente?.nome || 'Desconhecido', totalValor: 0, tarefas: [] };
      g.tarefas.push(t);
      g.totalValor += (Number(t.valor_avulso) || 0);
      map.set(t.cliente_id, g);
    });
    return Array.from(map.values()).sort((a, b) => b.totalValor - a.totalValor);
  }, [avulsos]);

  const valorAvulsoTotal = avulsos.reduce((sum, t) => sum + (Number(t.valor_avulso) || 0), 0);

  const handleMarcarCobrado = async (id: string) => {
    try {
      await marcarTarefaComoCobrada(id);
      toast.success('Tarefa marcada como cobrada!');
      setAvulsos(prev => prev.filter(t => t.id !== id));
    } catch (e) {
      toast.error('Erro ao atualizar tarefa.');
    }
  };

  const handleExportar = () => {
    const rows = [
      ['cliente', 'tarefa', 'creditos', 'valor_avulso'],
      ...avulsos.map((t) => [
        t.cliente?.nome || 'Desconhecido',
        t.titulo || '',
        String(t.creditos_cobrados || 0),
        String(Number(t.valor_avulso) || 0),
      ]),
    ];

    const csv = rows
      .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `arke-avulsos-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Relatório CSV exportado.');
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Financeiro</h1>
          <p className="text-sm text-slate-500">Relatório de MRR e créditos avulsos a cobrar.</p>
        </div>
        <Button variant="outline" className="h-9 px-4 font-medium" onClick={handleExportar} disabled={loading || avulsos.length === 0}>
          <Download className="w-4 h-4 mr-2" /> Exportar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-sm border-slate-200 bg-blue-600 text-white border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-100">MRR Total (Keep)</CardTitle>
            <CircleDollarSign className="h-4 w-4 text-blue-100" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-32 bg-blue-500 rounded" /> : (
               <div className="text-3xl font-bold">R$ {mrTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            )}
            <p className="text-xs text-blue-200 mt-1">Recorrente garantido por mês</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Avulsos Pendentes</CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-32 bg-slate-200 rounded" /> : (
              <div className="text-3xl font-bold text-slate-900">R$ {valorAvulsoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            )}
            <p className="text-xs text-slate-400 mt-1">Aguardando geração de fatura</p>
          </CardContent>
        </Card>
      </div>

      {/* Avulsos a Cobrar */}
      <h2 className="text-lg font-semibold text-slate-900 mt-8 mb-4">Avulsos a Cobrar</h2>
      {loading ? (
        <Card className="p-6"><Skeleton className="h-24 w-full bg-slate-100 rounded-lg" /></Card>
      ) : avulsosGroupedArray.length === 0 ? (
        <Card className="border-slate-200 shadow-sm border-dashed bg-slate-50">
          <CardContent className="flex flex-col items-center justify-center p-8 text-center text-slate-500">
            <CheckCircle2 className="w-12 h-12 text-green-500 mb-4" />
            <p className="font-medium text-slate-900 mb-1">Nenhum avulso pendente de cobrança.</p>
            <p className="text-sm max-w-sm">Todas as atividades extras foram faturadas ou não há pendências.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {avulsosGroupedArray.map(group => (
             <Card key={group.clienteNome} className="shadow-sm border-slate-200">
                <CardHeader className="bg-slate-50 border-b py-3 px-5 flex flex-row items-center justify-between">
                   <CardTitle className="text-base text-slate-900 font-semibold flex items-center">
                      <div className="w-6 h-6 rounded bg-slate-200 text-slate-600 text-center text-xs font-bold leading-6 mr-3">
                         {group.clienteNome.charAt(0)}
                      </div>
                      {group.clienteNome}
                   </CardTitle>
                   <div className="font-bold text-slate-800">
                      R$ {group.totalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                   </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-slate-100">
                     {group.tarefas.map((t) => (
                        <div key={t.id} className="flex justify-between items-center p-4 hover:bg-slate-50 transition-colors">
                           <div>
                              <p className="font-medium text-slate-800 text-sm">{t.titulo}</p>
                              <p className="text-xs text-slate-500 mt-0.5 max-w-[200px] sm:max-w-md truncate">
                                 Créditos avulsos requeridos: {t.creditos_cobrados || 0}
                              </p>
                           </div>
                           <div className="flex items-center gap-4">
                              <span className="font-semibold text-sm text-slate-700">R$ {(Number(t.valor_avulso) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                              <Button variant="outline" size="sm" onClick={() => handleMarcarCobrado(t.id)} className="h-8 text-xs font-semibold text-green-700 bg-green-50 border-green-200 hover:bg-green-100 hover:text-green-800">
                                Marcar como cobrado
                              </Button>
                           </div>
                        </div>
                     ))}
                  </div>
                </CardContent>
             </Card>
          ))}
        </div>
      )}

      {/* Resumo de Contratos Keep */}
      <h2 className="text-lg font-semibold text-slate-900 mt-10 mb-4">Contratos Keep Ativos</h2>
      {loading ? (
        <Card className="p-6"><Skeleton className="h-48 w-full bg-slate-100 rounded-lg" /></Card>
      ) : contratos.length === 0 ? (
        <Card className="border-slate-200 shadow-sm border-dashed bg-slate-50">
          <CardContent className="flex flex-col items-center justify-center p-8 text-center text-slate-500">
            <p className="font-medium text-slate-900 mb-1">Nenhum contrato ativo.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-sm border-slate-200 overflow-hidden">
           <div className="overflow-x-auto">
             <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-600 font-medium border-b">
                   <tr>
                      <th className="px-5 py-3 rounded-tl-lg">Cliente</th>
                      <th className="px-5 py-3">Plano/Contrato</th>
                      <th className="px-5 py-3">Renovação</th>
                      <th className="px-5 py-3 text-right">Créditos Base</th>
                      <th className="px-5 py-3 text-right rounded-tr-lg">Valor Mensal</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                   {contratos.map(c => (
                     <tr key={c.id} className="hover:bg-slate-50/50">
                        <td className="px-5 py-4 font-medium text-slate-900">{c.cliente?.nome || 'Desconhecido'}</td>
                        <td className="px-5 py-4 text-slate-600">{c.nome}</td>
                        <td className="px-5 py-4 text-slate-600">Dia {c.data_renovacao ? new Date(c.data_renovacao).getDate() : '1'}</td>
                        <td className="px-5 py-4 text-right">{c.creditos_mensais}</td>
                        <td className="px-5 py-4 text-right font-medium text-slate-900">R$ {(Number(c.valor_mensal) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                     </tr>
                   ))}
                </tbody>
                <tfoot className="bg-blue-50 border-t border-blue-100 text-blue-900 font-bold">
                   <tr>
                      <td colSpan={4} className="px-5 py-4 text-right uppercase tracking-wider text-xs">Total MRR</td>
                      <td className="px-5 py-4 text-right text-base text-blue-700">R$ {mrTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                   </tr>
                </tfoot>
             </table>
           </div>
        </Card>
      )}

    </div>
  );
}
