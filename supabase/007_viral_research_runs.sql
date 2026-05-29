-- skriptflip: viral_research_runs
-- Viral-Research-Tool: speichert pro Nischen-Scan die gefundenen viralen Reels
-- (Apify) und die aggregierte Nischen-Analyse (Claude).
--
-- Das Repurpose eines einzelnen Reels legt KEINE neue Tabelle an, sondern erzeugt
-- eine Zeile in der bestehenden `analyses`-Tabelle → voller Downstream
-- (Hook-Varianten, Repurposing-Formate, Voiceover) funktioniert sofort weiter.

create table public.viral_research_runs (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  niche           text not null,
  platform        text not null default 'instagram'
                  check (platform in ('instagram', 'tiktok', 'youtube')),
  status          text not null default 'pending'
                  check (status in ('pending', 'scanning', 'analyzing', 'done', 'error')),
  reels           jsonb,        -- normalisierte Trefferliste (ReelHit[])
  niche_analysis  jsonb,        -- Aggregat-Analyse (NicheAnalysis)
  error           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index viral_research_runs_user_created_idx
  on public.viral_research_runs (user_id, created_at desc);

-- RLS: jeder User sieht/editiert nur eigene Zeilen
alter table public.viral_research_runs enable row level security;

create policy "select own viral_research_runs"
  on public.viral_research_runs for select
  using (auth.uid() = user_id);

create policy "insert own viral_research_runs"
  on public.viral_research_runs for insert
  with check (auth.uid() = user_id);

create policy "update own viral_research_runs"
  on public.viral_research_runs for update
  using (auth.uid() = user_id);

create policy "delete own viral_research_runs"
  on public.viral_research_runs for delete
  using (auth.uid() = user_id);

-- updated_at automatisch pflegen (touch_updated_at existiert bereits aus 001)
create trigger viral_research_runs_touch_updated_at
  before update on public.viral_research_runs
  for each row execute function public.touch_updated_at();
