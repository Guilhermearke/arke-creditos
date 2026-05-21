# Arke Keep - Sistema de Créditos

## Status Atual (Fase 1)

✅ **Estrutura completa do Next.js 14**
- TypeScript + Tailwind CSS + shadcn/ui
- App Router com estrutura de pastas conforme spec
- Middleware de autenticação por role

✅ **Autenticação**
- Página de login funcional
- Proteção de rotas por role (admin, cliente, time)
- Integração com Supabase Auth

✅ **Painel Admin (básico)**
- Dashboard com cards de estatísticas
- Listagem de clientes
- Navegação para seções (Serviços, Entregas, Time)

✅ **Estrutura do Banco de Dados**
- Schema SQL pronto (em SETUP.md)
- Tipos TypeScript definidos
- RLS policies configuradas

## Servidor de Desenvolvimento

```bash
npm run dev
# Acessa: http://localhost:3000
```

## Próximos Passos (CRÍTICO)

### 1. Criar Projeto Supabase
1. Vá para [supabase.com](https://supabase.com)
2. Crie conta e novo projeto
3. Copie o `Project URL` e `Anon Key`

### 2. Configurar Banco de Dados
No Supabase, vá para **SQL Editor** e rode o script em `SETUP.md`

### 3. Configurar Credenciais
Preencha `.env.local` com suas credenciais do Supabase:
```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. Criar Usuário Admin
No Supabase:
- **Authentication > Users** → Adicionar novo usuário
- Email: seu@email.com
- Password: senha segura
- Depois, no SQL Editor, rode:
```sql
INSERT INTO profiles (id, nome, role) 
VALUES ((SELECT id FROM auth.users WHERE email = 'seu@email.com'), 'Guilherme', 'admin');
```

### 5. Testar Login
- Acesse http://localhost:3000
- Será redirecionado para `/auth/login`
- Faça login com suas credenciais
- Será redirecionado para `/admin/dashboard`

## Estrutura de Pastas

```
app/
  /(auth)
    /login          → Página de login
  /(admin)
    /dashboard      → Dashboard principal
    /clientes       → Listagem e CRUD de clientes
    /servicos       → Biblioteca de serviços
    /entregas       → Registrar entregas
    /time           → Membros do time
  /(cliente)
    /meu-painel     → Painel do cliente (em desenvolvimento)
  /(time)
    /tarefas        → Minhas tarefas (em desenvolvimento)

lib/
  supabase.ts       → Cliente Supabase
  types.ts          → Tipos TypeScript
```

## Tecnologias

- **Framework:** Next.js 14 (App Router)
- **Banco de Dados:** Supabase (PostgreSQL + Auth)
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui + Lucide Icons
- **Autenticação:** Supabase Auth
- **Hospedagem:** Pronto para Vercel

## Próxima Fase

Depois de configurar o Supabase, vamos implementar:
- [ ] CRUD completo de clientes + contratos
- [ ] Criação automática de ciclos
- [ ] Modal de registrar entrega com débito de créditos
- [ ] Painel do cliente com saldo visual
- [ ] Painel do time com tarefas

## Contato

Qualquer dúvida, consulte o arquivo `SETUP.md` com instruções detalhadas.
