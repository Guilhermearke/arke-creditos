import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '../contexts/AuthContext';
import { getRoleHome } from '@/lib/auth-routes';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const { user, role, loading: authLoading, profileError, signOut } = useAuth();

  const isConfigured = !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY;

  useEffect(() => {
    const home = getRoleHome(role);
    if (user && !authLoading && home) {
      navigate(home, { replace: true });
    }
  }, [user, role, authLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (!data?.session) {
        setError('Sessão não criada. Verifique confirmação de e-mail.');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-[#F9F9F7] flex items-center justify-center p-4 font-sans">
      <Card className="w-full max-w-md shadow-lg border-0 ring-1 ring-slate-200">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold tracking-tight text-blue-600">Arke</CardTitle>
          <CardDescription className="text-slate-500">
            Sistema de Gestão Criativa
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isConfigured ? (
            <div className="bg-amber-50 text-amber-800 p-4 rounded-md text-sm mb-6 border border-amber-200">
              <p className="font-semibold mb-2">Supabase não configurado!</p>
              <p>Para usar o sistema Arke, configure as variáveis <strong>VITE_SUPABASE_URL</strong> e <strong>VITE_SUPABASE_ANON_KEY</strong> no painel de segredos ou no arquivo .env local.</p>
              <p className="mt-2 text-xs opacity-80">Você também precisa rodar o arquivo <code>schema.sql</code> no seu banco de dados.</p>
            </div>
          ) : null}

          {user && !authLoading && profileError ? (
            <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <p className="font-semibold">Perfil de acesso não encontrado</p>
              <p className="mt-1">{profileError}</p>
              <Button type="button" variant="outline" className="mt-3 w-full" onClick={signOut}>
                Sair e tentar outro login
              </Button>
            </div>
          ) : null}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="email">
                E-mail
              </label>
              <Input
                id="email"
                type="email"
                placeholder="nome@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="password">
                Senha
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

            <Button className="w-full bg-blue-600 hover:bg-blue-700" type="submit" disabled={loading || !isConfigured}>
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col text-center text-sm text-slate-500 pb-6">
          <p>Login restrito para membros e clientes Arke.</p>
        </CardFooter>
      </Card>
    </div>
  );
}
