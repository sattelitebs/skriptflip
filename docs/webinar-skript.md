# Webinar-Skript — „Viral ist nicht genug. Dein Content muss verkaufen."

**Format:** Kostenloses Live-Webinar, ~60 Min, Zoom, fester Termin.
**Modell:** Tool-Led-Webinar — das Tool (skriptflip / Sales-Radar) wird erst am Ende (Min. ~50–60) enthüllt und verkauft. Vorher: reines Framework, kein Pitch.
**Dramaturgie = die 3 Hebel:** Radar → Hook → Verkauf.
**Stil:** deutsch, DU-Form, story-driven, krasse Hooks mit Zahlen, kein KI-Sound, keine Emojis. Brand Gelb/Schwarz.

---

## Minute 0–8 — Einstieg & großes Versprechen
- **Hook (erste 30 Sek.):** „Die meisten Creator posten jeden Tag — und verkaufen trotzdem nichts. Nicht weil ihr Content schlecht ist. Sondern weil er auf das Falsche optimiert ist: auf Reichweite statt auf Käufer."
- Eigene Story kurz: Wo ich stand (viel gepostet, wenig verkauft), was sich geändert hat.
- Versprechen fürs Webinar: „In den nächsten 60 Minuten gebe ich dir das exakte Framework aus 3 Hebeln, mit dem ich in jeder Nische Content baue, der nicht nur gesehen wird — sondern verkauft."
- Rahmen setzen: „Bleib bis zum Ende, da zeige ich dir etwas, das dir die ganze Recherche abnimmt."

## Minute 8–22 — Hebel 1: RADAR
- Kernsatz: „Reichweite ist nicht gleich Umsatz. Lautes Thema ≠ verkaufendes Thema."
- Lehrinhalt: Wie man in einer Nische die Themen findet, die Kaufabsicht treffen.
  - Signale für Kaufabsicht vs. reine Unterhaltung
  - Warum die meisten die falschen Vorbilder kopieren (die mit Views, nicht mit Verkäufen)
- Live-Demo/Beispiel: 2–3 virale Videos, eins „nur laut", eins „verkauft" — Unterschied sichtbar machen.
- Mini-Aufgabe an die Zuschauer: „Nenn im Chat deine Nische."

## Minute 22–36 — Hebel 2: HOOK
- Kernsatz: „Du hast 3 Sekunden. Danach entscheidet das Gehirn: bleiben oder weiterswipen."
- Lehrinhalt: Die Hook-Struktur hinter fast jedem Viral-Video.
  - Pattern-Interrupt, konkrete Zahl, offene Schleife
  - Die häufigsten Hook-Fehler (zu langsam, zu allgemein, kein Spannungsbruch)
- Live: 3–4 schwache Hooks in starke umschreiben.

## Minute 36–50 — Hebel 3: VERKAUF
- Kernsatz: „Verkaufen im Content heißt nicht werben. Es heißt: den nächsten logischen Schritt anbieten."
- Lehrinhalt: Wie man im Video verkauft, ohne dass es nach Werbung klingt.
  - Soft-CTA-Strukturen, Beweis statt Behauptung, der „nächste Schritt"
  - Warum 95 % der Creator diesen Teil auslassen — und Umsatz liegen lassen
- Zusammenführung: Radar + Hook + Verkauf als ein Kreislauf.

## Minute 50–60 — REVEAL & Angebot
- Übergang: „Das Framework funktioniert. Aber ehrlich: Es ist viel Handarbeit — recherchieren, bewerten, Hooks bauen, Skripte schreiben. Also habe ich mir eine Maschine dafür gebaut."
- **Reveal:** skriptflip mit dem Sales-Radar.
  - Radar = Nische rein, verkaufsstärkste Videos raus (nach Verkaufspotenzial, nicht nach Reichweite)
  - Hook = fertige Hook-Varianten pro Treffer
  - Verkauf = 3 eigene, sprechfertige Skripte mit eingebautem Verkaufs-Move
- **Angebot:** Lifetime Earlybird 197 € (statt regulär 297 €), alternativ Jahresabo 97 €.
  - Stack/Bonus klar benennen, Earlybird-Verknappung ehrlich.
  - „Du bringst deine eigenen API-Keys mit — wir verdienen nichts an deiner Nutzung."
- **CTA:** Link zur Verkaufsseite `/angebot` (Digistore-Checkout).
- Q&A live, Einwände direkt am Angebot abräumen.

---

## Funnel-Verknüpfung
- Opt-in: `/webinar` → Anmeldung in `webinar_signups`.
- Reminder-/Zugangs-Mails: über Resend (Sequenz separat, Phase E).
- Verkaufsseite: `/angebot` → Digistore → Webhook `/api/webhooks/digistore` schaltet Lizenz frei (Phase B bereits gebaut).
