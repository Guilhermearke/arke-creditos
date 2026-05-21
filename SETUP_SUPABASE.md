# Setup Supabase — Schema e Seed

## ✅ Seu projeto Supabase já está criado
- **URL:** https://wrowksnudzlwhbnzpfyz.supabase.co
- **ID do Projeto:** wrowksnudzlwhbnzpfyz
- **Chaves já configuradas** em `.env.local`

---

## 📋 Passo 1: Rodar o Schema SQL

1. **Abra** https://app.supabase.com e entre com sua conta
2. **Selecione** o projeto `wrowksnudzlwhbnzpfyz`
3. **No menu lateral**, clique em **SQL Editor** (ícone `<>`)
4. Clique em **New Query**
5. **Limpe** o código padrão e copie TUDO que está abaixo:

```sql
-- Copie TODO O CONTEÚDO DE: supabase/schema.sql
```

6. **Cole** aqui o conteúdo do arquivo `/supabase/schema.sql` do projeto
7. Clique no botão **▶️ Run** (ou Ctrl+Enter)
8. Aguarde até aparecer ✅ (pode levar 10-15 segundos)

**Se der erro:**
- Ignore erros de `relation already exists` — significa que já foi executado
- Outros erros: copie a mensagem e envie

---

## 📋 Passo 2: Rodar o Seed (Dados Iniciais)

1. **Mesmo painel de SQL Editor**
2. Clique em **New Query** novamente
3. **Cole** TODO o conteúdo do arquivo `/supabase/seed.sql`
4. Clique em **▶️ Run**
5. Aguarde ✅

**O que foi inserido:**
- 3 planos (Essential, Scale, Boost)
- 16 serviços (criativos, vídeos, motions, impressos)

---

## 📋 Passo 3: Criar Usuário Admin

1. **No painel do Supabase**, vá em **Authentication** (menu lateral)
2. Clique em **Users** → **Add user** (botão azul no topo)
3. **Email:** seu@email.com (exemplo: `guilherme@arke.studio`)
4. **Password:** Gere uma segura (copie e guarde!)
5. **Clique em "Create user"**

---

## 📋 Passo 4: Criar Perfil do Admin no Banco

Esse é o passo crítico — sem isso, o usuário não consegue fazer login!

1. **No SQL Editor**, clique em **New Query**
2. **Cole** este SQL:

```sql
INSERT INTO profiles (id, nome, role, created_at)
SELECT id, 'Admin', 'admin', now()
FROM auth.users
WHERE email = 'seu@email.com'  -- MUDE PARA O EMAIL QUE CRIOU ACIMA
ON CONFLICT DO NOTHING;
```

3. **Mude `seu@email.com`** para o email exato que criou no passo anterior
4. **Clique em ▶️ Run**

**Verifique se funcionou:**
- Vá em **Database** → **tables** → **profiles**
- Deve aparecer uma linha com seu email e role = `admin`

---

## ✅ Pronto! Agora pode testar

```bash
cd ~/Documents/"Arke projetos"/arke-creditos
npm run dev
```

Acesse: **http://localhost:3000/auth/login**
- Email: `seu@email.com`
- Senha: a que gerou no passo 3

Deve redirecionar para `/admin/dashboard` ✅

---

## 🔍 Troubleshooting

### "Erro: relation "clientes" does not exist"
→ Você não rodou o `schema.sql` ainda. Refaça o Passo 1.

### "Erro ao fazer login / erro de autenticação"
→ Verifique se:
1. O usuário foi criado em `Authentication` → `Users`
2. O perfil foi criado em `profiles` com o EMAIL EXATO

### "Tabelas existem mas parecem vazias"
→ Rode o `seed.sql` (Passo 2)

---

## 📊 Como verificar que tudo está OK

No SQL Editor, rode:

```sql
-- Verificar tabelas
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' ORDER BY table_name;

-- Verificar serviços (deve ter 16)
SELECT COUNT(*) FROM servicos;

-- Verificar planos (deve ter 3)
SELECT COUNT(*) FROM planos;

-- Verificar seu perfil
SELECT id, nome, role FROM profiles WHERE role = 'admin';
```

---

*Criado automaticamente — 21/05/2026*
