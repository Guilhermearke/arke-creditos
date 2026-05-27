import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useArkeStore } from '@/lib/store';

export default function ClienteLayout() {
  const { signOut, clienteId, clienteCorTema } = useAuth();
  const { clientes, carregarDadosIniciais } = useArkeStore();

  useEffect(() => {
    carregarDadosIniciais();
  }, [carregarDadosIniciais]);
  
  const cliente = clientes.find(c => c.id === clienteId);
  const corTema = clienteCorTema || cliente?.cor_tema || '#2563EB';

  const style = {
    '--cliente-accent': corTema,
  } as React.CSSProperties;

  return (
    <div className="bg-[#F9F9F7] min-h-screen font-sans text-slate-900 flex flex-col" style={style}>
      {/* Header Fixo */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 h-16 flex items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          <span className="font-bold text-xl text-slate-400">Arke</span>
          <div className="w-px h-6 bg-slate-200"></div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center font-bold text-sm" style={{ color: 'var(--cliente-accent)' }}>
              {cliente?.nome?.charAt(0) || 'C'}
            </div>
            <span className="font-medium text-slate-900 hidden sm:inline-block">{cliente?.nome || 'Área do Cliente'}</span>
          </div>
        </div>

        <Button variant="ghost" size="sm" onClick={signOut} className="text-slate-500 hover:text-slate-900">
          <LogOut className="w-4 h-4 sm:mr-2" />
          <span className="hidden sm:inline-block">Sair</span>
        </Button>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto pb-20 md:pb-0">
          <Outlet />
        </div>
      </main>
      
      {/* Mobile Bottom Navigation (if there are navigation links needed later) */}
    </div>
  );
}
