import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BriefcaseBusiness, CalendarDays, CheckCircle2, KanbanSquare, WalletCards } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TaskModal } from '@/components/tarefas/TaskModal';
import { cn } from '@/lib/utils';
import { useArkeStore } from '@/lib/store';

const statusLabel: Record<string, string> = {
  triagem: 'Triagem',
  backlog: 'Backlog',
  a_fazer: 'A fazer',
  em_andamento: 'Em andamento',
  em_revisao: 'Em revisão',
  aprovado: 'Aprovado',
  entregue: 'Entregue',
  arquivado: 'Arquivado',
};

export default function ClienteDetalhe() {
  const { clienteId } = useParams();
  const { clientes, tarefas, projetos } = useArkeStore();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const cliente = clientes.find((item) => item.id === clienteId);

  const tarefasCliente = useMemo(() => {
    return tarefas.filter((tarefa) => tarefa.cliente_id === clienteId);
  }, [tarefas, clienteId]);

  const projetosCliente = useMemo(() => {
    return projetos.filter((projeto) => projeto.cliente_id === clienteId);
  }, [projetos, clienteId]);

  if (!cliente) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
        <h1 className="text-xl font-bold text-slate-900">Cliente não encontrado</h1>
        <p className="mt-2 text-sm text-slate-500">Confira se o cliente ainda está cadastrado.</p>
        <Link
          to="/admin/clientes"
          className="mt-5 inline-flex h-8 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
        >
          Voltar para clientes
        </Link>
      </div>
    );
  }

  const creditosMensais = cliente.creditos_mensais || 0;
  const creditosUsados = cliente.creditos_usados || 0;
  const progresso = creditosMensais > 0 ? Math.min((creditosUsados / creditosMensais) * 100, 100) : 0;

  return (
    <div className="space-y-6">
      <TaskModal tarefaId={selectedTaskId} onClose={() => setSelectedTaskId(null)} />

      <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <Link to="/admin/clientes" className="mb-4 inline-flex items-center text-sm font-semibold text-slate-500 hover:text-slate-900">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Clientes
          </Link>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg border border-slate-200 bg-slate-50" style={{ backgroundColor: cliente.cor_tema }} />
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">{cliente.nome}</h1>
              <p className="text-sm text-slate-500">{cliente.empresa || cliente.email || 'Cliente Arke'}</p>
            </div>
          </div>
        </div>
        <Badge className="w-fit uppercase" variant="secondary">
          Plano {cliente.tipo}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-500">
              <WalletCards className="h-4 w-4" />
              Créditos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{Math.max(creditosMensais - creditosUsados, 0)}</div>
            <p className="mt-1 text-xs text-slate-500">{creditosUsados} usados de {creditosMensais}</p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-blue-600" style={{ width: `${progresso}%` }} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-500">
              <KanbanSquare className="h-4 w-4" />
              Tarefas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{tarefasCliente.length}</div>
            <p className="mt-1 text-xs text-slate-500">Demandas vinculadas ao cliente</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-500">
              <BriefcaseBusiness className="h-4 w-4" />
              Projetos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{projetosCliente.length}</div>
            <p className="mt-1 text-xs text-slate-500">Projetos ativos ou concluídos</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tarefas recentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {tarefasCliente.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                Nenhuma tarefa vinculada a este cliente.
              </p>
            ) : (
              tarefasCliente.slice(0, 8).map((tarefa) => (
                <button
                  key={tarefa.id}
                  onClick={() => setSelectedTaskId(tarefa.id)}
                  className="flex w-full items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3 text-left transition hover:border-blue-200 hover:bg-blue-50/40"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{tarefa.titulo}</p>
                    <p className="mt-1 text-xs text-slate-500">{tarefa.servico || 'Sem serviço definido'}</p>
                  </div>
                  <Badge variant="outline" className="shrink-0 capitalize">
                    {statusLabel[tarefa.status] || tarefa.status}
                  </Badge>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Projetos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {projetosCliente.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                Nenhum projeto cadastrado.
              </p>
            ) : (
              projetosCliente.map((projeto) => (
                <div key={projeto.id} className="rounded-lg border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{projeto.nome}</h3>
                      <p className="mt-1 text-xs text-slate-500">{projeto.tipo || 'Projeto'}</p>
                    </div>
                    <Badge variant="secondary" className="capitalize">{projeto.status}</Badge>
                  </div>
                  {projeto.data_prazo ? (
                    <p className={cn('mt-3 flex items-center text-xs text-slate-500')}>
                      <CalendarDays className="mr-2 h-3.5 w-3.5" />
                      Prazo {new Date(projeto.data_prazo).toLocaleDateString('pt-BR')}
                    </p>
                  ) : null}
                  {projeto.status === 'aprovado' ? (
                    <p className="mt-3 flex items-center text-xs font-semibold text-green-700">
                      <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
                      Aprovado pelo cliente
                    </p>
                  ) : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
