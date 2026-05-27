/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Layouts
import AdminLayout from './layouts/AdminLayout';
import TimeLayout from './layouts/TimeLayout';
import ClienteLayout from './layouts/ClienteLayout';

// Pages
import Login from './pages/Login';
import AdminDashboard from './pages/admin/Dashboard';
import AdminTriagem from './pages/admin/Triagem';
import Producao from './pages/admin/Producao';
import AdminKanban from './pages/admin/Kanban';
import AdminClientes from './pages/admin/Clientes';
import ClienteDetalhe from './pages/admin/ClienteDetalhe';
import AdminProjetos from './pages/admin/Projetos';
import AdminFinanceiro from './pages/admin/Financeiro';
import AdminConfiguracoes from './pages/admin/Configuracoes';
import ClientePainel from './pages/cliente/Painel';
import MinhasTarefas from './pages/time/MinhasTarefas';
import PerfilTime from './pages/time/Perfil';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="triagem" element={<AdminTriagem />} />
            <Route path="clientes" element={<AdminClientes />} />
            <Route path="clientes/:clienteId" element={<ClienteDetalhe />} />
            <Route path="kanban" element={<AdminKanban />} />
            <Route path="producao" element={<Producao />} />
            <Route path="projetos" element={<AdminProjetos />} />
            <Route path="financeiro" element={<AdminFinanceiro />} />
            <Route path="configuracoes" element={<AdminConfiguracoes />} />
          </Route>

          {/* Time Routes */}
          <Route path="/time" element={
            <ProtectedRoute allowedRoles={['time']}>
              <TimeLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/time/tarefas" replace />} />
            <Route path="tarefas" element={<MinhasTarefas />} />
            <Route path="projetos" element={<AdminProjetos />} />
            <Route path="perfil" element={<PerfilTime />} />
          </Route>

          {/* Cliente Routes */}
          <Route path="/cliente" element={
            <ProtectedRoute allowedRoles={['cliente']}>
              <ClienteLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/cliente/painel" replace />} />
            <Route path="painel" element={<ClientePainel />} />
          </Route>

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
