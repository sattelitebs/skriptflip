import Anthropic from "@anthropic-ai/sdk";
import { extractJson } from "@/lib/funnels/json-extract";

export type ReelMeta = {
  caption?: string;
  views?: number | null;
  likes?: number | null;
};

export type ReelAnalysis = {
  hook_type: string;          // z.B. "Pattern-Interrupt-Frage"
  why_viral: string;          // 2-4 Sätze
  structure: string[];        // Aufbau in Schritten
  retention_tactics: string[];// was Zuschauer hält
};

const SYSTEM = `Du bist Viral-Research-Analyst für Kurzvideos (TikTok, Reels, Shorts).
Du bekommst das Transkript eines viralen Videos und optionale Kennzahlen.
Analysiere präzise, WARUM dieses Video funktioniert.

Antworte AUSSCHLIESSLICH mit gültigem JSON in diesem Format, ohne Markdown-Codefences:
{
  "hook_type": "string",
  "why_viral": "string",
  "structure": ["string", "..."],
  "retention_tactics": ["string", "..."]
}
Alles auf Deutsch, in DU-Form, ohne Emojis.`;

export async function analyzeReel(
  transcript: string,
  meta: ReelMeta,
  apiKey: string,
): Promise<ReelAnalysis> {
  const anthropic = new Anthropic({ apiKey });

  const metaLine = [
    meta.views != null ? `${meta.views} Views` : null,
    meta.likes != null ? `${meta.likes} Likes` : null,
    meta.caption ? `Caption: "${meta.caption.slice(0, 280)}"` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1500,
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: `${metaLine ? metaLine + "\n\n" : ""}Transkript:\n\n---\n${transcript}\n---\n\nLiefere die Reel-Analyse als JSON.`,
      },
    ],
  });

  const block = response.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") throw new Error("Claude lieferte keinen Text-Block");

  const parsed = extractJson<ReelAnalysis>(block.text);
  if (!parsed.why_viral || !Array.isArray(parsed.structure)) {
    throw new Error("Reel-Analyse hat unerwartetes Format");
  }
  return parsed;
}
