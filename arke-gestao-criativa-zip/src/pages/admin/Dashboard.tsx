import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, Clock, CheckCircle2, AlertCircle, Plus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { fetchEstatisticasDashboard, fetchTodosCiclosAtivos } from '@/lib/supabase/queries';
import { format, endOfMonth, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TaskModal } from '@/components/tarefas/TaskModal';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useArkeStore } from '@/lib/store';

export default function AdminDashboard() {
  const { tarefas, clientes, timeMembers } = useArkeStore();
  const [stats, setStats] = useState<any>(null);
  const [ciclos, setCiclos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [dashStats, allCiclos] = await Promise.all([
          fetchEstatisticasDashboard(),
          fetchTodosCiclosAtivos()
        ]);
        setStats(dashStats);
        setCiclos(allCiclos);
      } catch (e: any) {
        toast.error('Erro ao carregar dados do dashboard.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const clientesKeep = clientes.filter(c => c.tipo === 'keep');
  
  // Tarefas vencendo hoje
  const hoje = new Date().toISOString().split('T')[0];
  const tarefasHoje = tarefas.filter(t => 
    t.data_vencimento && t.data_vencimento.startsWith(hoje) &&
    !['entregue', 'aprovado', 'arquivado'].includes(t.status)
  );

  return (
    <div className="space-y-6 pb-12">
      <TaskModal 
        tarefaId={selectedTaskId} 
        onClose={() => setSelectedTaskId(null)} 
      />

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">Visão geral da operação e capacidade criativa.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl bg-slate-200" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">MRR Ativo (Keep)</CardTitle>
              <CircleDollarSignIcon className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {(stats?.mrr_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              <p className="text-xs text-slate-400 mt-1 flex items-center">
                <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                Recorrente mensal
              </p>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Clientes Keep Ativos</CardTitle>
              <UsersIcon className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.clientes_keep_ativos || 0}</div>
              <p className="text-xs text-slate-400 mt-1">
                Contratos vigentes
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Em Andamento</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.tarefas_em_andamento || 0}</div>
              <p className="text-xs text-slate-400 mt-1">
                Tarefas com time
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Caixa de Triagem</CardTitle>
              <AlertCircle className={cn("h-4 w-4", (stats?.itens_triagem || 0) > 0 ? "text-red-500" : "text-green-500")} />
            </CardHeader>
            <CardContent>
              <div className={cn("text-2xl font-bold", (stats?.itens_triagem || 0) > 0 ? "text-red-500" : "")}>{stats?.itens_triagem || 0}</div>
              <p className="text-xs text-slate-400 mt-1">
                Aguardando análise
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Grid com Tarefas Hoje e Ciclos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Vencendo Hoje */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900 border-b pb-2">Tarefas Vencendo Hoje</h2>
          {tarefasHoje.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center">
              <CheckCircle2 className="h-8 w-8 text-slate-300 mb-2" />
               <p className="text-sm text-slate-500">Nenhuma tarefa vencendo hoje.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tarefasHoje.map(t => {
                const cliente = clientes.find(c => c.id === t.cliente_id);
                const responsavel = timeMembers.find(m => m.id === t.responsavel_id);
                return (
                  <div key={t.id} onClick={() => setSelectedTaskId(t.id)} className="bg-white border border-slate-200 p-3 rounded-xl shadow-sm hover:shadow transition-shadow cursor-pointer flex justify-between items-center group">
                    <div className="overflow-hidden pr-2">
                       <h4 className="text-sm font-semibold text-slate-800 truncate group-hover:text-blue-600 transition-colors">{t.titulo}</h4>
                       <div className="flex items-center text-xs mt-1 text-slate-500 gap-2">
                          <span className="truncate">{cliente?.nome || 'Sem cliente'}</span>
                       </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                       <Badge variant="outline" className="text-[10px] capitalize whitespace-nowrap bg-slate-50">{t.status.replace('_', ' ')}</Badge>
                       {responsavel ? (
                         <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold border border-blue-200" title={responsavel.nome}>
                            {responsavel.nome.charAt(0)}
                         </div>
                       ) : (
                         <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-[10px] font-bold border border-slate-200">
                            ?
                         </div>
                       )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Clientes Keep - Saúde do Ciclo */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900 border-b pb-2">Saúde dos Ciclos (Créditos)</h2>
          {loading ? (
             <Skeleton className="h-48 w-full rounded-xl bg-slate-200" />
          ) : clientesKeep.length === 0 ? (
             <div className="text-slate-500 text-sm py-4">Nenhum cliente Keep encontrado.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {clientesKeep.map(cliente => {
                const ciclo = ciclos.find(c => c.cliente_id === cliente.id);
                
                if (!ciclo) {
                  return (
                    <Card key={cliente.id} className="shadow-sm border-slate-200 bg-slate-50">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded shadow-sm text-white flex items-center justify-center font-bold text-lg" style={{ backgroundColor: cliente.cor_tema || '#94a3b8' }}>
                                {cliente.nome.charAt(0)}
                              </div>
                              <div>
                                <h3 className="font-semibold text-slate-900">{cliente.nome}</h3>
                              </div>
                           </div>
                           <Badge variant="outline" className="bg-slate-100 text-slate-500 border-slate-200">Sem ciclo</Badge>
                        </div>
                        <div className="mt-4 flex justify-between items-center text-sm">
                           <span className="text-slate-500">Aguardando renovação</span>
                           <Button size="sm" variant="ghost" className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 font-medium">
                             <Plus className="w-3.5 h-3.5 mr-1" /> Criar ciclo
                           </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                }

                const porcentagem = (ciclo.creditos_usados / ciclo.creditos_disponiveis) * 100;
                const estaAcabando = (ciclo.creditos_restantes / ciclo.creditos_disponiveis) < 0.2;
                
                return (
                  <Card key={cliente.id} className="shadow-sm border-slate-200 hover:border-blue-200 transition-colors group">
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded shadow-sm text-white flex items-center justify-center font-bold text-lg" style={{ backgroundColor: cliente.cor_tema || '#2563EB' }}>
                            {cliente.nome.charAt(0)}
                          </div>
                          <div className="w-32">
                            <h3 className="font-semibold text-slate-900 truncate">{cliente.nome}</h3>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">Renova {format(endOfMonth(new Date()), 'dd/MM')}</p>
                          </div>
                        </div>
                        {estaAcabando ? (
                          <Badge variant="destructive" className="text-[10px]">Baixo</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-200">Saudável</Badge>
                        )}
                      </div>
                      
                      <div className="space-y-1 mt-4">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium text-slate-900">{ciclo.creditos_restantes}<span className="text-slate-500 font-normal ml-1">restantes</span></span>
                          <span className="text-slate-500 text-xs font-medium">{ciclo.creditos_usados} / {ciclo.creditos_disponiveis} <span className="font-normal opacity-75">usados</span></span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden shadow-inner">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ease-out ${estaAcabando ? 'bg-red-500' : 'bg-blue-600 group-hover:bg-blue-500'}`} 
                            style={{ width: `${Math.min(porcentagem, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CircleDollarSignIcon(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/></svg>
}
function UsersIcon(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
}
