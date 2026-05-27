import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase/client';
import type { Role } from '../lib/auth-routes';

interface AuthContextType {
  user: User | null;
  role: Role | null;
  clienteId: string | null;
  clienteCorTema: string | null;
  profileId: string | null;
  loading: boolean;
  profileError: string | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  clienteId: null,
  clienteCorTema: null,
  profileId: null,
  loading: true,
  profileError: null,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [clienteId, setClienteId] = useState<string | null>(null);
  const [clienteCorTema, setClienteCorTema] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const resetProfile = () => {
      setRole(null);
      setProfileId(null);
      setClienteId(null);
      setClienteCorTema(null);
      setProfileError(null);
    };

    const loadProfile = async (currentUser: User) => {
      resetProfile();

      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          role,
          cliente_id,
          cliente:clientes(cor_tema)
        `)
        .eq('id', currentUser.id)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data?.role) {
        setProfileError('Usuário autenticado, mas sem perfil de acesso configurado.');
        return;
      }

      setProfileId(data.id);
      setRole(data.role as Role);
      setClienteId(data.cliente_id);

      if (data.cliente && !Array.isArray(data.cliente)) {
        setClienteCorTema((data.cliente as any).cor_tema);
      } else if (Array.isArray(data.cliente) && data.cliente.length > 0) {
        setClienteCorTema((data.cliente[0] as any).cor_tema);
      }
    };

    const applySession = async (currentUser: User | null) => {
      try {
        if (!mounted) return;
        setLoading(true);
        setUser(currentUser);

        if (currentUser) {
          await loadProfile(currentUser);
        } else {
          resetProfile();
        }
      } catch (error) {
        console.error('Error checking auth state:', error);
        setProfileError('Não foi possível carregar o perfil de acesso.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      applySession(session?.user ?? null);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      await applySession(session?.user ?? null);
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    resetAuthState();
    await supabase.auth.signOut();
  };

  const resetAuthState = () => {
    setUser(null);
    setRole(null);
    setProfileId(null);
    setClienteId(null);
    setClienteCorTema(null);
    setProfileError(null);
  };

  return (
    <AuthContext.Provider value={{ user, role, profileId, clienteId, clienteCorTema, loading, profileError, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
