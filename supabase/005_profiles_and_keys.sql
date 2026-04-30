-- skriptflip: profiles + user_api_keys
-- Phase A — Member-System mit Admin-Rolle und User-eigenen API-Keys.
--
-- profiles: 1:1 zu auth.users, hält Rolle (user|admin) und blocked-Flag.
-- user_api_keys: pro User je Provider ein verschlüsselter Key (AES-256-GCM)
--                + key_hint (letzte 4 Zeichen) für UI-Anzeige.

-- =============================================================================
-- profiles
-- =============================================================================
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  role        text not null default 'user' check (role in ('user', 'admin')),
  blocked     boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index profiles_email_idx on public.profiles (email);

alter table public.profiles enable row level security;

-- User darf eigenes Profil lesen
create policy "select own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- User darf eigenes Profil aktualisieren (aber NICHT role/blocked — siehe Trigger unten)
create policy "update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Admins dürfen alle Profile lesen
create policy "admins select all"
  on public.profiles for select
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- Admins dürfen alle Profile updaten
create policy "admins update all"
  on public.profiles for update
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- Trigger: nicht-Admins können role/blocked NICHT ändern
-- Ausnahme: Service-Role / SQL-Editor (auth.uid() IS NULL) → durchlassen,
-- damit Server-seitige Admin-Aktionen und initiales Bootstrapping funktionieren.
create or replace function public.protect_profile_admin_fields()
returns trigger as $$
declare
  caller_uid uuid;
  caller_role text;
begin
  caller_uid := auth.uid();
  if caller_uid is null then
    return new;
  end if;
  select role into caller_role from public.profiles where id = caller_uid;
  if caller_role is null or caller_role <> 'admin' then
    new.role := old.role;
    new.blocked := old.blocked;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger profiles_protect_admin_fields
  before update on public.profiles
  for each row execute function public.protect_profile_admin_fields();

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Auto-Insert: bei jedem neuen auth.users-Eintrag → Profil anlegen
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Bestehende Auth-User nachziehen
insert into public.profiles (id, email)
select id, email from auth.users
on conflict (id) do nothing;

-- =============================================================================
-- user_api_keys
-- =============================================================================
create table public.user_api_keys (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  provider        text not null check (provider in ('openai', 'anthropic')),
  encrypted_key   text not null,         -- AES-256-GCM Ciphertext (base64)
  iv              text not null,         -- Init-Vector (base64)
  auth_tag        text not null,         -- GCM-Auth-Tag (base64)
  key_hint        text not null,         -- letzte 4 Zeichen für UI-Anzeige
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (user_id, provider)
);

create index user_api_keys_user_idx on public.user_api_keys (user_id);

alter table public.user_api_keys enable row level security;

-- Nur User selbst sieht seine Keys (Server liest entschlüsselt nur via Service-Role)
create policy "select own keys"
  on public.user_api_keys for select
  using (auth.uid() = user_id);

create policy "insert own keys"
  on public.user_api_keys for insert
  with check (auth.uid() = user_id);

create policy "update own keys"
  on public.user_api_keys for update
  using (auth.uid() = user_id);

create policy "delete own keys"
  on public.user_api_keys for delete
  using (auth.uid() = user_id);

create trigger user_api_keys_touch_updated_at
  before update on public.user_api_keys
  for each row execute function public.touch_updated_at();
