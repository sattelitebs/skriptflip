# Session-Handoff für skriptflip

**Letzte Session:** 2026-04-30
**Status:** Code-Features (Pipeline + Repurposing + Hooks + Voiceover) live, strategische Entscheidungen alle gelockt. Nächste Session = Code-Refactor zu User-API + Lizenz-System.

---

## So startest du die nächste Session

Öffne neue Claude-Session in `/Users/ich/Claude/skriptflip/`. Schreib als ersten Prompt:

> *Lies CLAUDE.md und SESSION_HANDOFF.md. Ich will jetzt mit Phase A weitermachen — Code-Refactor zu User-eigenen API-Keys + Member-System mit Admin-Verwaltung. Stand: Hauptprodukt skriptflip wird über Digistore verkauft (Lifetime 197/297€ + Jahresabo 97€), keine Stripe-Subscription. Hosting: DigitalOcean Droplet + Coolify. Beim Skriptaufbau: durchgehend Variante B (gehostet bei mir, User bringt eigene OpenAI + Claude API-Keys).*

→ Damit hat die neue Session sofort Kontext.

---

## Was schon fertig ist (nichts mehr anpacken)

- Auth-Flow (Login, Register, Logout, Confirm — Confirm hat einen Bug, siehe Phase C)
- Skript-Pipeline: yt-dlp → Whisper → Claude (3 Skript-Versionen)
- Repurposing-Engine (8 Format-Versionen pro Skript)
- Hook-A/B-Generator + Hook-Bibliothek mit Pattern-Filter
- Voiceover-Generierung (OpenAI TTS, 6 Stimmen, Storage in Supabase Bucket)
- Brand-Setup (Gelb/Schwarz, Resend SMTP via Supabase)
- 4 Schema-Migrationen in Supabase ausgeführt

→ **Alles aktuelle UI hat zentrale API-Keys aus `.env.local`.** Das muss in Phase A umgestellt werden.

---

## Strategische Entscheidungen (NICHT mehr diskutieren)

| Punkt | Entscheidung |
|---|---|
| Geschäftsmodell | Digistore + Mentortools, kein Stripe-Abo |
| Preis | Lifetime 197€ Earlybird / 297€ regulär + Jahresabo 97€ |
| API-Keys | User bringt eigene OpenAI + Claude API-Keys (Variante B) |
| Member-System | Eigene Auth + Admin-Dashboard mit User-Liste + Sperren-Funktion |
| Hosting | DigitalOcean Droplet (12$/Mon) + Coolify (NICHT Vercel) |
| HeyGen-Integration | Pro-Feature in Phase D (User bringt HeyGen-Key) |

---

## Was als nächstes ansteht (Priorität)

### 🔥 Phase A — Code-Refactor zu User-API (~20-25h)
**Ziel:** User trägt seine API-Keys im Settings ein, Pipelines nutzen seine Keys.

- [ ] DB-Schema `user_api_keys` mit AES-256-Encryption
- [ ] Settings-Page UI mit Key-Eingabe + Test-Button
- [ ] Refactor aller 6 Pipelines: `download.ts`, `transcribe.ts`, `generate.ts`, `repurpose.ts`, `hook-variants.ts`, `voiceover.ts` — alle nehmen `userId`
- [ ] Onboarding-Wizard nach Registrierung
- [ ] Admin-Dashboard für User-Verwaltung

### 🔥 Phase B — Lizenz-System (~10-15h)
**Ziel:** Digistore-Kauf aktiviert User automatisch.

- [ ] Tabelle `licenses` (lifetime / yearly)
- [ ] Webhook-Endpoint `/api/webhooks/digistore`
- [ ] Auth-Gating in Pipelines

### 📋 Phase C — Auth-Bug + Server (~5-8h)
- [ ] Confirm-Bug fixen (Logs in `src/app/auth/confirm/route.ts`)
- [ ] DigitalOcean Droplet aufsetzen
- [ ] Domain `skriptflip.com` aufschalten

### ⏳ Phase D — HeyGen-Integration (~13-17h, später)
- HeyGen-API-Pipeline für Avatar-Video aus Voiceover

### ⏳ Phase E — Verkaufsmappe (separat)
- Verkaufsseite + Mails + Affiliate (analog Aivatar Empire in `/KI-Firma/02_Marketing/aivatar_empire/`)

---

## Wichtige Pfade & Befehle

**Projekt-Root:** `/Users/ich/Claude/skriptflip/`

**Dev-Server starten:** Preview-MCP `preview_start name=skriptflip` → http://localhost:3000

**TypeScript-Check:** `cd /Users/ich/Claude/skriptflip && export PATH=/opt/homebrew/bin:$PATH && npx tsc --noEmit`

**Schema-Files:** `supabase/001_analyses.sql` bis `supabase/004_voiceovers.sql` (alle bereits ausgeführt)

**Next.js 16 Doku bei Unsicherheit:** `node_modules/next/dist/docs/`

---

## Was NICHT in dieser Session passieren darf

- Stripe-Integration anfangen → ist verworfen
- HeyGen-Integration vor Phase A/B → Reihenfolge halten
- Verkaufsmappe parallel → das ist eine separate Session
- Aivatar Empire / ACS / sonstiges → ist anderes Projekt unter `/KI-Firma/02_Marketing/aivatar_empire/`

---

## Wichtig zu wissen

- **skriptflip-Brand:** Gelb #FEDC31 + Schwarz (klassisch Torsten-Brand)
- **Aivatar Empire** ist eine SEPARATE Marke mit eigenem Lila-Look — NICHT verwechseln
- Wenn der User kommt: User-Profil + Stilregeln aus globalem CLAUDE.md (`/Users/ich/.claude/CLAUDE.md`) gilt automatisch
- skriptflip soll am Ende sein eigenes Produkt sein (Skript-Tool), Aivatar Empire ist das andere Standbein (Avatar-Tool + Faceless-Konzept)
