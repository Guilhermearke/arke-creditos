# Arke Keep Créditos — Setup Fase 1

## Status: ✅ Pronto para Fase 2

Este documento descreve o que foi feito na Fase 1 e o que você precisa fazer agora.

---

## ✅ O que foi feito

### Supabase
- ✅ Schema SQL completo com tabelas: `profiles`, `clientes`, `planos`, `contratos`, `ciclos`, `servicos`, `entregas`, `historico_creditos`
- ✅ Row Level Security (RLS) policies por role (admin, cliente, time)
- ✅ Índices de performance
- ✅ Triggers automáticos para atualizar créditos
- 📁 Arquivo: `supabase/schema.sql`

### Next.js + Autenticação
- ✅ Projeto Next.js 14 com App Router
- ✅ Tailwind CSS + tipografia Inter
- ✅ Supabase Auth integrado (SSR)
- ✅ Middleware com proteção por role
- ✅ Página de login (`/auth/login`)
- ✅ Redirecionamento automático por role

### Estrutura de Pastas
```
app/
  /(auth)
    /login
  /(admin)
    /dashboard           ✅
    /clientes
    /clientes/novo
    /clientes/[id]
    /servicos
    /entregas
    /time
  /(cliente)
    /meu-painel
  /(time)
    /tarefas
```

### Dados Iniciais (Seed)
- 📁 Arquivo: `supabase/seed.sql`
- 16 serviços com categorias (estático, vídeo, motion, impresso)
- 3 planos base (Essential, Scale, Boost)

---

## ⚙️ O que você precisa fazer AGORA

### 1️⃣ **Criar repositório no GitHub**
```bash
# Via web: https://github.com/new
# Crie um repositório público chamado "arke-creditos"
```

### 2️⃣ **Fazer push do código**
```bash
cd ~/Documents/"Arke projetos"/arke-creditos
git remote add origin https://github.com/SEU_USER/arke-creditos.git
git branch -M main
git push -u origin main
```

### 3️⃣ **Rodar o schema SQL no Supabase** (CRÍTICO!)
```
1. Vá para: https://app.supabase.com
2. Seu projeto: wrowksnudzlwhbnzpfyz
3. SQL Editor → New Query
4. Copie TUDO de: supabase/schema.sql
5. Cole e execute (botão ▶️)
6. Repita com: supabase/seed.sql
```

### 4️⃣ **Criar usuário admin no Supabase**
```
1. No painel do Supabase: Authentication → Users
2. Create user
   - Email: seu@email.com
   - Password: gerar uma segura
3. Salve esse email/senha — você vai usar para logar
```

### 5️⃣ **Criar perfil do admin**
```sql
-- Rodar no SQL Editor do Supabase:
INSERT INTO profiles (id, nome, role)
SELECT id, 'Admin', 'admin'
FROM auth.users
WHERE email = 'seu@email.com';
```

### 6️⃣ **Testar localmente**
```bash
cd ~/Documents/"Arke projetos"/arke-creditos
npm run dev
# Acesse: http://localhost:3000/auth/login
# Faça login com o email/senha que criou
# Deve redirecionar para /admin/dashboard
```

### 7️⃣ **Deploy no Vercel**
```
1. Vá para: https://vercel.com
2. Import do repositório que acabou de criar
3. Adicione as variáveis de ambiente:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY
4. Deploy
```

---

## 📊 Dashboard Admin — O que já está funcionando

✅ **Estatísticas em tempo real:**
- Clientes ativos
- MRR total
- Créditos consumidos este mês
- Entregas em andamento

✅ **Links de navegação:**
- Clientes (gerenciar, criar)
- Serviços (biblioteca)
- Entregas (registrar, acompanhar)
- Time (membros)

---

## 🔧 Stack de produção

| Componente | Ferramenta | Status |
|---|---|---|
| Frontend | Next.js 14 | ✅ |
| Banco de dados | Supabase PostgreSQL | ✅ |
| Autenticação | Supabase Auth | ✅ |
| Hospedagem | Vercel | 📋 Próximo |
| CDN | Vercel Edge | 📋 Próximo |

---

## 🎯 Próximas fases

### Fase 2 (amanhã)
- [ ] CRUD completo de clientes
- [ ] Modal de criar contrato
- [ ] Tela de cliente (admin view) com saldo
- [ ] Modal de registrar entrega com débito automático
- [ ] Ajuste manual de créditos

### Fase 3 (sábado)
- [ ] Painel do cliente (`/cliente/meu-painel`)
- [ ] Design premium com identidade Arke
- [ ] Responsivo mobile

### Fase 4 (domingo)
- [ ] Painel do time (`/time/tarefas`)
- [ ] Atualizações de status
- [ ] Testes de fluxo completo
- [ ] Deploy final

---

## 🆘 Troubleshooting

**Erro: "Não consigo fazer login"**
→ Verifique se você criou o usuário no Supabase AND o perfil na tabela `profiles`

**Erro: "Tabelas não existem"**
→ Verifique se rodou o `schema.sql` completo no SQL Editor do Supabase

**Erro: "CORS ou erro de conexão"**
→ Verifique as variáveis de ambiente `.env.local`

---

## 📝 Notas importantes

1. **RLS está ativado** — o sistema só retorna dados que o usuário logado tem permissão de ver
2. **Triggers automáticos** — ao criar uma entrega, créditos são debitados automaticamente
3. **Ciclos automáticos** — ao cadastrar um contrato, um ciclo do mês atual é criado
4. **Sem shadcn/ui ainda** — usando HTML puro + Tailwind por enquanto, fácil migrar depois

---

*Gerado automaticamente pelo Claude Code — 21/05/2026*
