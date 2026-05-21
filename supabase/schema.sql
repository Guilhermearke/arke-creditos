-- Arke Keep Creditos Sistema
-- Schema completo para Supabase
-- Rodar tudo isso no SQL Editor do Supabase

-- ============================================================================
-- Tabela: profiles (extensão do auth.users)
-- ============================================================================
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'cliente', 'time')),
  cliente_id uuid REFERENCES clientes(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- Tabela: clientes
-- ============================================================================
CREATE TABLE clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  empresa text,
  email text,
  whatsapp text,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- Tabela: planos (biblioteca de planos base)
-- ============================================================================
CREATE TABLE planos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  creditos_mensais integer NOT NULL,
  valor_mensal numeric(10,2) NOT NULL,
  valor_credito numeric(10,2) GENERATED ALWAYS AS (valor_mensal::numeric / creditos_mensais) STORED,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- Tabela: contratos (plano personalizado por cliente)
-- ============================================================================
CREATE TABLE contratos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  plano_id uuid REFERENCES planos(id) ON DELETE SET NULL,
  nome_plano text NOT NULL,
  creditos_mensais integer NOT NULL,
  valor_mensal numeric(10,2) NOT NULL,
  valor_credito_avulso numeric(10,2) DEFAULT 14.00,
  creditos_acumulam boolean DEFAULT false,
  ativo boolean DEFAULT true,
  data_inicio date NOT NULL,
  data_renovacao date,
  observacoes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- Tabela: ciclos (período mensal de créditos)
-- ============================================================================
CREATE TABLE ciclos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id uuid NOT NULL REFERENCES contratos(id) ON DELETE CASCADE,
  cliente_id uuid NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  mes integer NOT NULL CHECK (mes >= 1 AND mes <= 12),
  ano integer NOT NULL,
  creditos_disponíveis integer NOT NULL,
  creditos_usados integer DEFAULT 0,
  creditos_restantes integer GENERATED ALWAYS AS (creditos_disponíveis - creditos_usados) STORED,
  status text DEFAULT 'ativo' CHECK (status IN ('ativo', 'encerrado')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(contrato_id, mes, ano)
);

-- ============================================================================
-- Tabela: servicos (catálogo de serviços)
-- ============================================================================
CREATE TABLE servicos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  creditos integer NOT NULL,
  descricao text,
  categoria text CHECK (categoria IN ('estático', 'apresentação', 'vídeo', 'motion', 'impresso')),
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- Tabela: entregas (registros de entrega)
-- ============================================================================
CREATE TABLE entregas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ciclo_id uuid NOT NULL REFERENCES ciclos(id) ON DELETE CASCADE,
  cliente_id uuid NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  servico_id uuid REFERENCES servicos(id) ON DELETE SET NULL,
  nome text NOT NULL,
  creditos_cobrados integer NOT NULL,
  revisao boolean DEFAULT false,
  creditos_extra integer DEFAULT 0,
  responsavel_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  status text DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_andamento', 'entregue', 'aprovado')),
  link_entrega text,
  observacoes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- Tabela: historico_creditos (log de movimentações)
-- ============================================================================
CREATE TABLE historico_creditos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ciclo_id uuid NOT NULL REFERENCES ciclos(id) ON DELETE CASCADE,
  cliente_id uuid NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('debito', 'credito', 'ajuste')),
  quantidade integer NOT NULL,
  motivo text,
  entrega_id uuid REFERENCES entregas(id) ON DELETE SET NULL,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- Índices para performance
-- ============================================================================
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_cliente_id ON profiles(cliente_id);
CREATE INDEX idx_contratos_cliente_id ON contratos(cliente_id);
CREATE INDEX idx_contratos_ativo ON contratos(ativo);
CREATE INDEX idx_ciclos_cliente_id ON ciclos(cliente_id);
CREATE INDEX idx_ciclos_contrato_id ON ciclos(contrato_id);
CREATE INDEX idx_ciclos_mes_ano ON ciclos(ano, mes);
CREATE INDEX idx_entregas_cliente_id ON entregas(cliente_id);
CREATE INDEX idx_entregas_ciclo_id ON entregas(ciclo_id);
CREATE INDEX idx_entregas_responsavel_id ON entregas(responsavel_id);
CREATE INDEX idx_entregas_status ON entregas(status);
CREATE INDEX idx_historico_cliente_id ON historico_creditos(cliente_id);
CREATE INDEX idx_historico_ciclo_id ON historico_creditos(ciclo_id);
CREATE INDEX idx_historico_entrega_id ON historico_creditos(entrega_id);

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE planos ENABLE ROW LEVEL SECURITY;
ALTER TABLE contratos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ciclos ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE entregas ENABLE ROW LEVEL SECURITY;
ALTER TABLE historico_creditos ENABLE ROW LEVEL SECURITY;

-- Políticas: profiles
CREATE POLICY "Usuários veem seu próprio perfil" ON profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admin vê todos os perfis" ON profiles
  FOR SELECT USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Políticas: clientes
CREATE POLICY "Admin vê todos os clientes" ON clientes
  FOR ALL USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Cliente vê a si mesmo" ON clientes
  FOR SELECT USING (
    id = (SELECT cliente_id FROM profiles WHERE id = auth.uid())
  );

-- Políticas: planos (leitura pública para logados)
CREATE POLICY "Logados veem planos" ON planos
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Políticas: contratos
CREATE POLICY "Admin vê todos os contratos" ON contratos
  FOR ALL USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Cliente vê seus contratos" ON contratos
  FOR SELECT USING (
    cliente_id = (SELECT cliente_id FROM profiles WHERE id = auth.uid())
  );

-- Políticas: ciclos
CREATE POLICY "Admin vê todos os ciclos" ON ciclos
  FOR ALL USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Cliente vê seus ciclos" ON ciclos
  FOR SELECT USING (
    cliente_id = (SELECT cliente_id FROM profiles WHERE id = auth.uid())
  );

-- Políticas: servicos (leitura pública para logados)
CREATE POLICY "Logados veem serviços" ON servicos
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admin gerencia serviços" ON servicos
  FOR ALL USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Políticas: entregas
CREATE POLICY "Admin vê todas as entregas" ON entregas
  FOR ALL USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Cliente vê suas entregas" ON entregas
  FOR SELECT USING (
    cliente_id = (SELECT cliente_id FROM profiles WHERE id = auth.uid())
  );
CREATE POLICY "Time vê entregas atribuídas" ON entregas
  FOR SELECT USING (
    responsavel_id = auth.uid() OR
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Políticas: historico_creditos
CREATE POLICY "Admin vê todo histórico" ON historico_creditos
  FOR ALL USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Cliente vê seu histórico" ON historico_creditos
  FOR SELECT USING (
    cliente_id = (SELECT cliente_id FROM profiles WHERE id = auth.uid())
  );

-- ============================================================================
-- Funções auxiliares
-- ============================================================================

-- Função para atualizar creditos_usados quando uma entrega é criada/deletada
CREATE OR REPLACE FUNCTION atualizar_creditos_ciclo()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE ciclos
    SET creditos_usados = creditos_usados + NEW.creditos_cobrados
    WHERE id = NEW.ciclo_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE ciclos
    SET creditos_usados = creditos_usados - OLD.creditos_cobrados
    WHERE id = OLD.ciclo_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_atualizar_creditos_ciclo
AFTER INSERT OR DELETE ON entregas
FOR EACH ROW
EXECUTE FUNCTION atualizar_creditos_ciclo();

-- Função para criar ciclo automaticamente ao cadastrar contrato
CREATE OR REPLACE FUNCTION criar_ciclo_contrato()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO ciclos (contrato_id, cliente_id, mes, ano, creditos_disponíveis)
  VALUES (
    NEW.id,
    NEW.cliente_id,
    EXTRACT(MONTH FROM CURRENT_DATE)::integer,
    EXTRACT(YEAR FROM CURRENT_DATE)::integer,
    NEW.creditos_mensais
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_criar_ciclo_contrato
AFTER INSERT ON contratos
FOR EACH ROW
EXECUTE FUNCTION criar_ciclo_contrato();
