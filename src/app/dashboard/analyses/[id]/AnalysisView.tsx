"use client";

import { useEffect, useState } from "react";
import HookVariantsPanel from "./HookVariantsPanel";
import VoiceoverPanel from "./VoiceoverPanel";

type Script = { title: string; script: string };
type Analysis = {
  id: string;
  video_url: string;
  status: "pending" | "downloading" | "transcribing" | "generating" | "done" | "error";
  transcript: string | null;
  scripts: { hook_analysis: string; scripts: Script[] } | null;
  error: string | null;
};

type RepurposeFormats = {
  tiktok_hook_15s: string;
  reel_30s: string;
  yt_short_60s: string;
  yt_long_outline: string;
  ig_caption: string;
  tweet: string;
  linkedin_post: string;
  newsletter_snippet: string;
};

type Repurpose = {
  id: string;
  source_script_index: number;
  formats: RepurposeFormats | null;
  status: "pending" | "generating" | "done" | "error";
  error: string | null;
};

type Voiceover = {
  id: string;
  source_script_index: number;
  voice: string | null;
};

const STATUS_LABEL: Record<Analysis["status"], string> = {
  pending: "Wartend",
  downloading: "Audio wird geladen…",
  transcribing: "Wird transkribiert…",
  generating: "Skripte werden geschrieben…",
  done: "Fertig",
  error: "Fehler",
};

const FORMAT_LABEL: Record<keyof RepurposeFormats, string> = {
  tiktok_hook_15s: "TikTok-Hook (15s)",
  reel_30s: "Instagram Reel (30s)",
  yt_short_60s: "YouTube Short (60s)",
  yt_long_outline: "YouTube Long-Form Outline",
  ig_caption: "Instagram Caption",
  tweet: "X / Tweet",
  linkedin_post: "LinkedIn Post",
  newsletter_snippet: "Newsletter-Snippet",
};

const TERMINAL: Analysis["status"][] = ["done", "error"];

export default function AnalysisView({
  initial,
  initialRepurposes,
  initialVoiceovers,
}: {
  initial: Analysis;
  initialRepurposes: Repurpose[];
  initialVoiceovers: Voiceover[];
}) {
  const [analysis, setAnalysis] = useState<Analysis>(initial);
  const [repurposes, setRepurposes] = useState<Repurpose[]>(initialRepurposes);
  const voiceoversByIndex = initialVoiceovers.reduce<Record<number, Voiceover[]>>(
    (acc, v) => {
      (acc[v.source_script_index] ??= []).push(v);
      return acc;
    },
    {},
  );
  const [busyIndex, setBusyIndex] = useState<number | null>(null);
  const [errorByIndex, setErrorByIndex] = useState<Record<number, string>>({});

  useEffect(() => {
    if (TERMINAL.includes(analysis.status)) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/analyses/${analysis.id}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as Analysis;
        setAnalysis(data);
        if (TERMINAL.includes(data.status)) clearInterval(interval);
      } catch {
        // Netz-Hänger ignorieren
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [analysis.id, analysis.status]);

  const isWorking = !TERMINAL.includes(analysis.status);

  function repurposeFor(index: number): Repurpose | undefined {
    return repurposes.find((r) => r.source_script_index === index && r.status === "done");
  }

  async function startRepurpose(scriptIndex: number) {
    setBusyIndex(scriptIndex);
    setErrorByIndex((s) => ({ ...s, [scriptIndex]: "" }));
    try {
      const res = await fetch(`/api/analyses/${analysis.id}/repurpose`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script_index: scriptIndex }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorByIndex((s) => ({ ...s, [scriptIndex]: data.error ?? "Fehler" }));
        return;
      }
      setRepurposes((prev) => [
        {
          id: data.id,
          source_script_index: scriptIndex,
          formats: data.formats,
          status: "done",
          error: null,
        },
        ...prev.filter(
          (r) => !(r.source_script_index === scriptIndex && r.status !== "done"),
        ),
      ]);
    } catch (err) {
      setErrorByIndex((s) => ({
        ...s,
        [scriptIndex]: err instanceof Error ? err.message : "Netzwerkfehler",
      }));
    } finally {
      setBusyIndex(null);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <a
        href="/dashboard"
        className="mb-8 inline-block text-sm text-zinc-400 transition hover:text-white"
      >
        ← Zurück zum Dashboard
      </a>

      <h1 className="mb-2 text-balance text-3xl font-black uppercase tracking-tight sm:text-4xl">
        Analyse
      </h1>
      <p className="mb-8 break-all text-sm text-zinc-400">{analysis.video_url}</p>

      <div className="mb-8 flex items-center gap-3">
        <span
          className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs uppercase tracking-wide ${
            analysis.status === "error"
              ? "border-red-500/40 bg-red-500/10 text-red-300"
              : analysis.status === "done"
                ? "border-[var(--color-brand)]/40 bg-[var(--color-brand)]/10 text-[var(--color-brand)]"
                : "border-[var(--color-border)] text-zinc-300"
          }`}
        >
          {isWorking && (
            <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--color-brand)]" />
          )}
          {STATUS_LABEL[analysis.status]}
        </span>
      </div>

      {analysis.status === "error" && analysis.error && (
        <div className="mb-8 rounded-xl border border-red-500/40 bg-red-500/10 p-6 text-sm text-red-200">
          <p className="mb-2 font-bold">Da ist was schiefgegangen:</p>
          <p className="break-words">{analysis.error}</p>
        </div>
      )}

      {analysis.scripts && (
        <section className="mb-12">
          <h2 className="mb-3 text-xl font-bold">Hook-Analyse</h2>
          <p className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 text-zinc-200">
            {analysis.scripts.hook_analysis}
          </p>
        </section>
      )}

      {analysis.scripts?.scripts && (
        <section className="mb-12">
          <h2 className="mb-4 text-xl font-bold">3 Skript-Versionen</h2>
          <div className="grid gap-4">
            {analysis.scripts.scripts.map((s, i) => {
              const existing = repurposeFor(i);
              const busy = busyIndex === i;
              const err = errorByIndex[i];
              return (
                <article
                  key={i}
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-6"
                >
                  <h3 className="mb-3 font-bold uppercase tracking-tight text-[var(--color-brand)]">
                    {i + 1}. {s.title}
                  </h3>
                  <p className="mb-5 whitespace-pre-wrap text-zinc-200">{s.script}</p>

                  <div className="flex flex-wrap gap-3">
                    {!existing && (
                      <button
                        type="button"
                        onClick={() => startRepurpose(i)}
                        disabled={busy}
                        className="rounded-md border border-[var(--color-brand)] px-4 py-2 text-sm font-bold uppercase tracking-wide text-[var(--color-brand)] transition hover:bg-[var(--color-brand)] hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {busy ? "Generiere 8 Formate…" : "In 8 Formate umwandeln"}
                      </button>
                    )}
                    <HookVariantsPanel analysisId={analysis.id} scriptIndex={i} />
                  </div>
                  {err && <p className="mt-3 text-sm text-red-400">{err}</p>}

                  <div className="mt-6 border-t border-[var(--color-border)] pt-5">
                    <p className="mb-3 text-xs uppercase tracking-wide text-zinc-500">
                      Voiceover
                    </p>
                    <VoiceoverPanel
                      analysisId={analysis.id}
                      scriptIndex={i}
                      existing={voiceoversByIndex[i] ?? []}
                    />
                  </div>

                  {existing?.formats && (
                    <div className="mt-6 grid gap-3">
                      {(Object.keys(FORMAT_LABEL) as (keyof RepurposeFormats)[]).map(
                        (key) => (
                          <details
                            key={key}
                            className="rounded-lg border border-[var(--color-border)] bg-black/40"
                          >
                            <summary className="cursor-pointer list-none px-4 py-3 text-sm font-bold text-zinc-300 transition hover:text-[var(--color-brand)]">
                              {FORMAT_LABEL[key]}
                            </summary>
                            <p className="whitespace-pre-wrap border-t border-[var(--color-border)] px-4 py-3 text-sm text-zinc-200">
                              {existing.formats?.[key]}
                            </p>
                          </details>
                        ),
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      )}

      {analysis.transcript && (
        <section>
          <h2 className="mb-3 text-xl font-bold">Transkript</h2>
          <p className="whitespace-pre-wrap rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 text-sm text-zinc-300">
            {analysis.transcript}
          </p>
        </section>
      )}
    </div>
  );
}
