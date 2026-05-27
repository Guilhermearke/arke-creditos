alter table public.entregas
  add column if not exists objetivo text,
  add column if not exists briefing text,
  add column if not exists formato text,
  add column if not exists canais text[],
  add column if not exists referencias text,
  add column if not exists prazo date,
  add column if not exists prioridade text default 'media',
  add column if not exists link_briefing text,
  add column if not exists arquivos text,
  add column if not exists checklist jsonb default '[]'::jsonb;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'entregas_prioridade_check'
  ) then
    alter table public.entregas
      add constraint entregas_prioridade_check
      check (prioridade in ('baixa', 'media', 'alta', 'urgente'));
  end if;
end $$;

create index if not exists entregas_status_idx on public.entregas(status);
create index if not exists entregas_responsavel_status_idx on public.entregas(responsavel_id, status);
create index if not exists entregas_prazo_idx on public.entregas(prazo);
