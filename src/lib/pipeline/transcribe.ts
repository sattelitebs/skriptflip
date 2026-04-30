import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import OpenAI from "openai";

const MAX_BYTES = 25 * 1024 * 1024; // Whisper-Limit

export async function transcribeAudio(audioPath: string, apiKey: string): Promise<string> {
  const { size } = await stat(audioPath);
  if (size > MAX_BYTES) {
    throw new Error(`Audio zu groß (${Math.round(size / 1024 / 1024)} MB, max 25 MB)`);
  }

  const openai = new OpenAI({ apiKey });

  const result = await openai.audio.transcriptions.create({
    file: createReadStream(audioPath),
    model: "whisper-1",
    response_format: "text",
  });

  const text = typeof result === "string" ? result : (result as { text: string }).text;
  if (!text || !text.trim()) throw new Error("Whisper lieferte leeren Transkript");
  return text.trim();
}
