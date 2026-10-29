// @ts-nocheck
'use client';

import { useEffect, useState } from 'react';
import { useArkeStore } from '@/lib/store';
import { toast } from 'sonner';
import { Plus, Edit, Trash2 } from 'lucide-react';
import CreateProjectModal from '@/components/projetos/CreateProjectModal';
import ProjectDetail from '@/components/projetos/ProjectDetail';

export default function ProjetosPage() {
  const { clientes, projetos, carregarDadosIniciais, adicionarProjeto } = useArkeStore();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedClienteId, setSelectedClienteId] = useState<string>('');
  const [selectedProjetoId, setSelectedProjetoId] = useState<string | null>(null);

  useEffect(() => {
    carregarDadosIniciais();
  }, [carregarDadosIniciais]);

  const clientesComProjetos = clientes.map((cliente) => ({
    ...cliente,
    projetosList: projetos.filter((p) => p.cliente_id === cliente.id),
  }));

  const handleCreateProject = async (projeto: any) => {
    try {
      await adicionarProjeto(projeto);
      toast.success('Projeto criado com sucesso!');
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error('Erro ao criar projeto:', error);
      toast.error('Erro ao criar projeto');
    }
  };

  if (selectedProjetoId) {
    return <ProjectDetail projetoId={selectedProjetoId} onBack={() => setSelectedProjetoId(null)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Projetos</h1>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Novo Projeto
          </button>
        </div>

        {clientesComProjetos.length === 0 ? (
          <div className="bg-white rounded-lg p-12 text-center text-slate-500">
            <p>Nenhum cliente cadastrado ainda</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {clientesComProjetos
              .filter((c) => c.projetosList.length > 0)
              .map((cliente) => (
                <div key={cliente.id} className="bg-white rounded-lg p-6 shadow-sm">
                  <h2 className="text-xl font-semibold text-slate-900 mb-4">{cliente.nome}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {cliente.projetosList.map((projeto) => (
                      <div
                        key={projeto.id}
                        onClick={() => setSelectedProjetoId(projeto.id)}
                        className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg cursor-pointer hover:shadow-md transition-shadow border border-blue-200"
                      >
                        <h3 className="font-semibold text-slate-900 mb-2">{projeto.nome}</h3>
                        <p className="text-sm text-slate-600 mb-3">{projeto.descricao}</p>
                        <div className="flex justify-between items-center text-xs">
                          <span className="bg-blue-200 text-blue-800 px-2 py-1 rounded">
                            {projeto.status}
                          </span>
                          <span className="text-slate-500">
                            {projeto.tipo || 'keep'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

            {clientesComProjetos.filter((c) => c.projetosList.length === 0).length > 0 && (
              <div className="bg-white rounded-lg p-6 shadow-sm text-slate-500 text-center">
                <p>
                  {clientesComProjetos.filter((c) => c.projetosList.length === 0).length} cliente(s) sem projetos
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        clientes={clientes}
        onSuccess={handleCreateProject}
      />
    </div>
  );
}
