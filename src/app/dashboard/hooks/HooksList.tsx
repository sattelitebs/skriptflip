"use client";

import { useMemo, useState } from "react";

type Pattern = "frage" | "schock" | "versprechen" | "zahl" | "story" | "andere";

type SavedHook = {
  id: string;
  hook: string;
  pattern: Pattern | null;
  notes: string | null;
  source_analysis_id: string | null;
  source_script_index: number | null;
  created_at: string;
};

const PATTERN_LABEL: Record<Pattern, string> = {
  frage: "Frage",
  schock: "Schock",
  versprechen: "Versprechen",
  zahl: "Zahl",
  story: "Story",
  andere: "Andere",
};

const FILTERS: ("alle" | Pattern)[] = [
  "alle",
  "frage",
  "schock",
  "versprechen",
  "zahl",
  "story",
  "andere",
];

export default function HooksList({ initial }: { initial: SavedHook[] }) {
  const [hooks, setHooks] = useState<SavedHook[]>(initial);
  const [filter, setFilter] = useState<"alle" | Pattern>("alle");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered = useMemo(
    () => (filter === "alle" ? hooks : hooks.filter((h) => h.pattern === filter)),
    [hooks, filter],
  );

  async function copyHook(h: SavedHook) {
    try {
      await navigator.clipboard.writeText(h.hook);
      setCopiedId(h.id);
      setTimeout(() => setCopiedId((c) => (c === h.id ? null : c)), 1500);
    } catch {
      // ignore
    }
  }

  async function deleteHook(id: string) {
    if (!confirm("Hook wirklich löschen?")) return;
    const res = await fetch(`/api/saved-hooks/${id}`, { method: "DELETE" });
    if (res.ok) setHooks((h) => h.filter((x) => x.id !== id));
  }

  if (hooks.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--color-border)] p-12 text-center text-zinc-500">
        Noch keine Hooks gespeichert. Generiere bei einer Analyse 10 Hook-Alternativen
        und speichere die besten hier.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const count = f === "alle" ? hooks.length : hooks.filter((h) => h.pattern === f).length;
          const active = filter === f;
          return (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              disabled={count === 0 && f !== "alle"}
              className={`rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-wide transition ${
                active
                  ? "border-[var(--color-brand)] bg-[var(--color-brand)] text-black"
                  : "border-[var(--color-border)] text-zinc-400 hover:border-[var(--color-brand)] hover:text-[var(--color-brand)]"
              } disabled:cursor-not-allowed disabled:opacity-30`}
            >
              {f === "alle" ? "Alle" : PATTERN_LABEL[f]} ({count})
            </button>
          );
        })}
      </div>

      <ul className="space-y-3">
        {filtered.map((h) => (
          <li
            key={h.id}
            className="flex items-start gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4"
          >
            {h.pattern && (
              <span className="shrink-0 rounded bg-zinc-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-300">
                {PATTERN_LABEL[h.pattern]}
              </span>
            )}
            <p className="flex-1 text-zinc-200">{h.hook}</p>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => copyHook(h)}
                className="rounded border border-zinc-700 px-2 py-1 text-xs font-bold uppercase tracking-wide text-zinc-400 transition hover:border-[var(--color-brand)] hover:text-[var(--color-brand)]"
              >
                {copiedId === h.id ? "✓ Kopiert" : "Kopieren"}
              </button>
              <button
                type="button"
                onClick={() => deleteHook(h.id)}
                className="rounded border border-zinc-700 px-2 py-1 text-xs font-bold uppercase tracking-wide text-zinc-500 transition hover:border-red-500 hover:text-red-400"
              >
                Löschen
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
