-- skriptflip: voiceovers
-- Speichert TTS-Generierungen. MP3 liegt im privaten Storage-Bucket "voiceovers".

create table public.voiceovers (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references auth.users(id) on delete cascade,
  analysis_id           uuid references public.analyses(id) on delete cascade,
  source_script_index   smallint,
  source_text           text,
  voice                 text,
  storage_path          text,
  duration_seconds      numeric,
  status                text not null default 'pending'
                        check (status in ('pending','generating','done','error')),
  error                 text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index voiceovers_analysis_idx on public.voiceovers (analysis_id);
create index voiceovers_user_created_idx on public.voiceovers (user_id, created_at desc);

alter table public.voiceovers enable row level security;

create policy "select own voiceovers"
  on public.voiceovers for select using (auth.uid() = user_id);
create policy "insert own voiceovers"
  on public.voiceovers for insert with check (auth.uid() = user_id);
create policy "update own voiceovers"
  on public.voiceovers for update using (auth.uid() = user_id);
create policy "delete own voiceovers"
  on public.voiceovers for delete using (auth.uid() = user_id);

create trigger voiceovers_touch_updated_at
  before update on public.voiceovers
  for each row execute function public.touch_updated_at();

-- Storage-Bucket privat, Server-side upload mit Service-Role
insert into storage.buckets (id, name, public)
values ('voiceovers', 'voiceovers', false)
on conflict (id) do nothing;
