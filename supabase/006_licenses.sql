-- skriptflip: licenses + digistore_events
-- Phase B — Lizenz-System.
--
-- licenses: 1:1 (oder 0:1) zu profiles, hält aktiven Plan eines Users.
--           lifetime → valid_until NULL (unbefristet)
--           yearly   → valid_until = Ablauf-Datum, wird bei Rebill verlängert
--
-- digistore_events: Audit-Log für eingehende Webhook-Events (Idempotenz + Debug).

-- =============================================================================
-- licenses
-- =============================================================================
create table public.licenses (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  email               text not null,
  type                text not null check (type in ('lifetime', 'yearly')),
  status              text not null default 'active'
                      check (status in ('active', 'cancelled', 'expired', 'refunded')),
  valid_until         timestamptz,                              -- NULL = unbefristet (lifetime)
  digistore_order_id  text not null,
  digistore_product_id text,
  last_event          text,                                     -- letztes Event (z.B. 'on_payment')
  last_event_at       timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (user_id)                                              -- ein aktiver Plan pro User
);

create index licenses_email_idx on public.licenses (email);
create index licenses_order_idx on public.licenses (digistore_order_id);

alter table public.licenses enable row level security;

-- User darf eigene Lizenz lesen
create policy "select own license"
  on public.licenses for select
  using (auth.uid() = user_id);

-- Admins dürfen alle Lizenzen lesen
create policy "admins select all licenses"
  on public.licenses for select
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- Schreiben passiert ausschließlich über Service-Role (Webhook + Admin-API).
-- Keine INSERT/UPDATE/DELETE-Policies → RLS blockt alle Client-Schreibversuche.

create trigger licenses_touch_updated_at
  before update on public.licenses
  for each row execute function public.touch_updated_at();

-- =============================================================================
-- digistore_events  (Audit + Idempotenz)
-- =============================================================================
create table public.digistore_events (
  id                  uuid primary key default gen_random_uuid(),
  event               text not null,                            -- on_payment, on_rebill, on_refund, ...
  order_id            text,
  product_id          text,
  buyer_email         text,
  raw                 jsonb not null,                           -- vollständiger Webhook-Body
  signature_ok        boolean not null,
  processed_ok        boolean not null default false,
  process_error       text,
  received_at         timestamptz not null default now()
);

create index digistore_events_order_idx on public.digistore_events (order_id);
create index digistore_events_received_idx on public.digistore_events (received_at desc);

-- Idempotenz: gleicher Event-Typ + Order-Id darf nur einmal als 'processed' gelten
create unique index digistore_events_dedup_idx
  on public.digistore_events (event, order_id)
  where processed_ok = true and order_id is not null;

alter table public.digistore_events enable row level security;

-- Nur Admins dürfen Events lesen
create policy "admins select events"
  on public.digistore_events for select
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );
