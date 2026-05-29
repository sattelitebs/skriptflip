-- skriptflip: webinar_signups
-- Opt-in-Anmeldungen für das kostenlose Live-Webinar (Funnel Stufe 1).
-- Inserts laufen serverseitig über die Service-Role (API-Route), daher KEINE
-- public Policies — RLS an, Tabelle für anon/auth dicht.

-- email wird serverseitig immer lowercased gespeichert → Unique direkt auf die
-- Spalte, damit ON CONFLICT (email) im Upsert greift.
create table public.webinar_signups (
  id          uuid primary key default gen_random_uuid(),
  email       text not null unique,
  name        text,
  source      text,          -- z.B. 'webinar-optin', Kampagnen-Tag
  created_at  timestamptz not null default now()
);

alter table public.webinar_signups enable row level security;
-- Keine Policies: nur Service-Role (admin client) darf lesen/schreiben.
