# Session-Handoff für skriptflip

**Letzte Session:** 2026-05-01 (Phase A + Phase C komplett durchgezogen)
**Status:** App läuft live auf https://skriptflip.com via Hetzner + Coolify. User-eigene API-Keys, Member-System mit Admin, Production-Deploy fertig. Nächste Session = **Phase B (Digistore-Lizenz-System)**.

---

## So startest du die nächste Session

Öffne neue Claude-Session in `/Users/ich/Claude/skriptflip/`. Schreib als ersten Prompt:

> *Lies CLAUDE.md und SESSION_HANDOFF.md. Ich will jetzt mit Phase B weitermachen — Digistore-Lizenz-System. Tabelle `licenses` + Webhook-Endpoint `/api/webhooks/digistore` + Auth-Gating: ohne aktive Lizenz kein Generieren.*

→ Damit hat die neue Session sofort Kontext.

---

## Was ALLES schon fertig ist (nichts mehr anpacken)

### Code-Features (alle fertig, alle deployed)
- Auth-Flow (Login/Register/Logout/Confirm) — Confirm-Bug ist gefixt
- Skript-Pipeline: yt-dlp → Whisper → Claude (3 Skript-Versionen)
- Repurposing-Engine (8 Format-Versionen pro Skript)
- Hook-A/B-Generator + Hook-Bibliothek mit Pattern-Filter
- Voiceover-Generierung (OpenAI TTS, 6 Stimmen, Storage-Bucket)
- Brand-Setup (Gelb #FEDC31 / Schwarz, Resend SMTP via Supabase)
- Analysen-Lösch-Funktion (einzeln + Bulk-Errors)

### Phase A — User-eigene API-Keys + Member-System
- DB-Schema `005_profiles_and_keys.sql` (profiles mit role/blocked + user_api_keys mit AES-256-GCM)
- Crypto-Lib mit `API_KEY_ENCRYPTION_SECRET` (env)
- Settings-Page `/dashboard/settings` mit Key-Eingabe + Test-Button
- Onboarding-Banner im Dashboard
- Auth-Gating in allen Pipelines (`getAccessStatus` + `gateError`)
- Admin-Dashboard `/dashboard/admin` mit Sperren/Freischalten + Admin-Rechte
- Pipeline-Refactor: alle 5 Pipelines nehmen User-Keys statt zentrale env

### Phase C — Server + Deploy
- **Hosting**: Hetzner CPX22 (Nürnberg), 2 vCPU AMD / 4 GB RAM / 80 GB SSD = **8,49 €/Mo**
- Server-IP: `178.105.60.119`
- Coolify v4.0.0 als Deploy-Layer
- Dockerfile mit Node 22 + yt-dlp + ffmpeg + Next.js standalone-Build
- GitHub-Repo: https://github.com/sattelitebs/skriptflip (privat, SSH-Auth via id_ed25519)
- Domain `skriptflip.com` + `www.skriptflip.com` → Server-IP
- SSL via Let's Encrypt (auto via Traefik in Coolify)
- Supabase URL-Config auf Production umgestellt

### Was läuft
- **https://skriptflip.com** → Live, HTTP/2, HTTPS, HTTP→HTTPS-Redirect
- Production-Env-Vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `API_KEY_ENCRYPTION_SECRET`, `NEXT_PUBLIC_SITE_URL=https://skriptflip.com`
- **Wichtig**: `API_KEY_ENCRYPTION_SECRET` ist auf Local und Production identisch — bei Wechsel sind alle DB-Keys unentschlüsselbar

---

## Strategische Entscheidungen (NICHT mehr diskutieren)

| Punkt | Entscheidung |
|---|---|
| Geschäftsmodell | Digistore + Mentortools, kein Stripe-Abo |
| Preis | Lifetime 197 € Earlybird / 297 € regulär + Jahresabo 97 € |
| API-Keys | User bringt eigene OpenAI + Claude Keys (Variante B) |
| Member-System | Eigene Auth + Admin-Dashboard mit Sperren-Funktion |
| Hosting | **Hetzner CPX22** (8,49 €/Mo) — NICHT Vercel, NICHT DigitalOcean |
| Deploy | Coolify auf Hetzner, GitHub-Push triggert Build |
| HeyGen-Integration | Pro-Feature in Phase D (User bringt HeyGen-Key) |

---

## Was als nächstes ansteht (Priorität)

### 🔥 Phase B — Lizenz-System (~10-15h)
**Ziel:** Digistore-Kauf aktiviert User automatisch.

Aufgaben:
- [ ] Schema `006_licenses.sql`: Tabelle `licenses` (user_id, type [lifetime|yearly], valid_until, digistore_order_id, status, raw_payload jsonb)
- [ ] Webhook-Endpoint `/api/webhooks/digistore` mit IPN-Validierung (Digistore-Signature)
- [ ] Lizenz-Lookup in `getAccessStatus`: ohne aktive Lizenz `gateError("Bitte erst Lifetime/Jahresabo kaufen.")`
- [ ] Admin-Dashboard erweitern: Lizenz-Status pro User anzeigen, manuell vergeben/entziehen
- [ ] Onboarding nach Kauf: User bekommt Email mit Login-Link, Setup-Wizard zeigt Settings + Hinweis "Trag jetzt deine API-Keys ein"

Digistore-Doku-Hinweise:
- Webhook-URL: https://skriptflip.com/api/webhooks/digistore
- Validierung über `signature`-Parameter im POST-Body (HMAC-SHA512 mit Digistore-Passphrase aus Settings)
- Event-Typen relevant: `on_payment` (Aktivierung), `on_refund` (Sperre), `on_payment_missed` (Bei Jahresabo)

### ⏳ Phase D — HeyGen-Integration (~13-17h, später)
- HeyGen-API-Pipeline für Avatar-Video aus Voiceover
- HeyGen-Key in User-Settings

### ⏳ Phase E — Verkaufsmappe (separat, eigene Session)
- Verkaufsseite skriptflip.com (HTML, Brand-Farben Gelb/Schwarz)
- Mail-Sequenzen (Pre-Sale, Cart-Abandon, Post-Sale Onboarding)
- Werbeanzeigen-Texte
- Affiliate-Seite Digistore
- Dankesseite + Onboarding-Mails

---

## Wichtige Pfade & Befehle

**Projekt-Root:** `/Users/ich/Claude/skriptflip/`

**Dev-Server starten:** Preview-MCP `preview_start name=skriptflip` → http://localhost:3000

**TypeScript-Check:** `cd /Users/ich/Claude/skriptflip && export PATH=/opt/homebrew/bin:$PATH && npx tsc --noEmit`

**Server-SSH:** `ssh root@178.105.60.119`

**Coolify-UI:** http://178.105.60.119:8000

**Schema-Files:** `supabase/001_analyses.sql` bis `supabase/005_profiles_and_keys.sql` (alle ausgeführt)

**GitHub:** `git push origin main` (SSH-Auth, triggert Coolify-Auto-Deploy nicht automatisch — manuell in Coolify "Deploy" drücken oder Webhook einrichten)

**Bootstrap-Script (Keys-Import):** `npx tsx scripts/seed-keys.ts <email>` (mit `set -a && source .env.local && set +a` davor)

**Server-Backups (gitignored):** `server-secrets/coolify.env.backup`, `server-secrets/production.env`

**Next.js 16 Doku bei Unsicherheit:** `node_modules/next/dist/docs/`

---

## Was NICHT in dieser/nächster Session passieren darf

- Stripe-Integration → ist verworfen
- HeyGen-Integration vor Phase B → Reihenfolge halten
- Verkaufsmappe parallel → das ist eine separate Session
- Aivatar Empire / ACS / sonstiges → ist anderes Projekt unter `/KI-Firma/02_Marketing/aivatar_empire/`
- DigitalOcean wieder anfassen → Account leer lassen, Hetzner ist final

---

## Test-Anleitung für Phase B (wenn Code fertig)

Digistore hat einen IPN-Test-Modus:
1. Im Digistore-Backend → Konto-Einstellungen → "IPN" → Test-Webhook auslösen
2. Server-Logs auf Hetzner: `ssh root@178.105.60.119 'docker logs <container-name> --tail 50 -f'`
3. Lizenz-Tabelle in Supabase prüfen
4. Manuell als Test-User einloggen → Generieren versuchen → "Aktive Lizenz vorhanden" / "Bitte zuerst kaufen"

---

## Wichtig zu wissen

- **skriptflip-Brand:** Gelb #FEDC31 + Schwarz (klassisch Torsten-Brand)
- **Aivatar Empire** ist eine SEPARATE Marke mit eigenem Lila-Look — NICHT verwechseln
- Wenn Torsten kommt: User-Profil + Stilregeln aus globalem CLAUDE.md (`/Users/ich/.claude/CLAUDE.md`) gilt automatisch
- skriptflip = Skript-Tool, Aivatar Empire = Avatar-Tool + Faceless-Konzept (anderer Standbein)
- **Laufende Kosten:** ~115 €/Jahr fix (Hosting + Domain). 1 Earlybird-Verkauf (197 €) deckt 23 Monate.
