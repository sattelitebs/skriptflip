-- skriptflip: webinar_signups.slot nachrüsten
-- Für bereits laufende DBs, in denen 008 ohne die slot-Spalte angelegt wurde.
-- Idempotent: kann gefahrlos mehrfach ausgeführt werden.

alter table public.webinar_signups
  add column if not exists slot text;
