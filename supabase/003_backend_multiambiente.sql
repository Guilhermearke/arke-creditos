create extension if not exists pgcrypto;

create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  empresa text,
  email text,
  whatsapp text,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  cliente_id uuid references public.clientes(id) on delete set null,
  nome text not null,
  email text,
  role text not null default 'cliente',
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_role_check check (role in ('admin', 'cliente', 'time'))
);

create table if not exists public.planos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  creditos_mensais integer not null check (creditos_mensais >= 0),
  valor_mensal numeric(12,2) not null default 0,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.servicos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  categoria text not null default 'Geral',
  descricao text,
  creditos integer not null check (creditos > 0),
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contratos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  plano_id uuid references public.planos(id) on delete set null,
  nome_plano text not null,
  creditos_mensais integer not null check (creditos_mensais >= 0),
  valor_mensal numeric(12,2) not null default 0,
  valor_credito_avulso numeric(12,2) not null default 14,
  data_inicio date not null default current_date,
  data_fim date,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ciclos (
  id uuid primary key default gen_random_uuid(),
  contrato_id uuid not null references public.contratos(id) on delete cascade,
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  mes integer not null check (mes between 1 and 12),
  ano integer not null check (ano between 2000 and 2100),
  creditos_disponiveis integer not null default 0 check (creditos_disponiveis >= 0),
  creditos_usados integer not null default 0 check (creditos_usados >= 0),
  creditos_restantes integer not null default 0,
  status text not null default 'ativo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ciclos_status_check check (status in ('ativo', 'fechado', 'cancelado')),
  constraint ciclos_cliente_mes_ano_key unique (cliente_id, mes, ano)
);

create table if not exists public.entregas (
  id uuid primary key default gen_random_uuid(),
  ciclo_id uuid not null references public.ciclos(id) on delete cascade,
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  servico_id uuid references public.servicos(id) on delete set null,
  responsavel_id uuid references public.profiles(id) on delete set null,
  nome text not null,
  objetivo text,
  briefing text,
  formato text,
  canais text[] not null default '{}',
  referencias text,
  prazo date,
  prioridade text not null default 'media',
  link_briefing text,
  arquivos text,
  checklist jsonb not null default '[]'::jsonb,
  creditos_cobrados integer not null default 0 check (creditos_cobrados >= 0),
  revisao boolean not null default false,
  creditos_extra integer not null default 0 check (creditos_extra >= 0),
  status text not null default 'pendente',
  link_entrega text,
  observacoes text,
  entregue_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint entregas_status_check check (status in ('pendente', 'em_andamento', 'em_revisao', 'concluida', 'cancelada')),
  constraint entregas_prioridade_check check (prioridade in ('baixa', 'media', 'alta', 'urgente'))
);

create table if not exists public.historico_creditos (
  id uuid primary key default gen_random_uuid(),
  ciclo_id uuid not null references public.ciclos(id) on delete cascade,
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  entrega_id uuid references public.entregas(id) on delete set null,
  tipo text not null,
  quantidade integer not null check (quantidade > 0),
  saldo_antes integer,
  saldo_depois integer,
  motivo text not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint historico_creditos_tipo_check check (tipo in ('credito', 'debito', 'ajuste', 'estorno'))
);

alter table public.profiles add column if not exists cliente_id uuid references public.clientes(id) on delete set null;
alter table public.profiles add column if not exists ativo boolean not null default true;
alter table public.ciclos add column if not exists creditos_restantes integer not null default 0;
alter table public.entregas add column if not exists objetivo text;
alter table public.entregas add column if not exists briefing text;
alter table public.entregas add column if not exists formato text;
alter table public.entregas add column if not exists canais text[] not null default '{}';
alter table public.entregas add column if not exists referencias text;
alter table public.entregas add column if not exists prazo date;
alter table public.entregas add column if not exists prioridade text not null default 'media';
alter table public.entregas add column if not exists link_briefing text;
alter table public.entregas add column if not exists arquivos text;
alter table public.entregas add column if not exists checklist jsonb not null default '[]'::jsonb;
alter table public.entregas add column if not exists creditos_extra integer not null default 0;
alter table public.entregas add column if not exists entregue_at timestamptz;
alter table public.historico_creditos add column if not exists saldo_antes integer;
alter table public.historico_creditos add column if not exists saldo_depois integer;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.sync_creditos_restantes()
returns trigger
language plpgsql
as $$
begin
  new.creditos_restantes = greatest(0, coalesce(new.creditos_disponiveis, 0) - coalesce(new.creditos_usados, 0));
  return new;
end;
$$;

drop trigger if exists ciclos_sync_creditos_restantes on public.ciclos;
create trigger ciclos_sync_creditos_restantes
before insert or update of creditos_disponiveis, creditos_usados
on public.ciclos
for each row execute function public.sync_creditos_restantes();

do $$
declare
  table_name text;
begin
  foreach table_name in array array['clientes', 'profiles', 'planos', 'servicos', 'contratos', 'ciclos', 'entregas']
  loop
    execute format('drop trigger if exists %I_touch_updated_at on public.%I', table_name, table_name);
    execute format('create trigger %I_touch_updated_at before update on public.%I for each row execute function public.touch_updated_at()', table_name, table_name);
  end loop;
end $$;

update public.ciclos
set creditos_restantes = greatest(0, coalesce(creditos_disponiveis, 0) - coalesce(creditos_usados, 0));

create index if not exists profiles_role_idx on public.profiles(role);
create index if not exists profiles_cliente_id_idx on public.profiles(cliente_id);
create index if not exists contratos_cliente_ativo_idx on public.contratos(cliente_id, ativo);
create index if not exists ciclos_cliente_periodo_idx on public.ciclos(cliente_id, ano, mes);
create index if not exists entregas_cliente_status_idx on public.entregas(cliente_id, status);
create index if not exists entregas_responsavel_status_idx on public.entregas(responsavel_id, status);
create index if not exists entregas_prazo_idx on public.entregas(prazo);
create index if not exists historico_creditos_cliente_idx on public.historico_creditos(cliente_id, created_at desc);

create or replace function public.current_profile_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid() and ativo = true;
$$;

create or replace function public.current_profile_cliente_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select cliente_id from public.profiles where id = auth.uid() and ativo = true;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_profile_role() = 'admin', false);
$$;

create or replace function public.is_team()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_profile_role() in ('admin', 'time'), false);
$$;

create or replace function public.debitar_creditos_entrega(
  p_ciclo_id uuid,
  p_cliente_id uuid,
  p_entrega_id uuid,
  p_quantidade integer,
  p_motivo text
)
returns table(creditos_usados integer, creditos_restantes integer, creditos_extra integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ciclo public.ciclos%rowtype;
  v_saldo_antes integer;
  v_saldo_depois integer;
  v_extra integer;
begin
  if not public.is_team() then
    raise exception 'Permissão insuficiente para debitar créditos';
  end if;

  if p_quantidade <= 0 then
    raise exception 'Quantidade de créditos inválida';
  end if;

  select * into v_ciclo
  from public.ciclos
  where id = p_ciclo_id
    and cliente_id = p_cliente_id
    and status = 'ativo'
  for update;

  if not found then
    raise exception 'Ciclo ativo não encontrado';
  end if;

  v_saldo_antes := greatest(0, v_ciclo.creditos_disponiveis - v_ciclo.creditos_usados);
  v_saldo_depois := greatest(0, v_saldo_antes - p_quantidade);
  v_extra := greatest(0, p_quantidade - v_saldo_antes);

  update public.ciclos
  set creditos_usados = creditos_usados + p_quantidade
  where id = p_ciclo_id
  returning public.ciclos.creditos_usados, public.ciclos.creditos_restantes
  into creditos_usados, creditos_restantes;

  update public.entregas
  set creditos_extra = v_extra
  where id = p_entrega_id;

  insert into public.historico_creditos (
    ciclo_id,
    cliente_id,
    entrega_id,
    tipo,
    quantidade,
    saldo_antes,
    saldo_depois,
    motivo,
    created_by
  )
  values (
    p_ciclo_id,
    p_cliente_id,
    p_entrega_id,
    'debito',
    p_quantidade,
    v_saldo_antes,
    v_saldo_depois,
    coalesce(nullif(p_motivo, ''), 'Débito de créditos'),
    auth.uid()
  );

  creditos_extra := v_extra;
  return next;
end;
$$;

create or replace function public.criar_entrega_com_debito(
  p_ciclo_id uuid,
  p_cliente_id uuid,
  p_servico_id uuid,
  p_nome text,
  p_objetivo text,
  p_briefing text,
  p_formato text,
  p_canais text[],
  p_referencias text,
  p_prazo date,
  p_prioridade text,
  p_link_briefing text,
  p_arquivos text,
  p_checklist jsonb,
  p_creditos_cobrados integer,
  p_revisao boolean,
  p_responsavel_id uuid,
  p_observacoes text
)
returns public.entregas
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ciclo public.ciclos%rowtype;
  v_entrega public.entregas%rowtype;
  v_saldo_antes integer;
  v_saldo_depois integer;
  v_extra integer;
begin
  if not public.is_team() then
    raise exception 'Permissão insuficiente para criar entrega';
  end if;

  if p_creditos_cobrados <= 0 then
    raise exception 'Quantidade de créditos inválida';
  end if;

  select * into v_ciclo
  from public.ciclos
  where id = p_ciclo_id
    and cliente_id = p_cliente_id
    and status = 'ativo'
  for update;

  if not found then
    raise exception 'Ciclo ativo não encontrado';
  end if;

  v_saldo_antes := greatest(0, v_ciclo.creditos_disponiveis - v_ciclo.creditos_usados);
  v_saldo_depois := greatest(0, v_saldo_antes - p_creditos_cobrados);
  v_extra := greatest(0, p_creditos_cobrados - v_saldo_antes);

  insert into public.entregas (
    ciclo_id,
    cliente_id,
    servico_id,
    nome,
    objetivo,
    briefing,
    formato,
    canais,
    referencias,
    prazo,
    prioridade,
    link_briefing,
    arquivos,
    checklist,
    creditos_cobrados,
    revisao,
    creditos_extra,
    responsavel_id,
    status,
    observacoes
  )
  values (
    p_ciclo_id,
    p_cliente_id,
    p_servico_id,
    nullif(p_nome, ''),
    nullif(p_objetivo, ''),
    nullif(p_briefing, ''),
    nullif(p_formato, ''),
    coalesce(p_canais, '{}'),
    nullif(p_referencias, ''),
    p_prazo,
    coalesce(nullif(p_prioridade, ''), 'media'),
    nullif(p_link_briefing, ''),
    nullif(p_arquivos, ''),
    coalesce(p_checklist, '[]'::jsonb),
    p_creditos_cobrados,
    coalesce(p_revisao, false),
    v_extra,
    p_responsavel_id,
    'pendente',
    nullif(p_observacoes, '')
  )
  returning * into v_entrega;

  update public.ciclos
  set creditos_usados = creditos_usados + p_creditos_cobrados
  where id = p_ciclo_id;

  insert into public.historico_creditos (
    ciclo_id,
    cliente_id,
    entrega_id,
    tipo,
    quantidade,
    saldo_antes,
    saldo_depois,
    motivo,
    created_by
  )
  values (
    p_ciclo_id,
    p_cliente_id,
    v_entrega.id,
    'debito',
    p_creditos_cobrados,
    v_saldo_antes,
    v_saldo_depois,
    'Entrega: ' || v_entrega.nome,
    auth.uid()
  );

  return v_entrega;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nome, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nome', split_part(new.email, '@', 1), 'Usuário'),
    new.email,
    'cliente'
  )
  on conflict (id) do update
  set email = excluded.email,
      nome = coalesce(public.profiles.nome, excluded.nome);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.clientes enable row level security;
alter table public.profiles enable row level security;
alter table public.planos enable row level security;
alter table public.servicos enable row level security;
alter table public.contratos enable row level security;
alter table public.ciclos enable row level security;
alter table public.entregas enable row level security;
alter table public.historico_creditos enable row level security;

drop policy if exists "clientes_select_multiambiente" on public.clientes;
create policy "clientes_select_multiambiente" on public.clientes
for select using (
  public.is_team()
  or id = public.current_profile_cliente_id()
);

drop policy if exists "clientes_admin_all" on public.clientes;
create policy "clientes_admin_all" on public.clientes
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "profiles_select_multiambiente" on public.profiles;
create policy "profiles_select_multiambiente" on public.profiles
for select using (
  id = auth.uid()
  or public.is_team()
  or cliente_id = public.current_profile_cliente_id()
);

drop policy if exists "profiles_admin_all" on public.profiles;
create policy "profiles_admin_all" on public.profiles
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "planos_select_authenticated" on public.planos;
create policy "planos_select_authenticated" on public.planos
for select using (auth.uid() is not null);

drop policy if exists "planos_admin_all" on public.planos;
create policy "planos_admin_all" on public.planos
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "servicos_select_authenticated" on public.servicos;
create policy "servicos_select_authenticated" on public.servicos
for select using (auth.uid() is not null);

drop policy if exists "servicos_admin_all" on public.servicos;
create policy "servicos_admin_all" on public.servicos
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "contratos_select_multiambiente" on public.contratos;
create policy "contratos_select_multiambiente" on public.contratos
for select using (
  public.is_team()
  or cliente_id = public.current_profile_cliente_id()
);

drop policy if exists "contratos_admin_all" on public.contratos;
create policy "contratos_admin_all" on public.contratos
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "ciclos_select_multiambiente" on public.ciclos;
create policy "ciclos_select_multiambiente" on public.ciclos
for select using (
  public.is_team()
  or cliente_id = public.current_profile_cliente_id()
);

drop policy if exists "ciclos_admin_all" on public.ciclos;
create policy "ciclos_admin_all" on public.ciclos
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "entregas_select_multiambiente" on public.entregas;
create policy "entregas_select_multiambiente" on public.entregas
for select using (
  public.is_team()
  or cliente_id = public.current_profile_cliente_id()
);

drop policy if exists "entregas_insert_team" on public.entregas;
create policy "entregas_insert_team" on public.entregas
for insert with check (public.is_team());

drop policy if exists "entregas_update_team" on public.entregas;
create policy "entregas_update_team" on public.entregas
for update using (public.is_team()) with check (public.is_team());

drop policy if exists "historico_creditos_select_multiambiente" on public.historico_creditos;
create policy "historico_creditos_select_multiambiente" on public.historico_creditos
for select using (
  public.is_team()
  or cliente_id = public.current_profile_cliente_id()
);

drop policy if exists "historico_creditos_insert_team" on public.historico_creditos;
create policy "historico_creditos_insert_team" on public.historico_creditos
for insert with check (public.is_team());
