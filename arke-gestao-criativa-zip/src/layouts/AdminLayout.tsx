import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useArkeStore } from '../lib/store';
import { 
  Bell, 
  LayoutDashboard, 
  Users, 
  Kanban, 
  KanbanSquare, 
  Settings, 
  LogOut, 
  CheckCircle2, 
  ListTodo, 
  Presentation, 
  CircleDollarSign,
  Menu,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

import { buscarCardsTrelloNovos } from '@/lib/trello/poller';

export default function AdminLayout() {
  const { signOut } = useAuth();
  const location = useLocation();
  const { triagemItens, carregarDadosIniciais } = useArkeStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Fecha sidebar no mobile ao mudar de rota
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Realtime subscription para triagem_itens
  useEffect(() => {
    carregarDadosIniciais();

    // Polling Trello a cada 5 minutos
    buscarCardsTrelloNovos().catch(console.error);
    const trelloInterval = setInterval(() => {
      buscarCardsTrelloNovos().catch(console.error);
    }, 5 * 60 * 1000);

    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'triagem_itens' }, payload => {
        useArkeStore.getState().adicionarTriagemItem(payload.new as any);
        toast.info(`Nova entrada na triagem (${payload.new.tipo})`);
      })
      .subscribe();

    return () => {
      clearInterval(trelloInterval);
      supabase.removeChannel(channel);
    };
  }, []);

  const pendentesTriagem = triagemItens.filter(t => t.status_triagem !== 'liberado').length;

  const navItems = [
    { name: 'Triagem', path: '/admin/triagem', icon: Bell, badge: pendentesTriagem > 0 ? pendentesTriagem : undefined },
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Clientes', path: '/admin/clientes', icon: Users },
    { name: 'Produção', path: '/admin/producao', icon: LayoutDashboard },
    { name: 'Projetos', path: '/admin/projetos', icon: Presentation },
    { name: 'Financeiro', path: '/admin/financeiro', icon: CircleDollarSign },
    { name: 'Configurações', path: '/admin/configuracoes', icon: Settings },
  ];

  return (
    <div className="flex bg-[#F9F9F7] min-h-screen font-sans text-slate-900">
      {/* Mobile Topbar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-20 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5 text-slate-600" />
          </Button>
          <h1 className="text-xl font-bold tracking-tight text-blue-600">Arke</h1>
        </div>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-30 lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "bg-white border-r border-slate-200 flex flex-col fixed inset-y-0 z-40 transition-transform duration-300 ease-in-out lg:translate-x-0 w-64",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 flex items-center justify-between lg:block">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-blue-600">Arke</h1>
            <p className="text-xs text-slate-500 font-medium tracking-wide uppercase mt-1">Admin</p>
          </div>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5 text-slate-500" />
          </Button>
        </div>
        
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.name}
                to={item.path}
                className={cn(
                  "flex items-center justify-between px-3 py-2.5 rounded-md text-sm font-medium transition-colors min-h-[44px]",
                  isActive 
                    ? "bg-blue-50 text-blue-700" 
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <div className="flex items-center">
                  <item.icon className={cn("w-5 h-5 mr-3", isActive ? "text-blue-600" : "text-slate-400")} />
                  {item.name}
                </div>
                {item.badge && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200">
          <Button variant="ghost" className="w-full justify-start text-slate-600 min-h-[44px]" onClick={signOut}>
            <LogOut className="w-5 h-5 mr-3 text-slate-400" />
            Sair
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 p-6 lg:p-8 mt-16 lg:mt-0 w-full overflow-x-hidden">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
