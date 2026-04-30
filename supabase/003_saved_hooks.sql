-- skriptflip: saved_hooks
-- Persönliche Hook-Bibliothek pro User. Quelle kann eine Analyse oder freie Eingabe sein.

create table public.saved_hooks (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references auth.users(id) on delete cascade,
  hook                  text not null,
  pattern               text check (pattern in ('frage','schock','versprechen','zahl','story','andere')),
  notes                 text,
  source_analysis_id    uuid references public.analyses(id) on delete set null,
  source_script_index   smallint,
  created_at            timestamptz not null default now()
);

create index saved_hooks_user_created_idx
  on public.saved_hooks (user_id, created_at desc);

alter table public.saved_hooks enable row level security;

create policy "select own saved_hooks"
  on public.saved_hooks for select
  using (auth.uid() = user_id);

create policy "insert own saved_hooks"
  on public.saved_hooks for insert
  with check (auth.uid() = user_id);

create policy "update own saved_hooks"
  on public.saved_hooks for update
  using (auth.uid() = user_id);

create policy "delete own saved_hooks"
  on public.saved_hooks for delete
  using (auth.uid() = user_id);
