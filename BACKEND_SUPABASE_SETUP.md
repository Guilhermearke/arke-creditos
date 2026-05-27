# Backend Supabase - multiambiente

Rode os SQLs no Supabase SQL Editor nesta ordem:

1. `supabase/schema.sql`
2. `supabase/002_rich_tasks.sql`
3. `supabase/003_backend_multiambiente.sql`
4. `supabase/seed.sql`, se precisar recarregar dados iniciais

## O que a migração `003_backend_multiambiente.sql` garante

- Tabelas base para `profiles`, `clientes`, `planos`, `servicos`, `contratos`, `ciclos`, `entregas` e `historico_creditos`.
- Roles de autenticação: `admin`, `cliente` e `time`.
- RLS por ambiente:
  - `admin`: acesso operacional completo.
  - `time`: leitura operacional e criação/atualização de entregas.
  - `cliente`: leitura restrita aos próprios dados vinculados por `profiles.cliente_id`.
- Campos ricos de demanda em `entregas`: objetivo, briefing, formato, canais, referências, prazo, prioridade, briefing externo, arquivos e checklist.
- Saldo de créditos com `creditos_restantes` sincronizado por trigger.
- Criação transacional de entrega com débito e histórico via RPC `criar_entrega_com_debito`.
- Histórico de créditos com saldo antes/depois, entrega vinculada e usuário responsável.
- Trigger de criação automática de profile quando um usuário Auth é criado.

## Checklist pós-SQL

1. Crie ou edite o profile do primeiro administrador:

```sql
update public.profiles
set role = 'admin', ativo = true
where email = 'seu-email@dominio.com';
```

2. Para usuários cliente, vincule o `cliente_id`:

```sql
update public.profiles
set role = 'cliente', cliente_id = 'UUID_DO_CLIENTE', ativo = true
where email = 'cliente@dominio.com';
```

3. Para usuários do time:

```sql
update public.profiles
set role = 'time', ativo = true
where email = 'time@dominio.com';
```
