-- skriptflip: analyses table
-- Speichert eingegebene Video-URL, Transkript und 3 Skript-Versionen pro Analyse-Job.

create table public.analyses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  video_url   text not null,
  status      text not null default 'pending'
              check (status in ('pending', 'downloading', 'transcribing', 'generating', 'done', 'error')),
  transcript  text,
  scripts     jsonb,
  error       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index analyses_user_created_idx
  on public.analyses (user_id, created_at desc);

-- RLS: jeder User sieht/editiert nur eigene Zeilen
alter table public.analyses enable row level security;

create policy "select own analyses"
  on public.analyses for select
  using (auth.uid() = user_id);

create policy "insert own analyses"
  on public.analyses for insert
  with check (auth.uid() = user_id);

create policy "update own analyses"
  on public.analyses for update
  using (auth.uid() = user_id);

create policy "delete own analyses"
  on public.analyses for delete
  using (auth.uid() = user_id);

-- updated_at automatisch pflegen
create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger analyses_touch_updated_at
  before update on public.analyses
  for each row execute function public.touch_updated_at();
