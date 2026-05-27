export type Role = 'admin' | 'time' | 'cliente';

export const ROLE_HOME: Record<Role, string> = {
  admin: '/admin/dashboard',
  time: '/time/tarefas',
  cliente: '/cliente/painel',
};

export function getRoleHome(role: Role | null) {
  return role ? ROLE_HOME[role] : null;
}
