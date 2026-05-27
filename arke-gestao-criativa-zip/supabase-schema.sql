CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables to avoid schema definition conflicts during setup
DROP TABLE IF EXISTS entregas_projeto CASCADE;
DROP TABLE IF EXISTS avaliacoes CASCADE;
DROP TABLE IF EXISTS templates_tarefa CASCADE;
DROP TABLE IF EXISTS aprovacoes CASCADE;

-- ... Restante mantido
DROP TABLE IF EXISTS historico_integracoes CASCADE;
DROP TABLE IF EXISTS historico_creditos CASCADE;
DROP TABLE IF EXISTS anexos CASCADE;
DROP TABLE IF EXISTS comentarios CASCADE;
DROP TABLE IF EXISTS subtarefas CASCADE;
DROP TABLE IF EXISTS triagem_itens CASCADE;
DROP TABLE IF EXISTS tarefas CASCADE;
DROP TABLE IF EXISTS projetos CASCADE;
DROP TABLE IF EXISTS ciclos CASCADE;
DROP TABLE IF EXISTS servicos CASCADE;
DROP TABLE IF EXISTS contratos CASCADE;
DROP TABLE IF EXISTS planos CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS clientes CASCADE;

CREATE TABLE IF NOT EXISTS clientes (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  empresa text,
  email text,
  whatsapp text,
  tipo text not null check (tipo in ('keep', 'build', 'craft', 'avulso')),
  ativo boolean default true,
  cor_tema text default '#2563EB',
  logo_url text,
  slack_channel_id text,
  slack_webhook_url text,
  trello_board_id text,
  trello_webhook_id text,
  clickup_list_id text,
  clickup_webhook_id text,
  created_at timestamptz default now()
);

CREATE TABLE IF NOT EXISTS profiles (
  id uuid references auth.users primary key,
  nome text not null,
  role text not null check (role in ('admin', 'time', 'cliente')),
  cliente_id uuid references clientes(id),
  avatar_url text,
  funcao text,
  created_at timestamptz default now()
);

CREATE TABLE IF NOT EXISTS planos (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  creditos_mensais integer,
  valor_mensal numeric(10,2),
  valor_credito_base numeric(10,2),
  valor_credito_avulso numeric(10,2) default 14.00,
  revisao_percentual integer default 20,
  revisoes_incluidas integer default 1,
  creditos_acumulam boolean default false,
  ativo boolean default true,
  created_at timestamptz default now()
);

CREATE TABLE IF NOT EXISTS contratos (
  id uuid primary key default uuid_generate_v4(),
  cliente_id uuid references clientes(id) not null,
  plano_id uuid references planos(id),
  nome text not null,
  creditos_mensais integer,
  valor_mensal numeric(10,2),
  valor_credito numeric(10,2),
  valor_credito_avulso numeric(10,2) default 14.00,
  revisao_percentual integer default 20,
  revisoes_incluidas integer default 1,
  creditos_acumulam boolean default false,
  valor_projeto numeric(10,2),
  data_inicio date not null,
  data_renovacao date,
  observacoes text,
  ativo boolean default true,
  created_at timestamptz default now()
);

CREATE TABLE IF NOT EXISTS servicos (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  creditos_padrao integer,
  categoria text check (categoria in (
    'criativo','apresentacao','impresso',
    'video','motion','web','identidade','outro'
  )),
  descricao text,
  ativo boolean default true,
  created_at timestamptz default now()
);

CREATE TABLE IF NOT EXISTS ciclos (
  id uuid primary key default uuid_generate_v4(),
  contrato_id uuid references contratos(id) not null,
  cliente_id uuid references clientes(id) not null,
  mes integer not null,
  ano integer not null,
  creditos_disponiveis integer not null,
  creditos_usados integer default 0,
  creditos_restantes integer generated always as
    (creditos_disponiveis - creditos_usados) stored,
  status text default 'ativo' check (status in ('ativo','encerrado')),
  created_at timestamptz default now(),
  unique(contrato_id, mes, ano)
);

CREATE TABLE IF NOT EXISTS projetos (
  id uuid primary key default uuid_generate_v4(),
  cliente_id uuid references clientes(id) not null,
  contrato_id uuid references contratos(id),
  nome text not null,
  tipo text check (tipo in ('build','craft','avulso')),
  status text default 'briefing' check (status in (
    'briefing','em_andamento','revisao',
    'aprovado','entregue','pausado','cancelado'
  )),
  descricao text,
  data_inicio date,
  data_prazo date,
  created_at timestamptz default now()
);

CREATE TABLE IF NOT EXISTS tarefas (
  id uuid primary key default uuid_generate_v4(),
  cliente_id uuid references clientes(id) not null,
  ciclo_id uuid references ciclos(id),
  projeto_id uuid references projetos(id),
  servico_id uuid references servicos(id),
  responsavel_id uuid references profiles(id),
  criado_por uuid references profiles(id),
  titulo text not null,
  descricao text,
  tipo_cliente text not null check (tipo_cliente in ('keep','build','craft','avulso')),
  creditos_cobrados integer,
  e_revisao boolean default false,
  numero_revisao integer default 0,
  creditos_revisao integer default 0,
  creditos_total integer generated always as
    (coalesce(creditos_cobrados,0) + coalesce(creditos_revisao,0)) stored,
  credito_avulso boolean default false,
  valor_avulso numeric(10,2),
  status text default 'triagem' check (status in (
    'triagem','backlog','a_fazer','em_andamento',
    'em_revisao','aprovado','entregue','arquivado'
  )),
  prioridade text default 'normal' check (
    prioridade in ('baixa','normal','alta','urgente')
  ),
  data_vencimento date,
  data_entrega timestamptz,
  link_entrega text,
  link_arquivo text,
  visivel_cliente boolean default true,
  trello_card_id text,
  clickup_task_id text,
  slack_message_ts text,
  origem text check (origem in (
    'arke','slack','trello','clickup',
    'notion','whatsapp','painel_cliente','manual'
  )) default 'arke',
  tags text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

CREATE TABLE IF NOT EXISTS triagem_itens (
  id uuid primary key default uuid_generate_v4(),
  tarefa_id uuid references tarefas(id) on delete cascade,
  cliente_id uuid references clientes(id),
  tipo text check (tipo in ('demanda', 'novo_cliente', 'novo_projeto')) default 'demanda',
  status_triagem text check (status_triagem in ('aguardando', 'incompleto', 'liberado')) default 'aguardando',
  canal text not null check (canal in (
    'slack','trello','clickup','notion',
    'whatsapp','email','painel_cliente','manual'
  )),
  canal_label text,
  conteudo_original text,
  dados_extras jsonb,
  triado_por uuid references profiles(id),
  triado_em timestamptz,
  created_at timestamptz default now()
);

CREATE TABLE IF NOT EXISTS entregas_projeto (
  id uuid primary key default uuid_generate_v4(),
  projeto_id uuid references projetos(id) not null,
  cliente_id uuid references clientes(id) not null,
  titulo text not null,
  descricao text,
  tipo_entrega text check (tipo_entrega in ('link', 'arquivo_hospedado', 'drive')) not null,
  url text,                          -- link externo ou URL do arquivo hospedado
  nome_arquivo text,                 -- nome original do arquivo se hospedado
  disponivel_ate timestamptz,        -- data de expiração (criado_em + 3 meses)
  created_at timestamptz default now()
);

CREATE TABLE IF NOT EXISTS avaliacoes (
  id uuid primary key default uuid_generate_v4(),
  projeto_id uuid references projetos(id) not null,
  cliente_id uuid references clientes(id) not null,
  nota integer check (nota between 1 and 5) not null,
  created_at timestamptz default now()
);

CREATE TABLE IF NOT EXISTS subtarefas (
  id uuid primary key default uuid_generate_v4(),
  tarefa_id uuid references tarefas(id) on delete cascade not null,
  titulo text not null,
  concluida boolean default false,
  ordem integer default 0,
  created_at timestamptz default now()
);

CREATE TABLE IF NOT EXISTS comentarios (
  id uuid primary key default uuid_generate_v4(),
  tarefa_id uuid references tarefas(id) on delete cascade not null,
  autor_id uuid references profiles(id),
  role_autor text not null check (role_autor in ('admin','time','cliente')),
  conteudo text not null,
  interno boolean default false,
  origem text check (origem in ('arke','slack','trello','clickup')),
  origem_id text,
  enviado_slack boolean default false,
  enviado_trello boolean default false,
  enviado_clickup boolean default false,
  created_at timestamptz default now()
);

CREATE TABLE IF NOT EXISTS anexos (
  id uuid primary key default uuid_generate_v4(),
  tarefa_id uuid references tarefas(id) on delete cascade not null,
  nome text not null,
  url text not null,
  tipo text check (tipo in ('imagem','pdf','link','figma','drive','outro')),
  enviado_por uuid references profiles(id),
  created_at timestamptz default now()
);

CREATE TABLE IF NOT EXISTS historico_creditos (
  id uuid primary key default uuid_generate_v4(),
  ciclo_id uuid references ciclos(id) not null,
  cliente_id uuid references clientes(id) not null,
  tipo text check (tipo in ('debito','credito','ajuste')),
  quantidade integer not null,
  motivo text,
  tarefa_id uuid references tarefas(id),
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

CREATE TABLE IF NOT EXISTS historico_integracoes (
  id uuid primary key default uuid_generate_v4(),
  cliente_id uuid references clientes(id) not null,
  tarefa_id uuid references tarefas(id),
  origem text not null check (origem in ('slack','trello','clickup')),
  tipo_evento text not null,
  payload jsonb,
  processado boolean default false,
  created_at timestamptz default now()
);

CREATE TABLE IF NOT EXISTS aprovacoes (
  id uuid primary key default uuid_generate_v4(),
  tarefa_id uuid references tarefas(id) not null,
  cliente_id uuid references clientes(id) not null,
  aprovado boolean not null,
  observacao text,
  created_at timestamptz default now()
);

CREATE TABLE IF NOT EXISTS templates_tarefa (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  categoria text,
  servico_id uuid references servicos(id),
  creditos_padrao integer,
  descricao text,
  subtarefas_padrao jsonb,
  tags_padrao text[],
  ativo boolean default true,
  created_at timestamptz default now()
);

-- RLS
ALTER TABLE tarefas ENABLE ROW LEVEL SECURITY;
ALTER TABLE ciclos ENABLE ROW LEVEL SECURITY;
ALTER TABLE comentarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE anexos ENABLE ROW LEVEL SECURITY;
ALTER TABLE subtarefas ENABLE ROW LEVEL SECURITY;
ALTER TABLE historico_creditos ENABLE ROW LEVEL SECURITY;
ALTER TABLE aprovacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE triagem_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_tarefas" ON tarefas FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

CREATE POLICY "time_assigned_tarefas" ON tarefas FOR SELECT
  USING (
    responsavel_id = auth.uid()
    AND status != 'triagem'
    AND auth.uid() IN (SELECT id FROM profiles WHERE role = 'time')
  );

CREATE POLICY "cliente_own_tarefas" ON tarefas FOR SELECT
  USING (
    visivel_cliente = true
    AND cliente_id IN (SELECT cliente_id FROM profiles WHERE id = auth.uid())
  );

-- SEEDS
INSERT INTO servicos (nome, creditos_padrao, categoria) VALUES
('Criativo / Thumbnail simples', 8, 'criativo'),
('Variação de criativo', 1, 'criativo'),
('Carrossel até 10 páginas', 12, 'criativo'),
('Carrossel +10 páginas', 18, 'criativo'),
('Slide de apresentação (por página)', 4, 'apresentacao'),
('Ebook (por página)', 4, 'apresentacao'),
('Impresso por peça', 16, 'impresso'),
('Vídeo até 30s', 18, 'video'),
('Vídeo até 1min', 25, 'video'),
('Vídeo até 2min', 35, 'video'),
('Vídeo até 5min', 50, 'video'),
('Vídeo até 10min', 75, 'video'),
('Motion até 30s', 50, 'motion'),
('Motion até 1min', 85, 'motion'),
('Motion branding até 30s', 110, 'motion'),
('Motion branding até 1min', 140, 'motion'),
('Landing Page simples', null, 'web'),
('Site institucional', null, 'web'),
('Identidade Visual completa', null, 'identidade'),
('UI/UX tela isolada', null, 'web');

INSERT INTO planos (nome, creditos_mensais, valor_mensal, valor_credito_base, valor_credito_avulso, revisao_percentual, revisoes_incluidas, creditos_acumulam) VALUES
('Keep Essential', 250,  3000.00, 12.00, 14.00, 20, 1, false),
('Keep Scale',     550,  6000.00, 10.91, 14.00, 20, 1, false),
('Keep Boost',    1000, 10000.00, 10.00, 14.00, 20, 1, false);

INSERT INTO templates_tarefa (nome, categoria, creditos_padrao, subtarefas_padrao) VALUES
('Criativo para ads', 'criativo', 8, '["Briefing","Conceito","Execução","Revisão"]'),
('Variação de criativo', 'criativo', 1, '["Aplicar variação","Revisar"]'),
('Carrossel 10 páginas', 'criativo', 12, '["Briefing","Roteiro","Design slide a slide","Revisão"]'),
('Landing Page', 'web', null, '["Briefing","Wireframe","Design","Desenvolvimento","Revisão","Entrega"]'),
('Identidade Visual', 'identidade', null, '["Briefing","Pesquisa","Conceito","Logo","Sistema visual","Guia de marca","Entrega"]'),
('UI/UX Produto', 'web', null, '["Briefing","Benchmark","Fluxo","Wireframe","UI","Prototipagem","Revisão","Handoff"]');
