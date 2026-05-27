
-- PASSO A PASSO PARA CONSERTAR O ERRO E CRIAR USUÁRIOS DE FORMA SEGURA:

-- PRIMEIRO: RODAR O SCRIPT INTEIRO NO SEU SQL EDITOR (Isso vai resolver aquele erro de "Scan error on column index 8")

DO $$
BEGIN
  -- Corrige vazamentos ou dados nulos deixados pela nossa query antiga na Auth Users
  -- O GoTrue (Supabase Auth) "quebra" quando tenta ler um email_change NULL ao invés de vazio ''
  UPDATE auth.users SET email_change = '' WHERE email_change IS NULL;
  
  -- Para campos de token e phone existem problemas de unicidade e schema,
  -- Então atualizar apenas o email_change que é o responsável pelo erro `Scan error on column index 8` já será suficiente.
END $$;

-- 1. Vá até o painel do seu Supabase.
-- 2. No menu lateral, clique em "Authentication" e depois em "Users".
-- 3. Caso queira excluir os usuários bugados, você já pode excluí-los sem dar erro (agora que rodamos a correção acima).
-- 4. Clique no botão "Add user" -> "Create new user" (se os usuários não existirem mais).
-- 5. Recrie-os com a senha "senha123":
--    - admin@arke.com
--    - time@arke.com
--    - cliente@arke.com
-- 6. APÓS CRIAR OS USUÁRIOS LÁ NO PAINEL, continue e rode A SEGUNDA PARTE deste script no SQL Editor para criar os perfis:

DO $$
DECLARE
  v_admin_id uuid;
  v_time_id uuid;
  v_cliente_id uuid;
  v_empresa_id uuid := gen_random_uuid();
BEGIN

  -- Pega os IDs gerados pelo próprio Supabase com segurança
  SELECT id INTO v_admin_id FROM auth.users WHERE email = 'admin@arke.com' LIMIT 1;
  SELECT id INTO v_time_id FROM auth.users WHERE email = 'time@arke.com' LIMIT 1;
  SELECT id INTO v_cliente_id FROM auth.users WHERE email = 'cliente@arke.com' LIMIT 1;

  IF v_admin_id IS NULL OR v_time_id IS NULL OR v_cliente_id IS NULL THEN
     RAISE EXCEPTION 'Os usuários ainda não foram criados no painel do Supabase! Crie-os primeiro em Authentication.';
  END IF;

  -- 1. Cria Empresa
  INSERT INTO public.clientes (id, nome, tipo)
  VALUES (v_empresa_id, 'Empresa Teste', 'keep')
  ON CONFLICT DO NOTHING;

  -- 2. Limpa perfis antigos para recriá-los
  DELETE FROM public.profiles WHERE id IN (v_admin_id, v_time_id, v_cliente_id);

  -- 3. Cria os Perfis na aplicação Arke
  INSERT INTO public.profiles (id, nome, role, cliente_id)
  VALUES
    (v_admin_id, 'Guilherme (Admin)', 'admin', NULL),
    (v_time_id, 'Ana (Time)', 'time', NULL),
    (v_cliente_id, 'João (Cliente)', 'cliente', v_empresa_id);

END $$;


