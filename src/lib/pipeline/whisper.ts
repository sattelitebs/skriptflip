/**
 * Viral-Research: transkribiert die Audiospur eines viralen Reels.
 *
 * Dünner Wrapper um das bestehende `transcribe.ts` (OpenAI Whisper) — eigener
 * Name laut Spec-Manifest, keine Logik-Duplikation.
 */
import { transcribeAudio } from "@/lib/pipeline/transcribe";

export async function transcribeReel(audioPath: string, apiKey: string): Promise<string> {
  return transcribeAudio(audioPath, apiKey);
}
