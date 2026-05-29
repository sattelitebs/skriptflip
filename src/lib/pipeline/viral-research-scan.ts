import type { SupabaseClient } from "@supabase/supabase-js";
import { scanNiche, type Platform } from "@/lib/pipeline/apify";
import { analyzeNiche } from "@/lib/pipeline/niche-analyzer";

/**
 * Orchestriert einen Viral-Research-Scan (inline, kein Background-Job — skriptflip
 * läuft long-running auf Hetzner). Aktualisiert die `viral_research_runs`-Zeile
 * schrittweise: scanning → analyzing → done | error.
 *
 * Logik ist bewusst als pure Funktion gekapselt, damit sie später unverändert
 * von einem Trigger.dev-Job aufgerufen werden könnte.
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
    const reels = await scanNiche(niche, platform, limit);

    if (reels.length === 0) {
      throw new Error(
        "Keine viralen Videos für diese Nische gefunden. Versuch ein anderes Keyword oder eine andere Plattform.",
      );
    }

    await supabase
      .from("viral_research_runs")
      .update({ status: "analyzing", reels })
      .eq("id", runId);

    const niche_analysis = await analyzeNiche(reels, niche, anthropicKey);

    await supabase
      .from("viral_research_runs")
      .update({ status: "done", niche_analysis })
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
