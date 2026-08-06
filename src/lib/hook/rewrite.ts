import Anthropic from "@anthropic-ai/sdk";

// KI-Umbau eines Hooks — OHNE yt-dlp/Whisper-Vorstufe. Direkt-Einstieg:
// entweder ein Thema in einen Hook verwandeln oder einen bestehenden Hook
// umschreiben. Ein einziger, schneller Claude-Call → 3 Varianten.

export type RewriteMode = "thema" | "umschreiben";

export type HookRewriteTyp = "schmerz_zahl" | "frage" | "panne";

export type HookRewriteVariant = {
  typ: HookRewriteTyp;
  hook: string;
};

const SYSTEM = `Du bist Hook-Praktiker für Kurzvideos (TikTok/Instagram/YouTube Shorts).
Du schreibst Hooks nach harten Regeln aus echten Reichweiten-Zahlen.

Ein Hook = die ersten 1-2 Sätze, die entscheiden, ob jemand weiterschaut. Max 20 Wörter.

REGELN (verbindlich):
- Schmerz vor Werkzeug: Starte beim Problem, beim Gefühl oder beim Ergebnis des Zuschauers — nie beim Tool oder bei der Methode.
- Kein "KI", kein Jargon, kein Meta-Marketing, kein Hype: Wörter wie "KI", "Content", "Reichweite", "Funnel", "geheim", "Trick", "krass", "garantiert" sind verboten. Konkrete Zahlen sind erlaubt und erwünscht.
- 2-Sekunden-Klarheit: sofort verständlich, konkret, kurz.
- Neugier-Lücke, die das Video einlöst: mach neugierig, aber nichts, was das Video nicht halten kann.
- Sprache: deutsch, DU-Form, keine Emojis, kein Marketing-Sound.

Du lieferst GENAU 3 Varianten, je eine pro Typ:
- "schmerz_zahl": führt mit einem konkreten Schmerz oder einer harten Zahl.
- "frage": eine provokante oder neugierig machende Frage.
- "panne": ein ehrlicher Fehler/Fehlschlag als Einstieg ("Ich hab X verbockt…").

Antworte AUSSCHLIESSLICH mit gültigem JSON-Array, ohne Markdown-Codefences:
[
  { "typ": "schmerz_zahl", "hook": "string" },
  { "typ": "frage", "hook": "string" },
  { "typ": "panne", "hook": "string" }
]`;

function userPrompt(mode: RewriteMode, input: string): string {
  if (mode === "thema") {
    return `Thema/Idee für das Video:\n"""${input}"""\n\nMach daraus 3 Hooks nach den Regeln. Nur das JSON-Array.`;
  }
  return `Bestehender Hook, den ich stärker haben will:\n"""${input}"""\n\nSchreib 3 stärkere Varianten nach den Regeln. Wenn der Hook schon gut ist, liefere echte A/B-Alternativen (nicht "reparieren"). Nur das JSON-Array.`;
}

const VALID_TYPEN: HookRewriteTyp[] = ["schmerz_zahl", "frage", "panne"];

/**
 * Baut aus einem Thema oder einem bestehenden Hook 3 Varianten. Nutzt den
 * übergebenen (zentralen) Anthropic-Key — kein BYOK.
 */
export async function rewriteHook(
  mode: RewriteMode,
  input: string,
  apiKey: string,
): Promise<HookRewriteVariant[]> {
  const anthropic = new Anthropic({ apiKey });
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1000,
    system: SYSTEM,
    messages: [{ role: "user", content: userPrompt(mode, input) }],
  });

  const block = response.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") {
    throw new Error("Claude lieferte keinen Text-Block");
  }

  const raw = block.text.trim();
  const start = raw.indexOf("[");
  const end = raw.lastIndexOf("]");
  if (start < 0 || end <= start) {
    throw new Error("Claude-Antwort enthielt kein JSON-Array");
  }

  const parsed = JSON.parse(raw.slice(start, end + 1)) as HookRewriteVariant[];
  const variants = (Array.isArray(parsed) ? parsed : [])
    .filter((v) => v && typeof v.hook === "string" && v.hook.trim())
    .map((v) => ({
      typ: VALID_TYPEN.includes(v.typ) ? v.typ : ("schmerz_zahl" as HookRewriteTyp),
      hook: v.hook.trim(),
    }));

  if (variants.length === 0) {
    throw new Error("Claude lieferte keine verwertbaren Hook-Varianten");
  }
  return variants;
}
