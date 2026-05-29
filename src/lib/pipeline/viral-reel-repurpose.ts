import type { SupabaseClient } from "@supabase/supabase-js";
import { downloadReelAudio } from "@/lib/pipeline/source-download";
import { transcribeReel } from "@/lib/pipeline/whisper";
import { analyzeReel, type ReelMeta } from "@/lib/pipeline/reel-analyzer";
import { generateScriptsFromReel } from "@/lib/pipeline/script-generation";

/**
 * Orchestriert das Repurpose EINES viralen Reels in 3 eigene Skripte.
 *
 * Schreibt das Ergebnis in die bestehende `analyses`-Tabelle → der komplette
 * Downstream (Hook-Varianten, Repurposing-Formate, Voiceover) funktioniert sofort.
 * Gibt die angelegte analyses-ID zurück, damit die UI dorthin verlinken kann.
 */
export async function runViralReelRepurpose(params: {
  supabase: SupabaseClient;
  userId: string;
  reelUrl: string;
  niche: string;
  meta: ReelMeta;
  openaiKey: string;
  anthropicKey: string;
}): Promise<string> {
  const { supabase, userId, reelUrl, niche, meta, openaiKey, anthropicKey } = params;

  const { data: row, error: insertErr } = await supabase
    .from("analyses")
    .insert({ user_id: userId, video_url: reelUrl, status: "downloading" })
    .select("id")
    .single();
  if (insertErr || !row) {
    throw new Error(insertErr?.message ?? "DB-Fehler beim Anlegen der Analyse");
  }
  const analysisId = row.id as string;

  let cleanup: (() => Promise<void>) | null = null;
  try {
    const dl = await downloadReelAudio(reelUrl);
    cleanup = dl.cleanup;

    await supabase.from("analyses").update({ status: "transcribing" }).eq("id", analysisId);
    const transcript = await transcribeReel(dl.audioPath, openaiKey);

    await supabase
      .from("analyses")
      .update({ status: "generating", transcript })
      .eq("id", analysisId);

    const analysis = await analyzeReel(transcript, meta, anthropicKey);
    const scripts = await generateScriptsFromReel(transcript, analysis, niche, anthropicKey);

    await supabase
      .from("analyses")
      .update({ status: "done", scripts })
      .eq("id", analysisId);

    return analysisId;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unbekannter Fehler";
    await supabase
      .from("analyses")
      .update({ status: "error", error: message })
      .eq("id", analysisId);
    throw err;
  } finally {
    if (cleanup) await cleanup().catch(() => {});
  }
}
