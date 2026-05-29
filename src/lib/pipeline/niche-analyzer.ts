import Anthropic from "@anthropic-ai/sdk";
import { extractJson } from "@/lib/funnels/json-extract";
import type { ReelHit } from "@/lib/pipeline/apify";

/**
 * Nischen-Analyse nach dem Radar/Hook/Verkauf-Gerüst (die 3 Hebel).
 * Die Differenzierung: nicht „was ist laut", sondern „was zieht UND verkauft".
 */
export type NicheAnalysis = {
  summary: string;        // 2-3 Sätze: Zustand der Nische
  radar: string[];        // Themen, die ziehen UND verkaufen (vs. nur laut)
  hooks: string[];        // 3-Sekunden-Hook-Muster, die hier funktionieren
  verkauf: string[];      // wie im Content verkauft wird, ohne dass es nach Werbung wirkt
  content_gaps: string[]; // unterbespielte, verkaufsstarke Chancen
  recommendation: string; // konkreter nächster Schritt
};

export type ReelScore = {
  index: number;
  sales_score: number;    // 0-100 Verkaufspotenzial
  sales_angle: string;    // wie sich aus diesem Thema verkaufen lässt
};

export type NicheRadar = {
  analysis: NicheAnalysis;
  scores: ReelScore[];
};

const SYSTEM = `Du bist „Sales-Radar" — Analyst für Kurzvideo-Nischen (TikTok, Reels, Shorts, YouTube).
Du bekommst die reichweitenstärksten Videos einer Nische mit Caption und Kennzahlen.

WICHTIG — die Differenzierung: Bewerte NICHT, was nur laut ist (viele Views), sondern was
zieht UND VERKAUFT. Hohe Reichweite ohne Kaufabsicht der Zielgruppe ist wenig wert.

Liefere zwei Dinge:
1. Eine Nischen-Analyse nach 3 Hebeln:
   - radar: Themen/Winkel, die ziehen UND verkaufen (grenze ab gegen reine Reichweite)
   - hooks: Hook-Muster, die in 3 Sekunden über Weiterscrollen entscheiden
   - verkauf: wie in diesen Videos im Content selbst verkauft wird, ohne dass es nach Werbung wirkt
2. Pro Video einen sales_score (0-100 = Verkaufspotenzial) + sales_angle (wie man daraus verkauft).

Antworte AUSSCHLIESSLICH mit gültigem JSON, ohne Markdown-Codefences:
{
  "analysis": {
    "summary": "string",
    "radar": ["string", "..."],
    "hooks": ["string", "..."],
    "verkauf": ["string", "..."],
    "content_gaps": ["string", "..."],
    "recommendation": "string"
  },
  "scores": [
    { "index": 0, "sales_score": 0, "sales_angle": "string" }
  ]
}
Alles auf Deutsch, DU-Form, ohne Emojis. Gib für JEDES Video einen score-Eintrag mit passendem index.`;

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
      return `[index ${i}] (${metrics || "keine Kennzahlen"})${r.author ? ` @${r.author}` : ""}\n   "${r.caption.slice(0, 280)}"`;
    })
    .join("\n");
}

export async function analyzeNiche(
  reels: ReelHit[],
  niche: string,
  apiKey: string,
): Promise<NicheRadar> {
  if (reels.length === 0) throw new Error("Keine Videos zum Analysieren vorhanden");

  const anthropic = new Anthropic({ apiKey });
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 3000,
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: `Nische: "${niche}"\n\nDie ${reels.length} reichweitenstärksten Videos:\n\n${formatReels(reels)}\n\nLiefere Analyse + sales_score je Video als JSON.`,
      },
    ],
  });

  const block = response.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") throw new Error("Claude lieferte keinen Text-Block");

  const parsed = extractJson<NicheRadar>(block.text);
  if (!parsed.analysis?.summary || !Array.isArray(parsed.analysis.radar)) {
    throw new Error("Nischen-Analyse hat unerwartetes Format");
  }
  return {
    analysis: parsed.analysis,
    scores: Array.isArray(parsed.scores) ? parsed.scores : [],
  };
}
