-- ============================================================
-- 004_tarefas_schema.sql
-- Schema completo de tarefas para o Arke Sistema de Gestão Criativa
-- Adiciona tabelas novas sem remover as existentes (clientes, contratos, ciclos)
-- ============================================================

-- Atualizar clientes com campos da spec completa
alter table public.clientes
  add column if not exists tipo text not null default 'keep'
    constraint clientes_tipo_check check (tipo in ('keep','build','craft','avulso')),
  add column if not exists cor_tema text not null default '#2563EB',
  add column if not exists logo_url text,
  add column if not exists slack_channel_id text,
  add column if not exists slack_webhook_url text,
  add column if not exists trello_board_id text,
  add column if not exists trello_webhook_id text,
  add column if not exists clickup_list_id text,
  add column if not exists clickup_webhook_id text;

-- Atualizar planos com campos da spec
alter table public.planos
  add column if not exists valor_credito_base numeric(10,2),
  add column if not exists valor_credito_avulso numeric(10,2) default 14.00,
  add column if not exists revisao_percentual integer default 20,
  add column if not exists revisoes_incluidas integer default 1,
  add column if not exists creditos_acumulam boolean default false;

-- Atualizar contratos com campos da spec
alter table public.contratos
  add column if not exists valor_credito numeric(10,2),
  add column if not exists valor_credito_avulso numeric(10,2) default 14.00,
  add column if not exists revisao_percentual integer default 20,
  add column if not exists revisoes_incluidas integer default 1,
  add column if not exists creditos_acumulam boolean default false,
  add column if not exists valor_projeto numeric(10,2),
  add column if not exists data_renovacao date,
  add column if not exists observacoes text;

-- Rename nome_plano -> nome se necessário (seguro, só add)
alter table public.contratos
  add column if not exists nome text;

-- Atualizar servicos com categoria da spec
alter table public.servicos
  drop constraint if exists servicos_categoria_check;
alter table public.servicos
  add constraint servicos_categoria_check check (categoria in (
    'criativo','apresentacao','impresso','video','motion','web','identidade','outro','Geral'
  ));
alter table public.servicos
  rename column if exists creditos to creditos_padrao;

-- Criar coluna creditos_padrao se ainda não foi renomeada
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'servicos' and column_name = 'creditos_padrao'
  ) then
    alter table public.servicos add column creditos_padrao integer;
  end if;
end $$;

-- ============================================================
-- Projetos (para Build, Craft, Avulso)
-- ============================================================
create table if not exists public.projetos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  contrato_id uuid references public.contratos(id) on delete set null,
  nome text not null,
  tipo text check (tipo in ('build','craft','avulso')),
  status text not null default 'briefing'
    constraint projetos_status_check check (status in (
      'briefing','em_andamento','revisao','aprovado','entregue','pausado','cancelado'
    )),
  descricao text,
  data_inicio date,
  data_prazo date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- Tarefas (tabela central da spec)
-- ============================================================
create table if not exists public.tarefas (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  ciclo_id uuid references public.ciclos(id) on delete set null,
  projeto_id uuid references public.projetos(id) on delete set null,
  servico_id uuid references public.servicos(id) on delete set null,
  responsavel_id uuid references public.profiles(id) on delete set null,
  criado_por uuid references public.profiles(id) on delete set null,

  titulo text not null,
  descricao text,
  tipo_cliente text not null default 'keep'
    constraint tarefas_tipo_cliente_check check (tipo_cliente in ('keep','build','craft','avulso')),

  -- créditos (Keep)
  creditos_cobrados integer default 0,
  e_revisao boolean not null default false,
  numero_revisao integer not null default 0,
  creditos_revisao integer not null default 0,
  credito_avulso boolean not null default false,
  valor_avulso numeric(10,2),

  -- status e prioridade
  status text not null default 'triagem'
    constraint tarefas_status_check check (status in (
      'triagem','backlog','a_fazer','em_andamento',
      'em_revisao','aprovado','entregue','arquivado'
    )),
  prioridade text not null default 'normal'
    constraint tarefas_prioridade_check check (prioridade in ('baixa','normal','alta','urgente')),

  data_vencimento date,
  data_entrega timestamptz,

  -- entrega
  link_entrega text,
  link_arquivo text,

  -- visibilidade
  visivel_cliente boolean not null default true,

  -- integrações
  trello_card_id text,
  clickup_task_id text,
  slack_message_ts text,
  origem text not null default 'arke'
    constraint tarefas_origem_check check (origem in (
      'arke','slack','trello','clickup','notion','whatsapp','painel_cliente','manual'
    )),
  tags text[] not null default '{}',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Campo computado (creditos_total = cobrados + revisao)
-- PostgreSQL não suporta generated always com coalesce em alguns contextos, usando view ou trigger
create or replace function public.tarefas_creditos_total(t public.tarefas)
returns integer
language sql
stable
as $$
  select coalesce(t.creditos_cobrados, 0) + coalesce(t.creditos_revisao, 0);
$$;

-- ============================================================
-- Triagem Itens
-- ============================================================
create table if not exists public.triagem_itens (
  id uuid primary key default gen_random_uuid(),
  tarefa_id uuid not null references public.tarefas(id) on delete cascade,
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  canal text not null
    constraint triagem_itens_canal_check check (canal in (
      'slack','trello','clickup','notion','whatsapp','email','painel_cliente','manual'
    )),
  canal_label text,
  conteudo_original text,
  triado_por uuid references public.profiles(id) on delete set null,
  triado_em timestamptz,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Subtarefas
-- ============================================================
create table if not exists public.subtarefas (
  id uuid primary key default gen_random_uuid(),
  tarefa_id uuid not null references public.tarefas(id) on delete cascade,
  titulo text not null,
  concluida boolean not null default false,
  ordem integer not null default 0,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Comentários
-- ============================================================
create table if not exists public.comentarios (
  id uuid primary key default gen_random_uuid(),
  tarefa_id uuid not null references public.tarefas(id) on delete cascade,
  autor_id uuid references public.profiles(id) on delete set null,
  role_autor text not null
    constraint comentarios_role_check check (role_autor in ('admin','time','cliente')),
  conteudo text not null,
  interno boolean not null default false,
  origem text
    constraint comentarios_origem_check check (origem in ('arke','slack','trello','clickup')),
  origem_id text,
  enviado_slack boolean not null default false,
  enviado_trello boolean not null default false,
  enviado_clickup boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Anexos
-- ============================================================
create table if not exists public.anexos (
  id uuid primary key default gen_random_uuid(),
  tarefa_id uuid not null references public.tarefas(id) on delete cascade,
  nome text not null,
  url text not null,
  tipo text
    constraint anexos_tipo_check check (tipo in ('imagem','pdf','link','figma','drive','outro')),
  enviado_por uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Aprovações
-- ============================================================
create table if not exists public.aprovacoes (
  id uuid primary key default gen_random_uuid(),
  tarefa_id uuid not null references public.tarefas(id) on delete cascade,
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  aprovado boolean not null,
  observacao text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Templates de Tarefa
-- ============================================================
create table if not exists public.templates_tarefa (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  categoria text,
  servico_id uuid references public.servicos(id) on delete set null,
  creditos_padrao integer,
  descricao text,
  subtarefas_padrao jsonb not null default '[]'::jsonb,
  tags_padrao text[] not null default '{}',
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Histórico de Integrações
-- ============================================================
create table if not exists public.historico_integracoes (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  tarefa_id uuid references public.tarefas(id) on delete set null,
  origem text not null
    constraint historico_integracoes_origem_check check (origem in ('slack','trello','clickup')),
  tipo_evento text not null,
  payload jsonb,
  processado boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Triggers
-- ============================================================
drop trigger if exists tarefas_touch_updated_at on public.tarefas;
create trigger tarefas_touch_updated_at
  before update on public.tarefas
  for each row execute function public.touch_updated_at();

drop trigger if exists projetos_touch_updated_at on public.projetos;
create trigger projetos_touch_updated_at
  before update on public.projetos
  for each row execute function public.touch_updated_at();

-- ============================================================
-- Índices
-- ============================================================
create index if not exists tarefas_cliente_status_idx on public.tarefas(cliente_id, status);
create index if not exists tarefas_responsavel_status_idx on public.tarefas(responsavel_id, status);
create index if not exists tarefas_status_idx on public.tarefas(status);
create index if not exists tarefas_vencimento_idx on public.tarefas(data_vencimento);
create index if not exists tarefas_origem_idx on public.tarefas(origem);
create index if not exists triagem_itens_tarefa_idx on public.triagem_itens(tarefa_id);
create index if not exists triagem_itens_cliente_idx on public.triagem_itens(cliente_id);
create index if not exists comentarios_tarefa_idx on public.comentarios(tarefa_id);
create index if not exists subtarefas_tarefa_idx on public.subtarefas(tarefa_id, ordem);
create index if not exists projetos_cliente_idx on public.projetos(cliente_id);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.tarefas enable row level security;
alter table public.triagem_itens enable row level security;
alter table public.subtarefas enable row level security;
alter table public.comentarios enable row level security;
alter table public.anexos enable row level security;
alter table public.aprovacoes enable row level security;
alter table public.templates_tarefa enable row level security;
alter table public.projetos enable row level security;
alter table public.historico_integracoes enable row level security;

-- Tarefas
drop policy if exists "tarefas_admin_all" on public.tarefas;
create policy "tarefas_admin_all" on public.tarefas
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "tarefas_time_select" on public.tarefas;
create policy "tarefas_time_select" on public.tarefas
  for select using (
    public.current_profile_role() = 'time'
    and status != 'triagem'
  );

drop policy if exists "tarefas_time_update" on public.tarefas;
create policy "tarefas_time_update" on public.tarefas
  for update using (
    public.current_profile_role() = 'time'
    and responsavel_id = auth.uid()
  ) with check (public.current_profile_role() = 'time');

drop policy if exists "tarefas_cliente_select" on public.tarefas;
create policy "tarefas_cliente_select" on public.tarefas
  for select using (
    visivel_cliente = true
    and cliente_id = public.current_profile_cliente_id()
    and public.current_profile_role() = 'cliente'
  );

-- Triagem (apenas admin)
drop policy if exists "triagem_admin_all" on public.triagem_itens;
create policy "triagem_admin_all" on public.triagem_itens
  for all using (public.is_admin()) with check (public.is_admin());

-- Subtarefas
drop policy if exists "subtarefas_admin_all" on public.subtarefas;
create policy "subtarefas_admin_all" on public.subtarefas
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "subtarefas_time_select" on public.subtarefas;
create policy "subtarefas_time_select" on public.subtarefas
  for select using (
    public.current_profile_role() = 'time'
    and exists (
      select 1 from public.tarefas t
      where t.id = subtarefas.tarefa_id
        and t.responsavel_id = auth.uid()
    )
  );

drop policy if exists "subtarefas_cliente_select" on public.subtarefas;
create policy "subtarefas_cliente_select" on public.subtarefas
  for select using (
    public.current_profile_role() = 'cliente'
    and exists (
      select 1 from public.tarefas t
      where t.id = subtarefas.tarefa_id
        and t.cliente_id = public.current_profile_cliente_id()
        and t.visivel_cliente = true
    )
  );

-- Comentários
drop policy if exists "comentarios_admin_all" on public.comentarios;
create policy "comentarios_admin_all" on public.comentarios
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "comentarios_time_select" on public.comentarios;
create policy "comentarios_time_select" on public.comentarios
  for select using (
    public.current_profile_role() = 'time'
    and exists (
      select 1 from public.tarefas t
      where t.id = comentarios.tarefa_id
        and t.responsavel_id = auth.uid()
    )
  );

drop policy if exists "comentarios_cliente_select" on public.comentarios;
create policy "comentarios_cliente_select" on public.comentarios
  for select using (
    public.current_profile_role() = 'cliente'
    and interno = false
    and exists (
      select 1 from public.tarefas t
      where t.id = comentarios.tarefa_id
        and t.cliente_id = public.current_profile_cliente_id()
    )
  );

drop policy if exists "comentarios_cliente_insert" on public.comentarios;
create policy "comentarios_cliente_insert" on public.comentarios
  for insert with check (
    public.current_profile_role() = 'cliente'
    and interno = false
    and exists (
      select 1 from public.tarefas t
      where t.id = comentarios.tarefa_id
        and t.cliente_id = public.current_profile_cliente_id()
    )
  );

-- Aprovações
drop policy if exists "aprovacoes_admin_all" on public.aprovacoes;
create policy "aprovacoes_admin_all" on public.aprovacoes
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "aprovacoes_cliente_insert" on public.aprovacoes;
create policy "aprovacoes_cliente_insert" on public.aprovacoes
  for insert with check (
    public.current_profile_role() = 'cliente'
    and cliente_id = public.current_profile_cliente_id()
  );

drop policy if exists "aprovacoes_cliente_select" on public.aprovacoes;
create policy "aprovacoes_cliente_select" on public.aprovacoes
  for select using (
    cliente_id = public.current_profile_cliente_id()
    or public.is_team()
  );

-- Projetos
drop policy if exists "projetos_admin_all" on public.projetos;
create policy "projetos_admin_all" on public.projetos
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "projetos_time_select" on public.projetos;
create policy "projetos_time_select" on public.projetos
  for select using (public.current_profile_role() = 'time');

drop policy if exists "projetos_cliente_select" on public.projetos;
create policy "projetos_cliente_select" on public.projetos
  for select using (
    public.current_profile_role() = 'cliente'
    and cliente_id = public.current_profile_cliente_id()
  );

-- Templates (admin CRUD, todos podem ler)
drop policy if exists "templates_admin_all" on public.templates_tarefa;
create policy "templates_admin_all" on public.templates_tarefa
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "templates_team_select" on public.templates_tarefa;
create policy "templates_team_select" on public.templates_tarefa
  for select using (auth.uid() is not null and ativo = true);

-- Histórico integrações
drop policy if exists "historico_integracoes_admin_all" on public.historico_integracoes;
create policy "historico_integracoes_admin_all" on public.historico_integracoes
  for all using (public.is_admin()) with check (public.is_admin());

-- Anexos
drop policy if exists "anexos_admin_all" on public.anexos;
create policy "anexos_admin_all" on public.anexos
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "anexos_team_all" on public.anexos;
create policy "anexos_team_all" on public.anexos
  for all using (public.current_profile_role() = 'time') with check (public.current_profile_role() = 'time');

drop policy if exists "anexos_cliente_select" on public.anexos;
create policy "anexos_cliente_select" on public.anexos
  for select using (
    public.current_profile_role() = 'cliente'
    and exists (
      select 1 from public.tarefas t
      where t.id = anexos.tarefa_id
        and t.cliente_id = public.current_profile_cliente_id()
        and t.visivel_cliente = true
    )
  );

-- ============================================================
-- Seeds — Serviços (spec completa)
-- ============================================================
insert into public.servicos (nome, creditos_padrao, categoria, ativo) values
  ('Criativo / Thumbnail simples', 8, 'criativo', true),
  ('Variação de criativo', 1, 'criativo', true),
  ('Carrossel até 10 páginas', 12, 'criativo', true),
  ('Carrossel +10 páginas', 18, 'criativo', true),
  ('Slide de apresentação (por página)', 4, 'apresentacao', true),
  ('Ebook (por página)', 4, 'apresentacao', true),
  ('Impresso por peça', 16, 'impresso', true),
  ('Vídeo até 30s', 18, 'video', true),
  ('Vídeo até 1min', 25, 'video', true),
  ('Vídeo até 2min', 35, 'video', true),
  ('Vídeo até 5min', 50, 'video', true),
  ('Vídeo até 10min', 75, 'video', true),
  ('Motion até 30s', 50, 'motion', true),
  ('Motion até 1min', 85, 'motion', true),
  ('Motion branding até 30s', 110, 'motion', true),
  ('Motion branding até 1min', 140, 'motion', true),
  ('Landing Page simples', null, 'web', true),
  ('Site institucional', null, 'web', true),
  ('Identidade Visual completa', null, 'identidade', true),
  ('UI/UX tela isolada', null, 'web', true)
on conflict do nothing;

-- Seeds — Planos Keep
insert into public.planos (nome, creditos_mensais, valor_mensal, valor_credito_base, valor_credito_avulso, revisao_percentual, revisoes_incluidas, creditos_acumulam, ativo) values
  ('Keep Essential', 250,  3000.00, 12.00, 14.00, 20, 1, false, true),
  ('Keep Scale',     550,  6000.00, 10.91, 14.00, 20, 1, false, true),
  ('Keep Boost',    1000, 10000.00, 10.00, 14.00, 20, 1, false, true)
on conflict do nothing;

-- Seeds — Templates
insert into public.templates_tarefa (nome, categoria, creditos_padrao, subtarefas_padrao, ativo) values
  ('Criativo para ads', 'criativo', 8,
    '["Briefing","Conceito","Execução","Revisão"]'::jsonb, true),
  ('Variação de criativo', 'criativo', 1,
    '["Aplicar variação","Revisar"]'::jsonb, true),
  ('Carrossel 10 páginas', 'criativo', 12,
    '["Briefing","Roteiro","Design slide a slide","Revisão"]'::jsonb, true),
  ('Landing Page', 'web', null,
    '["Briefing","Wireframe","Design","Desenvolvimento","Revisão","Entrega"]'::jsonb, true),
  ('Identidade Visual', 'identidade', null,
    '["Briefing","Pesquisa","Conceito","Logo","Sistema visual","Guia de marca","Entrega"]'::jsonb, true),
  ('UI/UX Produto', 'web', null,
    '["Briefing","Benchmark","Fluxo","Wireframe","UI","Prototipagem","Revisão","Handoff"]'::jsonb, true)
on conflict do nothing;
