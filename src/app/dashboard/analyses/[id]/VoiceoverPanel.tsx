"use client";

import { useState } from "react";

type Voice = "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";

const VOICE_LABELS: Record<Voice, string> = {
  alloy: "Alloy (neutral)",
  echo: "Echo (m, ruhig)",
  fable: "Fable (warm)",
  onyx: "Onyx (m, tief)",
  nova: "Nova (w, warm)",
  shimmer: "Shimmer (w, hell)",
};

type ExistingVoiceover = {
  id: string;
  voice: string | null;
};

export default function VoiceoverPanel({
  analysisId,
  scriptIndex,
  existing,
}: {
  analysisId: string;
  scriptIndex: number;
  existing: ExistingVoiceover[];
}) {
  const [voice, setVoice] = useState<Voice>("nova");
  const [voiceovers, setVoiceovers] = useState<ExistingVoiceover[]>(existing);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/analyses/${analysisId}/voiceover`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script_index: scriptIndex, voice }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Fehler");
        return;
      }
      setVoiceovers((vs) => [{ id: data.id, voice: data.voice }, ...vs]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Netzwerkfehler");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={voice}
          onChange={(e) => setVoice(e.target.value as Voice)}
          disabled={loading}
          className="rounded-md border border-zinc-700 bg-black px-3 py-2 text-sm text-zinc-200 focus:border-[var(--color-brand)] focus:outline-none"
        >
          {(Object.keys(VOICE_LABELS) as Voice[]).map((v) => (
            <option key={v} value={v}>
              {VOICE_LABELS[v]}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={generate}
          disabled={loading}
          className="rounded-md border border-zinc-600 px-4 py-2 text-sm font-bold uppercase tracking-wide text-zinc-300 transition hover:border-[var(--color-brand)] hover:text-[var(--color-brand)] disabled:opacity-50"
        >
          {loading ? "Generiere Voiceover…" : "Voiceover generieren"}
        </button>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}

      {voiceovers.length > 0 && (
        <div className="space-y-2">
          {voiceovers.map((v) => (
            <div
              key={v.id}
              className="flex flex-wrap items-center gap-3 rounded-lg border border-[var(--color-border)] bg-black/40 p-3"
            >
              <span className="text-xs uppercase tracking-wide text-zinc-400">
                {VOICE_LABELS[(v.voice ?? "nova") as Voice] ?? v.voice}
              </span>
              <audio
                controls
                preload="none"
                src={`/api/voiceovers/${v.id}/audio`}
                className="h-9"
              />
              <a
                href={`/api/voiceovers/${v.id}/audio`}
                download
                className="rounded border border-zinc-700 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-zinc-400 transition hover:border-[var(--color-brand)] hover:text-[var(--color-brand)]"
              >
                Download
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
