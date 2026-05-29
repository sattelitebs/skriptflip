# Viral-Research-Tool — Spec (skriptflip-Adaption)

> **Herkunft:** Diese Spec rekonstruiert das Feature aus dem Datei-Manifest der Original-Spec
> in `sattelitebs/aivatarboss-app` (`docs/viral-research-standalone-spec.md`), die in dieser
> Session technisch nicht ladbar war (Repo-Scope-Restriktion + WebFetch in der Umgebung
> gesperrt). Sie ist auf den **realen skriptflip-Stack** angepasst. Abweichungen vom
> Original-Manifest sind unten unter „Architektur-Entscheidungen" dokumentiert.

## 1. Was das Tool macht

Bisher: User fügt **einen** Link ein → skriptflip macht daraus 3 Skript-Versionen.

Viral-Research erweitert das um den Schritt **davor**: **Entdeckung statt Raten.**

1. User gibt eine **Nische / ein Keyword / einen Hashtag** ein (z. B. „Finanzen für Anfänger",
   „Hundetraining", „faceless YouTube").
2. Das Tool **scant** über Apify die aktuell **viralen Reels/Videos** dieser Nische
   (Instagram, TikTok, YouTube Shorts) — sortiert nach Reichweite/Engagement.
3. Eine **Nischen-Analyse** (Claude) verdichtet die Treffer zu Mustern: welche Hooks ziehen,
   welche Strukturen wiederholen sich, wo sind inhaltliche Lücken (Content-Gaps).
4. User wählt ein konkretes virales Reel → **Repurpose**: Audio wird geladen (yt-dlp),
   transkribiert (Whisper), pro-Reel analysiert („warum viral") und in **3 eigene
   Skript-Versionen** überführt — die im bestehenden `analyses`-Flow landen (inkl.
   Hook-A/B, Repurposing-Formate, Voiceover).

Kurz: **Viral-Research findet die Vorlagen, der bestehende skriptflip-Flow baut daraus eigene Skripte.**

## 2. Datenmodell

`supabase/007_viral_research_runs.sql`

```
viral_research_runs
  id              uuid pk
  user_id         uuid fk auth.users (cascade)
  niche           text            -- Eingabe des Users
  platform        text            -- instagram | tiktok | youtube
  status          text            -- pending | scanning | analyzing | done | error
  reels           jsonb           -- normalisierte Trefferliste (s. ReelHit)
  niche_analysis  jsonb           -- Aggregat-Analyse (s. NicheAnalysis)
  error           text
  created_at, updated_at
```

RLS: User sieht/bearbeitet nur eigene Runs (gleiches Muster wie `analyses`).

Das **Repurpose** eines einzelnen Reels legt **keine** neue Tabelle an, sondern erzeugt eine
Zeile in der bestehenden `analyses`-Tabelle → der komplette Downstream (Hook-Varianten,
Repurposing-Formate, Voiceover) funktioniert sofort weiter.

## 3. Pipeline-Bausteine (`src/lib/pipeline/`)

| Datei | Funktion | Tut |
|---|---|---|
| `apify.ts` | `scanNiche(niche, platform, limit, token)` | Apify-Actor je Plattform aufrufen, Treffer normalisieren → `ReelHit[]` |
| `niche-analyzer.ts` | `analyzeNiche(reels, niche, apiKey)` | Claude: Aggregat-Muster über alle Treffer → `NicheAnalysis` |
| `reel-analyzer.ts` | `analyzeReel(transcript, meta, apiKey)` | Claude: „warum viral" für **ein** Reel → `ReelAnalysis` |
| `script-generation.ts` | `generateScriptsFromReel(...)` | Claude: 3 eigene Skripte auf Basis von Transkript + Reel-Analyse |
| `source-download.ts` | `downloadReelAudio(url)` | dünner Wrapper um bestehendes `download.ts` (yt-dlp) |
| `whisper.ts` | `transcribeReel(path, apiKey)` | dünner Wrapper um bestehendes `transcribe.ts` (Whisper) |
| `viral-research-scan.ts` | `runViralResearchScan(...)` | Orchestriert Scan: Apify → niche-analyzer → Run aktualisieren |
| `viral-reel-repurpose.ts` | `runViralReelRepurpose(...)` | Orchestriert Repurpose: download → whisper → reel-analyzer + script-generation → `analyses`-Zeile |

`src/lib/funnels/json-extract.ts` — robustes `extractJson<T>(raw)` (aus `generate.ts` herausgezogen,
von allen Claude-Aufrufen geteilt).

`src/lib/drafts/render-from-script.ts` — `renderDraftFromScript(script)` → Markdown-Draft für Copy/Export.

## 4. API-Routen

- `POST /api/viral-research` — Body `{ niche, platform }` → legt Run an, führt Scan **inline** aus, gibt `{ id }`.
- `GET  /api/viral-research/[id]` — Run-Status + Ergebnisse (für Polling).
- `POST /api/viral-research/[id]/repurpose` — Body `{ reel_index }` → erzeugt `analyses`-Zeile, redirectbar.

Alle Routen: Auth + `getAccessStatus`/`gateError` + User-Keys (OpenAI + Anthropic), exakt wie `/api/analyze`.

## 5. UI

`src/app/dashboard/viral-research/`
- `page.tsx` — Server-Component, Auth-Guard, lädt letzte Runs.
- `viral-research-client.tsx` — Client: Nischen-Eingabe + Plattform-Wahl, Ergebnis-Grid mit
  Reel-Karten (Metriken), „Repurpose"-Button pro Karte, Nischen-Analyse-Panel.
- `actions.ts` — Server Actions (Scan starten, Run laden), als Alternative zum fetch-Flow.

Verlinkt vom Dashboard-Header („Viral-Research →"). Brand: Gelb `#FEDC31` / Schwarz, Bold-All-Caps-Hooks, deutsch.

## 6. Konfiguration / Env

- `APIFY_TOKEN` — **zentral** (Server-Env). Apify-Scraping ist günstige geteilte Infra, kein teurer
  AI-Call → fällt nicht unter die „User bringt eigene Keys"-Regel (die gilt für OpenAI + Claude).
- `APIFY_INSTAGRAM_ACTOR` (default `apify~instagram-scraper`)
- `APIFY_TIKTOK_ACTOR` (default `clockworks~tiktok-scraper`)
- `APIFY_YOUTUBE_ACTOR` (default `streamers~youtube-scraper`)

OpenAI- (Whisper) und Anthropic-Keys (Analyse/Skripte) kommen wie überall aus den **User-Keys**.

## 7. Architektur-Entscheidungen (Abweichungen vom Original-Manifest)

| Original-Manifest (aivatarboss-app) | skriptflip-Adaption | Warum |
|---|---|---|
| `trigger/viral-research-scan.ts`, `trigger/viral-reel-repurpose.ts` (Trigger.dev Background-Jobs) | Inline-Ausführung in API-Routen; Orchestrierung als pure Funktionen in `src/lib/pipeline/viral-research-scan.ts` / `viral-reel-repurpose.ts` | skriptflip läuft bewusst **long-running auf Hetzner** (kein Serverless/Vercel — gelockte Entscheidung in CLAUDE.md). `/api/analyze` macht es genauso inline. Trigger.dev wäre Fremd-Infra. Logik ist trigger-ready gekapselt, falls später nötig. |
| `supabase/migrations/0075_viral_research_runs.sql` | `supabase/007_viral_research_runs.sql` | skriptflip nutzt flache `NNN_*.sql`-Files, zuletzt `006_licenses.sql`. |
| `src/app/app/viral-research/...` | `src/app/dashboard/viral-research/...` | skriptflip legt den eingeloggten Bereich unter `dashboard/`. |
| eigene Reel→Skript-Tabellen | Wiederverwendung der bestehenden `analyses`-Tabelle | Voller Downstream (Hooks/Repurpose/Voiceover) ohne Doppelarbeit. |
| `source-download.ts`, `whisper.ts` als eigene Implementierungen | dünne Wrapper um bestehendes `download.ts` / `transcribe.ts` | DRY — yt-dlp/Whisper existieren schon. |

## 9. Update aus dem Live-Briefing (Content-Radar-Webinar-Modell)

Quelle: Briefing zum Funnel `webinar.contentradar.juliatrost.de` (vom User durchgegeben,
Seite selbst in dieser Umgebung netzwerkseitig gesperrt). Schärft Positionierung + Architektur:

### Funnel-Modell (Tool-Led-Webinar)
- **Stufe 1 — Opt-in-Seite:** einziger Zweck = Anmeldung zum kostenlosen Live-Webinar (fester Termin, Zoom). Kein Preis, kein Produkt sichtbar.
- **Stufe 2 — 60-Min-Webinar:** konkretes Framework (kein Theorievortrag).
- **Stufe 3 — Reveal bei Minute 60:** Tool wird vorgestellt und verkauft. Auf der Opt-in-Seite bewusst verschwiegen.

### USP — die eine Differenzierung
Nicht „viraler Content", sondern **„viraler Content, der VERKAUFT"** (vs. „nur laut").
Positionierung als persönlich gebautes System („die Maschine, die ich mir gebaut habe"),
nicht als anonyme Software.

### 3 Hebel = Webinar-Dramaturgie UND Feature-Logik
1. **Radar** — erkennen, welche Themen ziehen UND verkaufen (nicht nur Reichweite).
2. **Hook** — Hook-Struktur, die in 3 Sekunden über Weiterscrollen entscheidet.
3. **Verkauf** — im Content selbst verkaufen, ohne dass es nach Werbung wirkt.

### Architektur-Konsequenzen (umgesetzt)
- **Verkaufspotenzial-Score** statt Reichweiten-Ranking: `niche-analyzer.ts` liefert jetzt das
  3-Hebel-Gerüst (`radar`/`hooks`/`verkauf`) PLUS pro Treffer einen `sales_score` (0-100) +
  `sales_angle`. Der Scan re-rankt nach `sales_score`, nicht nach Views. Das „Verkauft"-Signal
  gibt es in keiner API → kommt aus der Claude-Schicht (= der Moat).
- **Hybrid-Datenquelle:** `youtube.ts` (offizielle YouTube Data API, gratis, legal) als Rückgrat;
  Apify optional für IG/TikTok; Auswahl in `viral-research-scan.ts` (`discover()`).
- `reel-analyzer.ts` um `how_to_sell` erweitert; `script-generation.ts` baut einen dezenten
  Verkaufs-Move ein und nutzt den `sales_angle`.

### Env ergänzt
- `YOUTUBE_API_KEY` — offizielle YouTube Data API (Rückgrat). `APIFY_TOKEN` bleibt optional (IG/TikTok).

### Funnel-Seiten (Build „Beides, Tool zuerst")
- `/webinar` — Opt-in-Anmeldeseite (Tool versteckt), `webhook_signups`-Tabelle + `/api/webinar/signup`.
- `/angebot` — Verkaufsseite (Post-Webinar-Reveal), Pricing 197/297/97 €.
- `docs/webinar-skript.md` — 60-Min-Ablauf entlang Radar/Hook/Verkauf, Reveal bei Min. 60.

## 8. Status / TODO nach diesem Stand

- [ ] `APIFY_TOKEN` in Production-Env (Coolify) + `.env.local` setzen.
- [ ] `supabase/007_viral_research_runs.sql` in Supabase ausführen.
- [ ] Apify-Actor-Inputs gegen echte Actor-Schemas verifizieren (Felder variieren je Actor-Version).
- [ ] Original-Spec aus `aivatarboss-app` gegenlesen und Abweichungen bei Bedarf nachziehen.
