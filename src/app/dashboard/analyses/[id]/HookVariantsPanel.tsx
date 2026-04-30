"use client";

import { useState } from "react";

type HookPattern = "frage" | "schock" | "versprechen" | "zahl" | "story";
type Variant = { hook: string; pattern: HookPattern };

const PATTERN_LABEL: Record<HookPattern, string> = {
  frage: "Frage",
  schock: "Schock",
  versprechen: "Versprechen",
  zahl: "Zahl",
  story: "Story",
};

export default function HookVariantsPanel({
  analysisId,
  scriptIndex,
}: {
  analysisId: string;
  scriptIndex: number;
}) {
  const [variants, setVariants] = useState<Variant[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Record<number, "saving" | "saved" | "error">>({});

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/analyses/${analysisId}/hook-variants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script_index: scriptIndex }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Fehler");
        return;
      }
      setVariants(data.variants);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Netzwerkfehler");
    } finally {
      setLoading(false);
    }
  }

  async function saveHook(idx: number, v: Variant) {
    setSavedIds((s) => ({ ...s, [idx]: "saving" }));
    try {
      const res = await fetch("/api/saved-hooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hook: v.hook,
          pattern: v.pattern,
          source_analysis_id: analysisId,
          source_script_index: scriptIndex,
        }),
      });
      if (!res.ok) {
        setSavedIds((s) => ({ ...s, [idx]: "error" }));
        return;
      }
      setSavedIds((s) => ({ ...s, [idx]: "saved" }));
    } catch {
      setSavedIds((s) => ({ ...s, [idx]: "error" }));
    }
  }

  if (!variants) {
    return (
      <div>
        <button
          type="button"
          onClick={generate}
          disabled={loading}
          className="rounded-md border border-zinc-600 px-4 py-2 text-sm font-bold uppercase tracking-wide text-zinc-300 transition hover:border-[var(--color-brand)] hover:text-[var(--color-brand)] disabled:opacity-50"
        >
          {loading ? "Generiere 10 Hooks…" : "10 Hook-Alternativen"}
        </button>
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs uppercase tracking-wide text-zinc-500">10 Hook-Alternativen</p>
      {variants.map((v, i) => {
        const saveState = savedIds[i];
        return (
          <div
            key={i}
            className="flex items-start gap-3 rounded-lg border border-[var(--color-border)] bg-black/40 p-3"
          >
            <span className="shrink-0 rounded bg-zinc-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-300">
              {PATTERN_LABEL[v.pattern] ?? v.pattern}
            </span>
            <p className="flex-1 text-sm text-zinc-200">{v.hook}</p>
            <button
              type="button"
              onClick={() => saveHook(i, v)}
              disabled={saveState === "saving" || saveState === "saved"}
              className="shrink-0 rounded border border-zinc-700 px-2 py-1 text-xs font-bold uppercase tracking-wide text-zinc-400 transition hover:border-[var(--color-brand)] hover:text-[var(--color-brand)] disabled:cursor-not-allowed"
            >
              {saveState === "saved"
                ? "✓ Gespeichert"
                : saveState === "saving"
                  ? "…"
                  : saveState === "error"
                    ? "Fehler"
                    : "Speichern"}
            </button>
          </div>
        );
      })}
    </div>
  );
}
