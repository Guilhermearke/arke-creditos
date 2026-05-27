import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getRoleHome, type Role } from '../lib/auth-routes';
import { Button } from './ui/button';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('admin' | 'time' | 'cliente')[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, role, loading, profileError, signOut } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando Arke...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9F9F7] p-4">
        <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
          <h1 className="text-xl font-bold text-slate-900">Acesso sem perfil</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {profileError || 'Seu login existe, mas ainda não está vinculado a um perfil admin, time ou cliente.'}
          </p>
          <Button className="mt-5" onClick={signOut}>
            Voltar para o login
          </Button>
        </div>
      </div>
    );
  }

  if (allowedRoles && !allowedRoles.includes(role as Role)) {
    return <Navigate to={getRoleHome(role) || '/login'} replace />;
  }

  return <>{children}</>;
}
