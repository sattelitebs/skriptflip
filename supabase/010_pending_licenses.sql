-- skriptflip: pending_licenses
-- Phase B — Lücke geschlossen: Käufe, die VOR der Registrierung passieren.
--
-- Funnel-Normalfall: Kauf via Digistore -> danach Registrierung auf
-- app.skriptflip.com. Zum Kaufzeitpunkt existiert noch kein profiles-Eintrag,
-- also kann noch keine licenses-Zeile (user_id NOT NULL) angelegt werden.
-- Der Webhook parkt das Entitlement hier per E-Mail; beim ersten eingeloggten
-- Seitenaufruf wird es in licenses übernommen (Claim, siehe src/lib/auth/access.ts)
-- und mit claimed_at markiert.

create table public.pending_licenses (
  id                   uuid primary key default gen_random_uuid(),
  email                text not null,
  type                 text not null check (type in ('lifetime', 'yearly')),
  status               text not null default 'active'
                       check (status in ('active', 'cancelled', 'expired', 'refunded')),
  valid_until          timestamptz,                 -- NULL = unbefristet (lifetime)
  digistore_order_id   text not null unique,        -- Idempotenz je Bestellung
  digistore_product_id text,
  last_event           text,
  last_event_at        timestamptz,
  claimed_at           timestamptz,                 -- gesetzt, sobald in licenses übernommen
  created_at           timestamptz not null default now()
);

create index pending_licenses_email_idx on public.pending_licenses (lower(email));

alter table public.pending_licenses enable row level security;

-- Nur Service-Role (Webhook + Claim laufen serverseitig) und Admins.
create policy "admins select pending licenses"
  on public.pending_licenses for select
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );
