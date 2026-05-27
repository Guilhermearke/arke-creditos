import { Mail, UserCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useArkeStore } from '@/lib/store';

export default function PerfilTime() {
  const { user, profileId, role } = useAuth();
  const { timeMembers } = useArkeStore();

  const profile = timeMembers.find((member) => member.id === profileId);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Meu Perfil</h1>
        <p className="mt-1 text-sm text-slate-500">Informações da sua conta no painel do time.</p>
      </div>

      <Card className="border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <UserCircle className="h-5 w-5 text-blue-600" />
            Dados de acesso
          </CardTitle>
          <Badge variant="secondary" className="uppercase">{role || 'time'}</Badge>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Nome</p>
            <p className="mt-1 text-sm font-medium text-slate-900">{profile?.nome || user?.email || 'Membro do time'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Função</p>
            <p className="mt-1 text-sm font-medium text-slate-900">{profile?.funcao || 'Não informada'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">E-mail</p>
            <p className="mt-1 flex items-center gap-2 text-sm font-medium text-slate-900">
              <Mail className="h-4 w-4 text-slate-400" />
              {user?.email || 'E-mail não disponível'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
