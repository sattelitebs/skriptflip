import type { SupabaseClient } from "@supabase/supabase-js";
import { scanNiche, type Platform, type ReelHit } from "@/lib/pipeline/apify";
import { scanYouTube } from "@/lib/pipeline/youtube";
import { analyzeNiche } from "@/lib/pipeline/niche-analyzer";

/**
 * Wählt die Datenquelle nach Hybrid-Strategie:
 * - youtube  → offizielle YouTube Data API (gratis, legal), Apify als Fallback
 * - instagram/tiktok → Apify
 */
async function discover(niche: string, platform: Platform, limit: number): Promise<ReelHit[]> {
  if (platform === "youtube") {
    if (process.env.YOUTUBE_API_KEY) return scanYouTube(niche, limit);
    if (process.env.APIFY_TOKEN) return scanNiche(niche, "youtube", limit);
    throw new Error(
      "Für YouTube fehlt eine Datenquelle: setze YOUTUBE_API_KEY (empfohlen) oder APIFY_TOKEN.",
    );
  }
  return scanNiche(niche, platform, limit);
}

/**
 * Orchestriert einen Sales-Radar-Scan (inline, kein Background-Job — skriptflip
 * läuft long-running auf Hetzner). Schritte: scanning → analyzing → done | error.
 *
 * Re-rankt die Treffer nach VERKAUFSPOTENZIAL (sales_score), nicht nach reiner
 * Reichweite — das ist die Differenzierung „zieht UND verkauft".
 */
export async function runViralResearchScan(params: {
  supabase: SupabaseClient;
  runId: string;
  niche: string;
  platform: Platform;
  anthropicKey: string;
  limit?: number;
}): Promise<void> {
  const { supabase, runId, niche, platform, anthropicKey, limit = 12 } = params;

  try {
    await supabase.from("viral_research_runs").update({ status: "scanning" }).eq("id", runId);
    const found = await discover(niche, platform, limit);

    if (found.length === 0) {
      throw new Error(
        "Keine Videos für diese Nische gefunden. Versuch ein anderes Keyword oder eine andere Plattform.",
      );
    }

    await supabase
      .from("viral_research_runs")
      .update({ status: "analyzing", reels: found })
      .eq("id", runId);

    const { analysis, scores } = await analyzeNiche(found, niche, anthropicKey);

    // Sales-Scores in die Treffer mergen und nach Verkaufspotenzial neu ranken.
    const scoreByIndex = new Map(scores.map((s) => [s.index, s]));
    const ranked: ReelHit[] = found
      .map((reel, i) => {
        const s = scoreByIndex.get(i);
        return {
          ...reel,
          sales_score: s?.sales_score ?? null,
          sales_angle: s?.sales_angle ?? null,
        };
      })
      .sort((a, b) => (b.sales_score ?? -1) - (a.sales_score ?? -1));

    await supabase
      .from("viral_research_runs")
      .update({ status: "done", reels: ranked, niche_analysis: analysis })
      .eq("id", runId);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unbekannter Fehler";
    await supabase
      .from("viral_research_runs")
      .update({ status: "error", error: message })
      .eq("id", runId);
    throw err;
  }
}
