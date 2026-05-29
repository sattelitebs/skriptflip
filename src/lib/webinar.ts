/**
 * Webinar-Termine (Funnel Stufe 1).
 *
 * Hier die buchbaren Live-Termine pflegen — die Startseite und das Anmeldeformular
 * ziehen sich die Auswahl aus dieser Liste. `id` wird in der DB gespeichert und ist
 * stabil; `label/date/time` sind reine Anzeige.
 */
export type WebinarSlot = {
  id: string;     // stabil, wird in webinar_signups.slot gespeichert
  label: string;  // kompakte Anzeige im Auswahl-Button
  date: string;   // ausgeschriebenes Datum
  time: string;   // Uhrzeit
};

export const WEBINAR_SLOTS: WebinarSlot[] = [
  { id: "2026-06-02-1900", label: "Di · 2. Juni · 19:00", date: "2. Juni 2026", time: "19:00 Uhr" },
  { id: "2026-06-05-1100", label: "Fr · 5. Juni · 11:00", date: "5. Juni 2026", time: "11:00 Uhr" },
  { id: "2026-06-09-1900", label: "Di · 9. Juni · 19:00", date: "9. Juni 2026", time: "19:00 Uhr" },
];

export function isValidSlot(id: string | null | undefined): id is string {
  return !!id && WEBINAR_SLOTS.some((s) => s.id === id);
}
