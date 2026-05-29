/**
 * Viral-Research: lädt die Audiospur eines viralen Reels.
 *
 * Dünner Wrapper um das bestehende `download.ts` (yt-dlp) — eigener Name laut
 * Spec-Manifest, keine Logik-Duplikation.
 */
import { downloadAudio, type DownloadResult } from "@/lib/pipeline/download";

export async function downloadReelAudio(url: string): Promise<DownloadResult> {
  return downloadAudio(url);
}
