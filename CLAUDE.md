@AGENTS.md

# skriptflip — Projekt-Status

**Was:** SaaS, virale Videos (TikTok/IG/YT) per KI analysieren und 3 eigene Skript-Versionen liefern. **Modell-Switch (entschieden 2026-04-29):** keine Abos mehr — User kauft Lifetime oder Jahresabo, nutzt eigene API-Keys (OpenAI + Claude). Domain `skriptflip.com` (Namecheap, gekauft 2026-04-28).

## Stack
- Next.js 16 (App Router, src/, Tailwind v4, TypeScript)
- Supabase (Auth + Postgres, RLS an, Storage-Bucket `voiceovers`)
- Resend (Custom SMTP, Domain `skriptflip.com` verifiziert)
- OpenAI (aktuell zentral, später User-Keys) für Whisper + TTS
- Anthropic Claude Sonnet 4.6 (aktuell zentral, später User-Keys)
- yt-dlp + ffmpeg lokal (Server-Hosting muss Long-Running unterstützen — kein Vercel)

## Wichtig — Next.js 16 Eigenheiten
- `middleware.ts` heißt jetzt **`proxy.ts`**, Funktion `proxy()` statt `middleware()`
- Tailwind v4: `@theme inline` in CSS, kein tailwind.config.js, `@tailwindcss/typography`-Plugin greift hier nicht zuverlässig (eigene react-markdown-Komponenten nutzen)
- AGENTS.md warnt: bei Unsicherheit `node_modules/next/dist/docs/` lesen, nicht aus Erinnerung schreiben

## Stand 2026-04-30 — Code-Features fertig

| Feature | Status | Dateien |
|---|---|---|
| Landingpage, Impressum, Datenschutz | ✓ | `src/app/page.tsx`, `src/app/impressum`, `src/app/datenschutz` |
| Auth (Login/Register/Logout/Confirm) | ✓ | `src/app/(auth)`, `src/app/auth/confirm/route.ts` |
| Skript-Pipeline (yt-dlp → Whisper → Claude) | ✓ | `src/lib/pipeline/{download,transcribe,generate}.ts` + `src/app/api/analyze/route.ts` |
| Repurposing-Engine (8 Format-Versionen) | ✓ | `src/lib/pipeline/repurpose.ts` + `src/app/api/analyses/[id]/repurpose/route.ts` |
| Hook-A/B-Generator + Bibliothek | ✓ | `src/lib/pipeline/hook-variants.ts` + `src/app/api/analyses/[id]/hook-variants/route.ts` + `src/app/api/saved-hooks/` + `src/app/dashboard/hooks/` |
| Voiceover (OpenAI TTS, 6 Stimmen) | ✓ | `src/lib/pipeline/voiceover.ts` + `src/app/api/analyses/[id]/voiceover/route.ts` + Storage-Bucket `voiceovers` |
| Resend SMTP via Supabase | ✓ | gebrandete Templates schwarz/gelb |

**Schemas in Supabase ausgeführt:** 001_analyses, 002_repurposes, 003_saved_hooks, 004_voiceovers (inkl. Bucket).

**Schema 005_profiles_and_keys.sql liegt vor — muss in Supabase ausgeführt werden, bevor Phase A live geht.** Enthält:
- `profiles` (id, email, role[user|admin], blocked) — Trigger legt für jeden auth.user automatisch ein Profil an
- `user_api_keys` (verschlüsselte OpenAI- und Anthropic-Keys, AES-256-GCM)
- RLS-Policies + Admin-Field-Protection-Trigger

**Nach Migration:** Den eigenen User in Supabase manuell auf `role='admin'` setzen, sonst ist /dashboard/admin gesperrt.

## Phase A — User-API-Keys + Member-System (fertig 2026-04-30)

| Feature | Status | Dateien |
|---|---|---|
| AES-256-GCM Encryption-Lib | ✓ | `src/lib/crypto/keys.ts`, `src/lib/crypto/user-keys.ts` |
| Settings-Page (Key-Eingabe + Test) | ✓ | `src/app/dashboard/settings/`, `src/app/api/settings/keys/` |
| Onboarding-Banner im Dashboard | ✓ | `src/app/dashboard/page.tsx` |
| Auth-Gating in Pipelines | ✓ | `src/lib/auth/access.ts` (alle 4 Pipeline-Routes geschützt) |
| Pipeline-Refactor auf User-Keys | ✓ | alle 6 Pipelines `transcribe.ts`, `generate.ts`, `repurpose.ts`, `hook-variants.ts`, `voiceover.ts` (download nutzt keinen Key) nehmen `apiKey`-Parameter |
| Admin-Dashboard | ✓ | `src/app/dashboard/admin/`, `src/app/api/admin/users/[id]/route.ts` |

**Neue env-Variable:** `API_KEY_ENCRYPTION_SECRET` (64 Hex-Zeichen, generiert via `openssl rand -hex 32`). MUSS auf Production identisch sein, sonst sind alle gespeicherten Keys unbrauchbar.

## Stand 2026-05-29 — Webinar-Funnel + Lizenz/Onboarding LIVE

**Alles auf `main` gemergt und via Coolify auf skriptflip.com deployt.**

### Webinar-Funnel (Startseite)
- Startseite `src/app/page.tsx` ist die **Webinar-Opt-in-Seite** (3-Hebel-Story Radar/Hook/Verkauf, USP „viraler Content, der verkauft").
- Anmeldung über **4leads-Formular als Popup** (`src/components/WebinarSignupModal.tsx`): Button öffnet Overlay, Schließen per X / Backdrop / Escape. Das Formular ist ein 4leads-**iframe** (cross-origin → Feld- und Anzeige-Logik NUR in 4leads konfigurierbar, nicht im App-Code; rotes •••-Kästchen war ein Browser-Passwortmanager, kein Bug).
- **Terminierung + ALLE Webinar-Mails laufen über WebinarJam** (4leads erfasst den Lead und übergibt an WebinarJam). Nicht im App-Code.
- Dankeseite `/danke` (`src/app/danke/page.tsx`, noindex) — Redirect-Ziel nach Anmeldung.
- Verkaufsseite `/angebot` (`src/app/angebot/page.tsx`): Digistore-Produkt **646049** verdrahtet (alle 3 Preis-Stufen zeigen vorerst dasselbe Produkt; verbindlicher Preis steht auf der Digistore-Bestellseite). Preis-Zahlen auf der Seite sind Platzhalter — **Preis war 2026-05-29 noch nicht final**.

### Viral-Research-Tool (PR #1)
- `/dashboard/viral-research`: Nischen-Scan → Sales-Radar (Bewertung nach Verkaufspotenzial statt Reichweite) → 3 Skripte je Treffer in `analyses`. Hybrid-Datenquelle YouTube Data API (`YOUTUBE_API_KEY`) + optional Apify (`APIFY_TOKEN`).

### Lizenz + Kunden-Onboarding (= Phase B, fertig)
- `licenses` + `pending_licenses` + `digistore_events`; `src/lib/auth/access.ts` (Gating + claim-on-login).
- Digistore-Webhook `/api/webhooks/digistore` (SHA-512-Sig, Event-Routing, idempotent gegen Retries).
- **Kauf → Auto-Account + Zugangs-Mail:** `src/lib/auth/provision.ts` — kein Account → Supabase `inviteUserByEmail` (Passwort-Mail), Account vorhanden → Magic-Link. Versand über Supabase-Auth-Templates (Resend-SMTP), kein separater Key.
- **Set-Password-Seite** `/auth/set-password`; `auth/confirm` leitet invite/recovery dorthin.
- **Admin** `/dashboard/admin`: sperren/entsperren, Admin-Rolle, **Lizenz vergeben (Lifetime/Jahr) + Mail**, „Lizenz entziehen", „Mail erneut".

### Mail-Vorlagen
- `docs/webinar-mailsequenz.md`: 8 Webinar-Mails (4 vor / 4 nach → in WebinarJam) + Cart-Abandon (9) + Post-Sale-Onboarding (10).

### Neue env-Variablen (Coolify-Prod setzen)
- `DIGISTORE_PASSPHRASE`, `DIGISTORE_LIFETIME_PRODUCT_IDS`, `DIGISTORE_YEARLY_PRODUCT_IDS`
- `NEXT_PUBLIC_SITE_URL=https://skriptflip.com`
- `YOUTUBE_API_KEY` (empfohlen) + optional `APIFY_TOKEN` / `APIFY_*_ACTOR`

### Supabase-Migrationen NEU (ausführen, falls noch nicht): 006_licenses, 007_viral_research_runs, 008_webinar_signups, 010_pending_licenses

### ⚠️ Manuelle Supabase-Konfig, sonst kommen die Onboarding-Mails nicht an (kein Code):
- Auth → URL Configuration → **Redirect URLs**: `https://skriptflip.com/auth/set-password` + `https://skriptflip.com/dashboard`
- Auth → **Email-Templates** „Invite user" + „Magic Link" gebrandet/aktiv prüfen

## Strategische Entscheidungen (gelockt 2026-04-29)

### Geschäftsmodell
- **Kein Stripe-Abo.** Stattdessen: Digistore-Verkauf, Mentortools für Member-Bereich
- **Preis-Modell parallel:**
  - Lifetime Earlybird: **197€**
  - Lifetime regulär (nach Earlybird-Phase): **297€**
  - Jahresabo: **97€/Jahr**
- **User bringt eigene API-Keys** (OpenAI + Claude). Speicherung verschlüsselt in DB, Pipelines nutzen User-Keys statt zentrale env. Du (Torsten) zahlst nur Hosting (~8,50 €/Mon Hetzner), keine API-Kosten.
- **Hosting:** Hetzner Cloud CPX22 (8,49 €/Mon, 4GB RAM, 2 vCPU, Datacenter Nürnberg) + Coolify als Deploy-Layer. DSGVO-Plus für deutsche User. NICHT Vercel (yt-dlp braucht Long-Running-Prozesse).

### Member-System
- User loggt sich in skriptflip.com ein → Settings-Bereich → API-Keys einfügen → Pipelines aktiv
- Admin (Torsten) sieht User-Liste: Email, Plan-Status, letzte Aktivität, kann sperren/freischalten
- Lizenz-Tabelle: Digistore-Webhook → User wird auf "aktiv" gesetzt nach Kauf
- Ohne aktive Lizenz: Login geht, Generieren nicht

### HeyGen-Integration (Phase Pro, später)
- User-Plan: Creator+ ($29/Mon) — User bringt seinen Key
- Avatar-Video aus Voiceover via HeyGen-API
- Photo-Avatar muss in HeyGen vorab existieren

## OFFENE TO-DOs (in dieser Reihenfolge)

### Phase A — Code-Refactor zu User-API ✓ ERLEDIGT (2026-04-30)
Code-seitig komplett. Offen: 005-Migration in Supabase ausführen, eigenen User auf admin setzen, Settings-Flow mit echtem User durchtesten.

### Phase B — Lizenz-System ✓ ERLEDIGT (2026-05-29)
- ~~Tabelle `licenses` + `pending_licenses` + `digistore_events`~~ ✓
- ~~Digistore-Webhook `/api/webhooks/digistore` → Lizenz-Aktivierung~~ ✓ (SHA-512, idempotent)
- ~~Auth-Gating: keine aktive Lizenz = gesperrt~~ ✓ (`src/lib/auth/access.ts`)
- ~~Kauf → Auto-Account + Zugangs-Mail + Admin-Lizenzvergabe~~ ✓ (`src/lib/auth/provision.ts`)
- Offen: nur noch Live-Test (echter Test-Kauf / Admin-Freischalten) + Supabase-Redirect-URLs/Templates (s. o.)

### Phase C — Server-Setup ✓ ERLEDIGT (2026-05-01)
- ~~Auth-Confirm-Bug~~ ✓ gefixt
- ~~Server~~ ✓ Hetzner CPX22 Nürnberg (8,49 €/Mo) statt DigitalOcean
- ~~Coolify~~ ✓ v4.0.0 läuft auf 178.105.60.119:8000
- ~~Domain~~ ✓ skriptflip.com + www auf Server-IP, SSL via Let's Encrypt
- ~~Deploy~~ ✓ via GitHub-Repo sattelitebs/skriptflip + Dockerfile (yt-dlp + ffmpeg + Node 22)
- ~~Supabase URL-Config~~ ✓ auf https://skriptflip.com

### Phase D — HeyGen-Integration (~13-17h, separates Feature)
12. DB-Schema: `heygen_videos` Tabelle + Storage-Bucket `videos`
13. HeyGen-API-Wrapper: Audio-Upload + Generate + Polling + Download
14. UI: Avatar-Picker (List-API), Render-Button im Voiceover-Bereich, Status-Anzeige
15. HeyGen-API-Key in User-Settings

### Phase E — Verkaufsmappe (analog Aivatar Empire, in eigener Session)
16. ~~Verkaufsseite~~ ✓ `/angebot` (Brand Gelb/Schwarz) — Preise final eintragen, wenn entschieden
17. ~~Mail-Sequenzen~~ ✓ `docs/webinar-mailsequenz.md` (8 Webinar-Mails + Cart-Abandon + Onboarding)
18. Werbeanzeigen-Texte
19. Affiliate-Seite Digistore
20. ~~Dankesseite + Onboarding-Mails~~ ✓ `/danke` + Mail 10 (Onboarding)

## Stil-Regeln (vom User)
- **PFLICHT vor jeder Copy/Seite/Funnel:** `docs/persona-torsten-jaeger.md` lesen — Story, Tonalität, Zielgruppe, Schmerzpunkte, Markenkern. Verbindliche Stimme: direkt, ehrlich, Du-Form, „ohne Bullshit", erfahrener Freund statt Guru.
- Komplett deutsch
- Brand-Farben: Gelb `#FEDC31`, Schwarz `#000`, Weiß (NICHT mit Empire-Lila verwechseln — das ist andere Marke)
- Bold All-Caps für Hooks
- **Tabu:** Wort „klauen"/„klau" — User lehnt ab. Stattdessen: „lernen von", „nachbauen", „verstehen"
- **Falsch:** „Schick uns einen Link" → korrekt: „Füge einen Link ein"
- Footer **ohne** „Torsten Jaeger Online Marketing", nur „© skriptflip"
- Story-driven, krasse Hooks mit Zahlen, kein KI-Sound, keine Emojis

## Dev-Server
Läuft via Preview-MCP, Eintrag `skriptflip` in `/Users/ich/Claude/.claude/launch.json` (bash-Wrapper, weil PATH zu Homebrew-Node sonst fehlt).

Start: Preview-MCP → `preview_start name=skriptflip` → http://localhost:3000

## Secrets
- `.env.local` (gitignored): Supabase URL + Anon + Service-Role + OpenAI + Anthropic
- Resend-API-Key sitzt **nur** in Supabase SMTP-Settings
- **WICHTIG:** Aktuell zentrale Keys — nach Phase A wird das auf User-Keys umgestellt, env-Keys bleiben nur als Fallback/Admin-Tools
