import Anthropic from "@anthropic-ai/sdk";

export type HookPattern = "frage" | "schock" | "versprechen" | "zahl" | "story";

export type HookVariant = {
  hook: string;
  pattern: HookPattern;
};

const SYSTEM = `Du erzeugst 10 Hook-Alternativen für ein Kurzvideo-Skript.
Hook = Erste 1-2 Sätze, max 20 Wörter.

Du verteilst die 10 Hooks über 5 Pattern (jeweils 2 Hooks pro Pattern):
- "frage": eine provokante oder neugierig machende Frage
- "schock": eine schockierende oder kontroverse Behauptung
- "versprechen": ein konkretes, klares Nutzenversprechen
- "zahl": eine harte Zahl als Hook (Statistik, Zeitraum, Geldbetrag)
- "story": ein persönlicher Story-Anfang ("Vor 3 Jahren…")

Sprache: deutsch, DU-Form, keine Emojis.

Antworte AUSSCHLIESSLICH mit gültigem JSON-Array, ohne Markdown-Codefences:
[
  { "hook": "string", "pattern": "frage" },
  ...
]`;

export async function generateHookVariants(
  scriptTitle: string,
  scriptText: string,
  apiKey: string,
): Promise<HookVariant[]> {
  const anthropic = new Anthropic({ apiKey });
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2000,
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: `Quell-Skript:\nTitel: ${scriptTitle}\n\n${scriptText}\n\nGib 10 Hook-Alternativen als JSON.`,
      },
    ],
  });

  const block = response.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") throw new Error("Claude lieferte keinen Text-Block");

  const raw = block.text.trim();
  const start = raw.indexOf("[");
  const end = raw.lastIndexOf("]");
  if (start < 0 || end <= start) throw new Error("Claude-Antwort enthielt kein JSON-Array");

  const parsed = JSON.parse(raw.slice(start, end + 1)) as HookVariant[];
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("Claude lieferte leeres Hook-Array");
  }
  return parsed.filter((h) => h.hook && h.pattern);
}
