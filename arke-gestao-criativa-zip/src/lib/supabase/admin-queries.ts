// src/lib/supabase/admin-queries.ts
// ATENÇÃO: este arquivo usa SUPABASE_SERVICE_ROLE_KEY
// Nunca expor no frontend em produção — chamar via API route ou Edge Function

import { createClient } from '@supabase/supabase-js';

const supabaseAdminUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAdminKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

const getSupabaseAdmin = () => {
  if (!supabaseAdminKey) {
    throw new Error('VITE_SUPABASE_SERVICE_ROLE_KEY não configurada. Não é possível criar usuário.');
  }

  return createClient(supabaseAdminUrl, supabaseAdminKey);
};

export function gerarSenhaTemporaria(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sem caracteres ambíguos
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export async function criarAcessoCliente(email: string, clienteId: string, nome: string): Promise<{ senha: string }> {
  const supabaseAdmin = getSupabaseAdmin();
  const senha = gerarSenhaTemporaria();
  
  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true  // pular confirmação de email
  });
  
  if (authError) throw authError;
  
  if (authUser.user) {
    // Criar profile vinculado ao cliente
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authUser.user.id,
        nome: nome,
        role: 'cliente',
        cliente_id: clienteId
      });
    
    if (profileError) {
      console.error('Erro ao criar profile admin', profileError);
      // Tentativa de rollback da auth
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      throw profileError;
    }
  }
  
  return { senha };
}
