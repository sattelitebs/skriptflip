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

## Strategische Entscheidungen (gelockt 2026-04-29)

### Geschäftsmodell
- **Kein Stripe-Abo.** Stattdessen: Digistore-Verkauf, Mentortools für Member-Bereich
- **Preis-Modell parallel:**
  - Lifetime Earlybird: **197€**
  - Lifetime regulär (nach Earlybird-Phase): **297€**
  - Jahresabo: **97€/Jahr**
- **User bringt eigene API-Keys** (OpenAI + Claude). Speicherung verschlüsselt in DB, Pipelines nutzen User-Keys statt zentrale env. Du (Torsten) zahlst nur Hosting (~10-30€/Mon DigitalOcean), keine API-Kosten.
- **Hosting:** DigitalOcean Droplet (12$/Mon, 4GB) + Coolify als Deploy-Layer. NICHT Vercel (yt-dlp braucht Long-Running-Prozesse).

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

### Phase B — Lizenz-System (~10-15h)
6. Tabelle `licenses` (user_id, type [lifetime|yearly], valid_until, digistore_order_id, status)
7. Digistore-Webhook-Endpoint `/api/webhooks/digistore` → Lizenz-Aktivierung
8. Auth-Gating in Pipelines: keine aktive Lizenz = 403, Hinweis auf Verkaufsseite

### Phase C — Server-Setup (~5h)
9. ~~Auth-Confirm-Bug~~ ✓ gefixt (2026-04-30)
10. DigitalOcean Droplet aufsetzen + Coolify installieren (Schritt-für-Schritt)
11. Domain `skriptflip.com` auf Droplet, SSL via Let's Encrypt automatisch via Coolify

### Phase D — HeyGen-Integration (~13-17h, separates Feature)
12. DB-Schema: `heygen_videos` Tabelle + Storage-Bucket `videos`
13. HeyGen-API-Wrapper: Audio-Upload + Generate + Polling + Download
14. UI: Avatar-Picker (List-API), Render-Button im Voiceover-Bereich, Status-Anzeige
15. HeyGen-API-Key in User-Settings

### Phase E — Verkaufsmappe (analog Aivatar Empire, in eigener Session)
16. Verkaufsseite skriptflip.com (HTML, Brand-Farben Gelb/Schwarz)
17. Mail-Sequenzen (Pre-Sale, Cart-Abandon, Post-Sale Onboarding)
18. Werbeanzeigen-Texte
19. Affiliate-Seite Digistore
20. Dankesseite + Onboarding-Mails

## Stil-Regeln (vom User)
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
