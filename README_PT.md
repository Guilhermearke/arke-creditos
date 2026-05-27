# 🎨 Arke Keep Créditos

**Sistema de gestão de créditos para a Arke** — plataforma B2B onde clientes gerenciam seus créditos mensais e acompanham entregas em tempo real.

![Status](https://img.shields.io/badge/status-beta%20%28Fase%201%29-blue)
![Stack](https://img.shields.io/badge/stack-Next.js%2BSupabase%2BVercel-purple)
![License](https://img.shields.io/badge/license-MIT-green)

---

## 🚀 Quick Start

### Pré-requisitos
- Node.js 18+
- Conta Supabase (gratuita)
- Git

### Instalação

```bash
# Clonar repositório
git clone https://github.com/Guilhermearke/arke-creditos.git
cd arke-creditos

# Instalar dependências
npm install

# Variáveis de ambiente já estão em .env.local
# Verificar em: .env.local

# Iniciar servidor dev
npm run dev
```

Acesse: **http://localhost:3000/auth/login**

---

## 📋 Setup Inicial (IMPORTANTE!)

Antes de logar, você precisa:

1. **Rodar o Schema SQL no Supabase**
   - 📖 Leia: [SETUP_SUPABASE.md](./SETUP_SUPABASE.md)
   - Copie `supabase/schema.sql` → SQL Editor do Supabase
   - Execute
   - Repita com `supabase/seed.sql`

2. **Criar usuário admin**
   - Supabase → Authentication → Add user
   - Depois criar seu perfil na tabela `profiles`

3. **Fazer login**
   - http://localhost:3000/auth/login
   - Email + senha que criou

**Tempo total:** ~5 minutos

Guia completo: [PRONTO_PARA_USAR.md](./PRONTO_PARA_USAR.md)

---

## 📊 Arquitetura

### Banco de Dados (Supabase PostgreSQL)

```
profiles          → Usuários (admin, cliente, time)
clientes          → Empresas clientes da Arke
planos            → Biblioteca de planos base
contratos         → Plano personalizado por cliente
ciclos            → Período mensal (créditos)
servicos          → Catálogo de serviços
entregas          → Registros de entrega
historico_creditos→ Log de movimentações
```

### Autenticação & Segurança

- **Auth:** Supabase Auth (email + senha)
- **RLS:** Row Level Security ativado
  - Admin vê tudo
  - Cliente vê apenas seus dados
  - Time vê apenas suas entregas

### Frontend

```
app/
├── (auth)/
│   └── login              → Página de autenticação
├── (admin)/
│   ├── dashboard          → Visão geral (MRR, créditos)
│   ├── clientes           → Gerenciar clientes
│   ├── servicos           → Biblioteca de serviços
│   ├── entregas           → Registrar entregas
│   └── time               → Membros do time
├── (cliente)/
│   └── meu-painel         → Painel do cliente
└── (time)/
    └── tarefas            → Tarefas atribuídas
```

---

## 🔄 Fluxo de Créditos

1. **Cliente contrata** plano (ex: 250 créditos/mês)
2. **Admin registra entrega** (ex: Criativo = 8 créditos)
3. **Sistema debita automaticamente** do ciclo
4. **Cliente vê saldo** atualizado em tempo real
5. **Ao vencer o mês**, ciclo fecha (créditos não usados são perdidos por padrão)

---

## 👥 Papéis (Roles)

### Admin (Guilherme, Lea)
- Criar/editar clientes
- Registrar entregas (debita créditos)
- Ajuste manual de créditos
- Visualizar dashboard financeiro

### Cliente
- Ver saldo de créditos
- Acompanhar entregas
- Histório de meses anteriores
- Não vê dados de outros clientes

### Time (Nicolas, Ana Júlia)
- Ver tarefas atribuídas
- Atualizar status de entregas
- Adicionar link de arquivo

---

## 📊 Dashboard Admin

**Estatísticas em tempo real:**
- MRR total (receita mensal recorrente)
- Clientes ativos
- Créditos consumidos este mês
- Entregas em andamento

**Ações rápidas:**
- Criar novo cliente + contrato
- Registrar entrega
- Gerenciar serviços
- Ajustar créditos

---

## 🎨 Design

**Identidade Arke** (para integrar depois):
- Cores: [pedido para Guilherme]
- Tipografia: Inter (Google Fonts)
- Ícones: Lucide React
- Componentes: Tailwind CSS (+ shadcn/ui depois)

**Paleta temporária:**
- Fundo: `#F8F8F6` (off-white quente)
- Texto: `#1A1A1A`
- Primário: `#2563EB` (azul)
- Sucesso: `#22C55E` (verde)

---

## 🛠️ Stack Técnico

| Layer | Tecnologia | Versão |
|-------|-----------|--------|
| **Frontend** | Next.js | 14 |
| **Styling** | Tailwind CSS | 4 |
| **Backend** | Supabase | - |
| **Database** | PostgreSQL | 15 |
| **Auth** | Supabase Auth | - |
| **Hosting** | Vercel | - |
| **Runtime** | Node.js | 18+ |

---

## 📈 Roadmap

### ✅ Fase 1 (Concluída)
- [x] Schema SQL com RLS
- [x] Autenticação
- [x] Middleware de proteção por role
- [x] Dashboard admin (stats)
- [x] Estrutura de pastas

### 📋 Fase 2 (Próxima)
- [ ] CRUD de clientes
- [ ] Modal criar contrato
- [ ] Tela do cliente (admin view)
- [ ] Modal registrar entrega + débito automático
- [ ] Ajuste manual de créditos

### 📋 Fase 3 (Sábado)
- [ ] Painel do cliente (`/cliente/meu-painel`)
- [ ] Design premium com cores Arke
- [ ] Responsivo mobile

### 📋 Fase 4 (Domingo)
- [ ] Painel do time (`/time/tarefas`)
- [ ] Testes e polish
- [ ] Deploy final Vercel

---

## 🔐 Segurança

- ✅ **RLS ativado** — dados são privados por role
- ✅ **Chaves separadas** — ANON_KEY no frontend, SERVICE_ROLE_KEY no servidor
- ✅ **Triggers automáticos** — débito de créditos sem exposição
- ✅ **Auditoria** — `historico_creditos` registra tudo
- ⚠️ **Não compartilhe** SERVICE_ROLE_KEY em públicos

---

## 📖 Documentação

| Arquivo | Descrição |
|---------|-----------|
| [PRONTO_PARA_USAR.md](./PRONTO_PARA_USAR.md) | Checklist de 5 minutos |
| [SETUP_SUPABASE.md](./SETUP_SUPABASE.md) | Como rodar o schema SQL |
| [FASE1_SETUP.md](./FASE1_SETUP.md) | Resumo técnico Fase 1 |
| [README.md](./README.md) | Este arquivo (English) |

---

## 🐛 Troubleshooting

**Erro: "Tabelas não existem"**
→ Você não rodou `supabase/schema.sql` ainda. Veja [SETUP_SUPABASE.md](./SETUP_SUPABASE.md)

**Erro: "Não consigo fazer login"**
→ Verifique se:
1. Criou usuário em `Authentication` → `Users`
2. Criou perfil em `profiles` com o email exato

**Erro: "Dados vazios"**
→ Rode `supabase/seed.sql` para popular serviços e planos

---

## 📞 Contato

**Desenvolvido por:** Claude Code (Anthropic)
**Data:** 21 de maio de 2026
**Para:** Arke Studio

---

## 📜 License

MIT — veja [LICENSE](./LICENSE) para detalhes.

---

**Pronto para começar?** 🚀

1. Configure o Supabase: [SETUP_SUPABASE.md](./SETUP_SUPABASE.md)
2. Faça o push: `bash PUSH_GITHUB.sh`
3. Teste localmente: `npm run dev`
4. Avise quando estiver pronto para Fase 2!
