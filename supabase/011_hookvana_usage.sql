-- skriptflip / Hookvana: hookvana_usage
-- Server-seitiger Gratis-Zähler für den öffentlichen KI-Hook-Umbau.
-- Ein Gratisnutzer bekommt 3 KI-Umbauten pro E-Mail; zusätzlich ein Tages-
-- Deckel pro IP-Hash gegen Wegwerf-Mail-Farming.
-- Zugriff NUR serverseitig über die Service-Role (API-Route). Daher KEINE
-- public Policies — RLS an, Tabelle für anon/auth dicht.

-- Eine Zeile pro E-Mail (lowercased) → Unique auf email für Upsert (ON CONFLICT).
-- ip_hash ist ein SHA-256 der Nutzer-IP (kein Klartext gespeichert).
create table public.hookvana_usage (
  id          uuid primary key default gen_random_uuid(),
  email       text not null unique,
  ip_hash     text,
  free_used   integer not null default 0,
  last_used   timestamptz not null default now(),
  created_at  timestamptz not null default now()
);

-- IP-Deckel-Abfrage: "wie viele Trial-Mails kamen von dieser IP zuletzt".
create index hookvana_usage_ip_recent_idx
  on public.hookvana_usage (ip_hash, last_used);

alter table public.hookvana_usage enable row level security;
-- Keine Policies: nur Service-Role (admin client) darf lesen/schreiben.
