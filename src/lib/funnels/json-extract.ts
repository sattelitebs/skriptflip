/**
 * Robuste JSON-Extraktion aus Claude-Antworten.
 *
 * Claude liefert trotz klarer Anweisung gelegentlich Text um das JSON herum
 * (Codefences, „Hier ist dein JSON:"). Diese Funktion schneidet vom ersten `{`
 * bis zum letzten `}` und parst das Stück. Wird von allen Pipeline-Bausteinen
 * geteilt, die strukturiertes JSON von Claude erwarten.
 */
export function extractJson<T>(raw: string): T {
  const trimmed = raw.trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start < 0 || end <= start) {
    throw new Error("Claude-Antwort enthielt kein JSON");
  }
  try {
    return JSON.parse(trimmed.slice(start, end + 1)) as T;
  } catch {
    throw new Error("Claude-JSON konnte nicht geparst werden");
  }
}
