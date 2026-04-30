import OpenAI from "openai";

export const VOICES = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"] as const;
export type Voice = (typeof VOICES)[number];

export const VOICE_LABELS: Record<Voice, string> = {
  alloy: "Alloy (neutral)",
  echo: "Echo (männlich, ruhig)",
  fable: "Fable (warm)",
  onyx: "Onyx (männlich, tief)",
  nova: "Nova (weiblich, warm)",
  shimmer: "Shimmer (weiblich, hell)",
};

/**
 * Generiert TTS-Audio. Liefert MP3-Bytes als Uint8Array (Supabase-Storage-kompatibel).
 */
export async function synthesizeSpeech(
  text: string,
  voice: Voice,
  apiKey: string,
): Promise<Uint8Array> {
  const openai = new OpenAI({ apiKey });
  const response = await openai.audio.speech.create({
    model: "tts-1-hd",
    voice,
    input: text,
    response_format: "mp3",
  });
  const arrayBuffer = await response.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}
