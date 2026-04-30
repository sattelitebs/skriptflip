import Anthropic from "@anthropic-ai/sdk";

export type GeneratedScripts = {
  hook_analysis: string;
  scripts: { title: string; script: string }[];
};

const SYSTEM = `Du bist Skript-Analyst für virale Kurzvideos (TikTok, Reels, Shorts).
Du bekommst das Transkript eines viralen Videos.
Deine Aufgabe:
1. Analysiere kurz, warum dieses Video viral funktioniert (Hook, Aufbau, Call-to-Action). Maximal 4 Sätze.
2. Schreibe DREI eigenständige neue Skript-Versionen, die das gleiche Erfolgs-Muster nutzen, aber inhaltlich frisch sind.
   - Jedes Skript ca. 30-60 Sekunden Sprechzeit (≈ 80-150 Wörter).
   - Klare Hook in Zeile 1 (Pattern-Interrupt, Frage oder Behauptung).
   - Sprechfertig, in DU-Form, deutsch.
   - Kein Hashtag-Spam, keine Emojis im Skript.
3. Gib dem Output eine knackige Titel-Zeile pro Skript.

Antworte AUSSCHLIESSLICH mit gültigem JSON in diesem Format, ohne Markdown-Codefences:
{
  "hook_analysis": "string",
  "scripts": [
    { "title": "string", "script": "string" },
    { "title": "string", "script": "string" },
    { "title": "string", "script": "string" }
  ]
}`;

export async function generateScripts(
  transcript: string,
  apiKey: string,
): Promise<GeneratedScripts> {
  const anthropic = new Anthropic({ apiKey });
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4000,
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: `Hier ist das Transkript:\n\n---\n${transcript}\n---\n\nLiefere die Analyse + 3 Skript-Versionen als JSON.`,
      },
    ],
  });

  const block = response.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") throw new Error("Claude lieferte keinen Text-Block");

  const raw = block.text.trim();
  const jsonStart = raw.indexOf("{");
  const jsonEnd = raw.lastIndexOf("}");
  if (jsonStart < 0 || jsonEnd <= jsonStart) {
    throw new Error("Claude-Antwort enthielt kein JSON");
  }

  const parsed = JSON.parse(raw.slice(jsonStart, jsonEnd + 1)) as GeneratedScripts;
  if (!parsed.hook_analysis || !Array.isArray(parsed.scripts) || parsed.scripts.length !== 3) {
    throw new Error("Claude-JSON hat unerwartetes Format");
  }
  return parsed;
}
