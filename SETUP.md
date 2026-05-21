# Setup Arke Keep System

## 1. Criar Projeto Supabase

1. Vá para [supabase.com](https://supabase.com)
2. Crie uma conta ou faça login
3. Crie um novo projeto (escolha a região mais próxima)
4. Anote o `Project URL` e `Anon Key`

## 2. Configurar Banco de Dados

Na dashboard do Supabase, vá para **SQL Editor** e rode este script:

```sql
-- Create tables
CREATE TABLE profiles (
  id uuid references auth.users primary key,
  nome text not null,
  role text not null check (role in ('admin', 'cliente', 'time')),
  cliente_id uuid,
  created_at timestamptz default now()
);

CREATE TABLE clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  empresa text,
  email text,
  whatsapp text,
  ativo boolean default true,
  created_at timestamptz default now()
);

CREATE TABLE planos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  creditos_mensais integer not null,
  valor_mensal numeric(10,2) not null,
  valor_credito numeric(10,2),
  ativo boolean default true,
  created_at timestamptz default now()
);

CREATE TABLE contratos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references clientes(id) not null,
  plano_id uuid references planos(id),
  nome_plano text not null,
  creditos_mensais integer not null,
  valor_mensal numeric(10,2) not null,
  valor_credito_avulso numeric(10,2),
  creditos_acumulam boolean default false,
  ativo boolean default true,
  data_inicio date not null,
  data_renovacao date,
  observacoes text,
  created_at timestamptz default now()
);

CREATE TABLE ciclos (
  id uuid primary key default gen_random_uuid(),
  contrato_id uuid references contratos(id) not null,
  cliente_id uuid references clientes(id) not null,
  mes integer not null,
  ano integer not null,
  creditos_disponveis integer not null,
  creditos_usados integer default 0,
  creditos_restantes integer generated always as (creditos_disponveis - creditos_usados) stored,
  status text default 'ativo' check (status in ('ativo', 'encerrado')),
  created_at timestamptz default now(),
  unique(contrato_id, mes, ano)
);

CREATE TABLE servicos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  creditos integer not null,
  descricao text,
  categoria text,
  ativo boolean default true,
  created_at timestamptz default now()
);

CREATE TABLE entregas (
  id uuid primary key default gen_random_uuid(),
  ciclo_id uuid references ciclos(id) not null,
  cliente_id uuid references clientes(id) not null,
  servico_id uuid references servicos(id),
  nome text not null,
  creditos_cobrados integer not null,
  revisao boolean default false,
  creditos_extra integer default 0,
  responsavel_id uuid references profiles(id),
  status text default 'pendente' check (status in ('pendente', 'em_andamento', 'entregue', 'aprovado')),
  link_entrega text,
  observacoes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

CREATE TABLE historico_creditos (
  id uuid primary key default gen_random_uuid(),
  ciclo_id uuid references ciclos(id) not null,
  cliente_id uuid references clientes(id) not null,
  tipo text check (tipo in ('debito', 'credito', 'ajuste')),
  quantidade integer not null,
  motivo text,
  entrega_id uuid references entregas(id),
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- Inserir serviços iniciais
INSERT INTO servicos (nome, creditos, categoria) VALUES
('Criativo simples', 8, 'estático'),
('Variação de criativo', 1, 'estático'),
('Carrossel até 10 pg', 12, 'estático'),
('Carrossel +10 pg', 18, 'estático'),
('Vídeo até 30s', 18, 'vídeo'),
('Vídeo até 1min', 25, 'vídeo'),
('Vídeo até 2min', 35, 'vídeo'),
('Vídeo até 5min', 50, 'vídeo'),
('Motion até 30s', 50, 'motion'),
('Motion até 1min', 85, 'motion');

-- Inserir planos iniciais
INSERT INTO planos (nome, creditos_mensais, valor_mensal, valor_credito) VALUES
('Keep Essential', 250, 3000, 12),
('Keep Scale', 550, 6000, 10.91),
('Keep Boost', 1000, 10000, 10);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE contratos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ciclos ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE entregas ENABLE ROW LEVEL SECURITY;
ALTER TABLE historico_creditos ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Admin vê tudo
CREATE POLICY "admin_all" ON profiles FOR ALL USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "admin_clientes" ON clientes FOR ALL USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "admin_entregas" ON entregas FOR ALL USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- Cliente vê só seus dados
CREATE POLICY "cliente_own" ON clientes FOR SELECT USING (
  id = (SELECT cliente_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "cliente_own_entregas" ON entregas FOR SELECT USING (
  cliente_id = (SELECT cliente_id FROM profiles WHERE id = auth.uid())
);
```

## 3. Criar Usuário Admin

Na dashboard do Supabase, vá para **Authentication > Users** e crie um novo usuário com:
- Email: seu@email.com
- Password: uma senha segura

Depois, rode este SQL no SQL Editor para criar o perfil:

```sql
INSERT INTO profiles (id, nome, role) 
VALUES ((SELECT id FROM auth.users WHERE email = 'seu@email.com'), 'Guilherme', 'admin');
```

## 4. Configurar .env.local

Copie seu `Project URL` e `Anon Key` do Supabase e preencha:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 5. Rodar o Projeto

```bash
npm install
npm run dev
```

Acesse http://localhost:3000 e você será redirecionado para login.

## Próximos Passos

- [ ] Fase 1: Setup completo
- [ ] Fase 2: CRUD de clientes e entregas
- [ ] Fase 3: Painel cliente
- [ ] Fase 4: Painel time
