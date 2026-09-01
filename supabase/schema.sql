-- Compassed schema.
-- Run this once in the Supabase SQL editor (Project → SQL Editor → New query).
--
-- Each row keeps the app's existing camelCase object as-is in `data` (jsonb),
-- so the client's model.js shapes don't need a parallel SQL schema to stay in
-- sync with. `user_id` + row level security is what makes each account's data
-- private; `goal_id` on entries/tasks exists so deleting a goal cascades.

create table if not exists public.goals (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.entries (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid not null references public.goals(id) on delete cascade,
  data jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid not null references public.goals(id) on delete cascade,
  data jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb
);

create index if not exists goals_user_id_idx on public.goals(user_id);
create index if not exists entries_user_id_idx on public.entries(user_id);
create index if not exists entries_goal_id_idx on public.entries(goal_id);
create index if not exists tasks_user_id_idx on public.tasks(user_id);
create index if not exists tasks_goal_id_idx on public.tasks(goal_id);

alter table public.goals enable row level security;
alter table public.entries enable row level security;
alter table public.tasks enable row level security;
alter table public.settings enable row level security;

create policy "own goals" on public.goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own entries" on public.entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own tasks" on public.tasks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own settings" on public.settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
