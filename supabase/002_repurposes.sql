-- skriptflip: repurposes table
-- Speichert Multi-Format-Versionen eines Quell-Skripts (TikTok-Hook, Reel, YT-Long, Tweet etc.)

create table public.repurposes (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references auth.users(id) on delete cascade,
  analysis_id           uuid references public.analyses(id) on delete cascade,
  source_script_index   smallint not null,
  source_script_title   text,
  source_script_text    text,
  formats               jsonb,
  status                text not null default 'pending'
                        check (status in ('pending', 'generating', 'done', 'error')),
  error                 text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index repurposes_analysis_idx
  on public.repurposes (analysis_id);
create index repurposes_user_created_idx
  on public.repurposes (user_id, created_at desc);

alter table public.repurposes enable row level security;

create policy "select own repurposes"
  on public.repurposes for select
  using (auth.uid() = user_id);

create policy "insert own repurposes"
  on public.repurposes for insert
  with check (auth.uid() = user_id);

create policy "update own repurposes"
  on public.repurposes for update
  using (auth.uid() = user_id);

create policy "delete own repurposes"
  on public.repurposes for delete
  using (auth.uid() = user_id);

create trigger repurposes_touch_updated_at
  before update on public.repurposes
  for each row execute function public.touch_updated_at();
