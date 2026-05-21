# 🚀 Deployment - Arke Keep

## Opção 1: Vercel (Recomendado - 5 minutos)

### Passos:

1. **Crie um repo no GitHub**
   ```bash
   git init
   git add .
   git commit -m "Arke Keep - Sistema de Créditos"
   git branch -M main
   git remote add origin https://github.com/SEU_USER/arke-creditos.git
   git push -u origin main
   ```

2. **No Vercel**
   - Vá para https://vercel.com/dashboard
   - Clique "Add New..." → "Project"
   - Selecione seu repo (arke-creditos)
   - Configure as variáveis de ambiente:
     ```
     NEXT_PUBLIC_SUPABASE_URL=https://wrowksnudzlwhbnzpfyz.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
     ```
   - Clique "Deploy"

3. **Pronto!** Seu app estará rodando em `https://arke-creditos.vercel.app`

---

## Opção 2: Docker Local

```bash
docker run -p 3000:3000 -v $(pwd):/app -w /app node:22 \
  sh -c "npm install && npm run build && npm start"
```

---

## Variáveis de Ambiente Necessárias

Adicione em `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://wrowksnudzlwhbnzpfyz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indyb3drc251ZHpsd2hibnpwZnl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzNzY3OTQsImV4cCI6MjA5NDk1Mjc5NH0.tQsJiVW83TSktKH_n-QcmKvJQoDPfbGyz_3vyugnb74
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indyb3drc251ZHpsd2hibnpwZnl6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTM3Njc5NCwiZXhwIjoyMDk0OTUyNzk0fQ.Tn3Ouq4edPPdPaLFVXttNRSmCP8006kYuCvdCRKjOgY
```

---

## Usando Vercel CLI (Alternativa)

```bash
npm install -g vercel
vercel login
cd /Users/guilhermearke/Documents/Arke\ projetos/arke-creditos
vercel --prod
```

---

## Credenciais de Teste

**Email Admin:** guilhermearke@gmail.com  
**Senha:** (conforme criado no Supabase)

---

## Estrutura do Projeto

```
arke-creditos/
├── app/
│   ├── auth/login/          # Página de login
│   ├── admin/               # Dashboards admin
│   ├── cliente/             # Painel cliente
│   ├── time/                # Tarefas time
│   └── layout.tsx           # Layout global
├── lib/
│   ├── supabase.ts         # Cliente Supabase
│   └── types.ts            # TypeScript types
├── middleware.ts            # Proteção de rotas
└── .env.local              # Variáveis de ambiente
```

---

## Troubleshooting

Se o servidor local não funciona (problema conhecido com Turbopack em macOS), use Docker ou Vercel.

Qualquer dúvida, check a documentação:
- [Next.js](https://nextjs.org/docs)
- [Vercel](https://vercel.com/docs)
- [Supabase](https://supabase.com/docs)
