import Anthropic from "@anthropic-ai/sdk";
import { extractJson } from "@/lib/funnels/json-extract";
import type { ReelHit } from "@/lib/pipeline/apify";

export type NicheAnalysis = {
  summary: string;            // 2-3 Sätze: Zustand der Nische
  top_patterns: string[];     // wiederkehrende Erfolgs-Muster
  common_hooks: string[];     // Hook-Typen, die hier ziehen
  content_gaps: string[];     // unterbespielte Themen / Chancen
  recommendation: string;     // konkreter nächster Schritt für den User
};

const SYSTEM = `Du bist Viral-Research-Analyst für Kurzvideo-Nischen (TikTok, Reels, Shorts).
Du bekommst eine Liste der aktuell viralsten Videos einer Nische — mit Caption und Kennzahlen
(Views, Likes, Kommentare). Leite daraus Muster ab. Rate nicht über Inhalte, die nicht in den
Daten stehen.

Antworte AUSSCHLIESSLICH mit gültigem JSON in diesem Format, ohne Markdown-Codefences:
{
  "summary": "string",
  "top_patterns": ["string", "..."],
  "common_hooks": ["string", "..."],
  "content_gaps": ["string", "..."],
  "recommendation": "string"
}
Alles auf Deutsch, in DU-Form, ohne Emojis.`;

function formatReels(reels: ReelHit[]): string {
  return reels
    .map((r, i) => {
      const metrics = [
        r.views != null ? `${r.views} Views` : null,
        r.likes != null ? `${r.likes} Likes` : null,
        r.comments != null ? `${r.comments} Kommentare` : null,
      ]
        .filter(Boolean)
        .join(", ");
      return `${i + 1}. [${metrics || "keine Kennzahlen"}]${r.author ? ` @${r.author}` : ""}\n   "${r.caption.slice(0, 280)}"`;
    })
    .join("\n");
}

export async function analyzeNiche(
  reels: ReelHit[],
  niche: string,
  apiKey: string,
): Promise<NicheAnalysis> {
  if (reels.length === 0) throw new Error("Keine Reels zum Analysieren vorhanden");

  const anthropic = new Anthropic({ apiKey });
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2000,
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: `Nische: "${niche}"\n\nDie ${reels.length} viralsten Videos:\n\n${formatReels(reels)}\n\nLiefere die Nischen-Analyse als JSON.`,
      },
    ],
  });

  const block = response.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") throw new Error("Claude lieferte keinen Text-Block");

  const parsed = extractJson<NicheAnalysis>(block.text);
  if (!parsed.summary || !Array.isArray(parsed.top_patterns)) {
    throw new Error("Nischen-Analyse hat unerwartetes Format");
  }
  return parsed;
}
