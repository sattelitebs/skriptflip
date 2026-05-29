import Anthropic from "@anthropic-ai/sdk";
import { extractJson } from "@/lib/funnels/json-extract";
import type { ReelAnalysis } from "@/lib/pipeline/reel-analyzer";
import type { GeneratedScripts } from "@/lib/pipeline/generate";

/**
 * Generiert 3 eigene Skript-Versionen auf Basis von Transkript + Reel-Analyse.
 * Rückgabe-Form identisch zu `generate.ts` (GeneratedScripts) → passt direkt in
 * die bestehende `analyses.scripts`-Spalte und allen Downstream.
 */
const SYSTEM = `Du bist Skript-Autor für virale Kurzvideos (TikTok, Reels, Shorts), die VERKAUFEN.
Du bekommst das Transkript eines viralen Videos PLUS eine Analyse, warum es funktioniert
und wie sich daraus verkaufen lässt. Nutze das Erfolgs-Muster, schreibe inhaltlich frische,
eigenständige Skripte — kein Nachsprechen des Originals.

Regeln pro Skript:
- ca. 30-60 Sekunden Sprechzeit (≈ 80-150 Wörter)
- klare Hook in Zeile 1, die in 3 Sekunden über Weiterscrollen entscheidet
- baue einen dezenten Verkaufs-Move ein (im Content verkaufen, ohne dass es nach Werbung wirkt)
- sprechfertig, DU-Form, deutsch
- kein Hashtag-Spam, keine Emojis

Antworte AUSSCHLIESSLICH mit gültigem JSON in diesem Format, ohne Markdown-Codefences:
{
  "hook_analysis": "string",
  "scripts": [
    { "title": "string", "script": "string" },
    { "title": "string", "script": "string" },
    { "title": "string", "script": "string" }
  ]
}`;

export async function generateScriptsFromReel(
  transcript: string,
  analysis: ReelAnalysis,
  niche: string,
  apiKey: string,
  salesAngle?: string | null,
): Promise<GeneratedScripts> {
  const anthropic = new Anthropic({ apiKey });
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4000,
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: `Nische: "${niche}"

Erfolgs-Analyse des Originals:
- Hook-Typ: ${analysis.hook_type}
- Warum viral: ${analysis.why_viral}
- Aufbau: ${analysis.structure.join(" → ")}
- Retention: ${analysis.retention_tactics.join("; ")}
- Verkaufs-Move: ${analysis.how_to_sell}${salesAngle ? `\n- Verkaufs-Winkel (Sales-Radar): ${salesAngle}` : ""}

Transkript des Originals:
---
${transcript}
---

Liefere die Hook-Analyse + 3 eigene Skript-Versionen als JSON.`,
      },
    ],
  });

  const block = response.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") throw new Error("Claude lieferte keinen Text-Block");

  const parsed = extractJson<GeneratedScripts>(block.text);
  if (!parsed.hook_analysis || !Array.isArray(parsed.scripts) || parsed.scripts.length !== 3) {
    throw new Error("Skript-Generierung hat unerwartetes Format");
  }
  return parsed;
}
