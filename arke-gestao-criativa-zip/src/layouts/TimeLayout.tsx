import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Bell, FolderKanban, UserCircle, LogOut, CheckSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useArkeStore } from '@/lib/store';
import { useEffect, useMemo } from 'react';

export default function TimeLayout() {
  const { signOut, profileId } = useAuth();
  const location = useLocation();
  const { tarefas, carregarDadosIniciais } = useArkeStore();

  useEffect(() => {
    carregarDadosIniciais();
  }, [carregarDadosIniciais]);

  const emRevisaoCount = useMemo(() => {
    return tarefas.filter(t => t.responsavel_id === profileId && t.status === 'em_revisao').length;
  }, [tarefas, profileId]);

  const navItems = [
    { name: 'Minhas Tarefas', path: '/time/tarefas', icon: CheckSquare, badge: emRevisaoCount },
    { name: 'Projetos', path: '/time/projetos', icon: FolderKanban },
    { name: 'Perfil', path: '/time/perfil', icon: UserCircle },
  ];

  return (
    <div className="flex bg-[#F9F9F7] min-h-screen font-sans text-slate-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col fixed inset-y-0 z-10">
        <div className="p-6">
          <h1 className="text-2xl font-bold tracking-tight text-blue-600">Arke</h1>
          <p className="text-xs text-slate-500 font-medium tracking-wide uppercase mt-1">Time</p>
        </div>
        
        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.name}
                to={item.path}
                className={cn(
                  "flex items-center justify-between px-3 py-2.5 rounded-md text-sm font-medium transition-colors cursor-pointer",
                  isActive 
                    ? "bg-blue-50 text-blue-700" 
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <div className="flex items-center">
                  <item.icon className={cn("w-5 h-5 mr-3", isActive ? "text-blue-600" : "text-slate-400")} />
                  {item.name}
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                   <span className="bg-orange-100 text-orange-700 py-0.5 px-2 rounded-full text-xs font-bold">
                     {item.badge}
                   </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200">
          <Button variant="ghost" className="w-full justify-start text-slate-600" onClick={signOut}>
            <LogOut className="w-5 h-5 mr-3 text-slate-400" />
            Sair
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8 overflow-hidden h-screen flex flex-col">
        <div className="max-w-7xl mx-auto w-full flex-1">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
