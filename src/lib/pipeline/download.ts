import { spawn } from "node:child_process";
import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const YTDLP = process.env.YTDLP_BIN ?? "/opt/homebrew/bin/yt-dlp";

export type DownloadResult = {
  audioPath: string;
  cleanup: () => Promise<void>;
};

/**
 * Lädt nur die Audiospur eines Videos (TikTok/IG/YT) als m4a in ein temporäres
 * Verzeichnis. Cleanup gibt den Ordner wieder frei.
 */
export async function downloadAudio(url: string): Promise<DownloadResult> {
  const dir = await mkdtemp(path.join(tmpdir(), "skriptflip-"));
  const outTemplate = path.join(dir, "audio.%(ext)s");

  await new Promise<void>((resolve, reject) => {
    const proc = spawn(
      YTDLP,
      [
        "--no-playlist",
        "--no-warnings",
        "-f",
        "bestaudio/best",
        "-x",
        "--audio-format",
        "m4a",
        "--audio-quality",
        "5",
        "-o",
        outTemplate,
        url,
      ],
      { stdio: ["ignore", "pipe", "pipe"] },
    );

    let stderr = "";
    proc.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`yt-dlp exit ${code}: ${stderr.slice(0, 500)}`));
    });
  });

  const files = await readdir(dir);
  const audio = files.find((f) => f.startsWith("audio."));
  if (!audio) throw new Error("yt-dlp lieferte keine Audiodatei");

  return {
    audioPath: path.join(dir, audio),
    cleanup: () => rm(dir, { recursive: true, force: true }),
  };
}
