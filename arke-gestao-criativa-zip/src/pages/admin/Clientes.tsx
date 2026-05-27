import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useArkeStore } from '../../lib/store';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Settings, ExternalLink, MoreVertical, Users } from 'lucide-react';
import { CreateClienteModal } from '@/components/clientes/CreateClienteModal';

export default function AdminClientes() {
  const { clientes } = useArkeStore();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <CreateClienteModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Clientes Ativos</h1>
          <p className="text-sm text-slate-500 mt-1">Gestão de contratos, configurações de painel e integrações.</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="bg-[#2563EB] hover:bg-blue-700 text-white font-medium px-4 py-2 text-sm rounded-md transition-colors border border-blue-700 shadow-sm active:scale-95">
          + Novo Cliente
        </button>
      </div>

      {clientes.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-slate-200 border-dashed text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Nenhum cliente cadastrado ainda.</h2>
          <p className="text-slate-500 mt-2 max-w-sm mb-6">
            Adicione o seu primeiro cliente para começar a gerenciar contratos, integrações e entregas.
          </p>
          <button onClick={() => setModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 text-sm rounded-md transition-colors shadow-sm">
            Adicionar o primeiro cliente
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clientes.map(cliente => (
            <Card key={cliente.id} className="relative overflow-hidden border-slate-200 shadow-sm hover:shadow-md transition-all group">
              <div className="h-1.5 w-full absolute top-0" style={{backgroundColor: cliente.cor_tema}}></div>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{cliente.nome}</h3>
                    <Badge variant="secondary" className="mt-2 text-xs uppercase cursor-default bg-slate-100 text-slate-600 font-semibold tracking-wider">Plano {cliente.tipo}</Badge>
                  </div>
                  <Link to={`/admin/clientes/${cliente.id}`} className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-100 transition-colors">
                    <MoreVertical className="w-5 h-5" />
                  </Link>
                </div>
  
                {cliente.tipo === 'keep' && (
                  <div className="space-y-3 bg-slate-50 border border-slate-100 rounded-lg p-4 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Créditos Restantes</span>
                      <span className="font-bold text-slate-900">{cliente.creditos_restantes} cr</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5">
                      <div 
                        className="h-1.5 rounded-full bg-blue-600 transition-all duration-1000" 
                        style={{ width: `${Math.min((cliente.creditos_usados / cliente.creditos_mensais) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>{cliente.creditos_usados} usados</span>
                      <span>Total: {cliente.creditos_mensais}</span>
                    </div>
                  </div>
                )}
  
                <div className="flex justify-between items-center border-t border-slate-100 pt-4">
                  <Link to="/admin/configuracoes" className="text-xs font-semibold text-slate-500 hover:text-blue-600 uppercase tracking-wider flex items-center gap-1 transition-colors">
                    <Settings className="w-4 h-4" /> Integrações
                  </Link>
                  <Link to={`/admin/clientes/${cliente.id}`} className="text-xs font-semibold text-slate-500 hover:text-blue-600 uppercase tracking-wider flex items-center gap-1 transition-colors">
                    Ver detalhes <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
