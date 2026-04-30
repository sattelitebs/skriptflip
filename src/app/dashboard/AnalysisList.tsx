"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const STATUS_LABEL: Record<string, string> = {
  pending: "Wartend",
  downloading: "Lädt Audio…",
  transcribing: "Transkribiert…",
  generating: "Schreibt Skripte…",
  done: "Fertig",
  error: "Fehler",
};

const STATUS_CLASS: Record<string, string> = {
  done: "border-emerald-700 text-emerald-400",
  error: "border-red-700 text-red-400",
};

export type AnalysisListItem = {
  id: string;
  video_url: string;
  status: string;
  created_at: string;
};

export default function AnalysisList({ items }: { items: AnalysisListItem[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const errorCount = items.filter((i) => i.status === "error").length;

  async function deleteOne(id: string) {
    if (!confirm("Diese Analyse wirklich löschen? Zugehörige Repurposes und Voiceovers werden mitgelöscht.")) return;
    setError(null);
    setBusyId(id);
    try {
      const res = await fetch(`/api/analyses/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Löschen fehlgeschlagen");
        return;
      }
      startTransition(() => router.refresh());
    } finally {
      setBusyId(null);
    }
  }

  async function deleteAllErrors() {
    if (errorCount === 0) return;
    if (!confirm(`Wirklich alle ${errorCount} Fehler-Einträge löschen?`)) return;
    setError(null);
    setBusyId("__bulk__");
    try {
      const res = await fetch("/api/analyses/cleanup-errors", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Löschen fehlgeschlagen");
        return;
      }
      startTransition(() => router.refresh());
    } finally {
      setBusyId(null);
    }
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--color-border)] p-12 text-center text-zinc-500">
        Noch keine Analysen. Füge oben einen Link ein, um zu starten.
      </div>
    );
  }

  return (
    <div>
      {errorCount > 0 && (
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs text-zinc-500">
            {errorCount} {errorCount === 1 ? "Fehler-Eintrag" : "Fehler-Einträge"}
          </span>
          <button
            type="button"
            onClick={deleteAllErrors}
            disabled={busyId !== null || isPending}
            className="rounded-md border border-red-800 bg-red-900/20 px-3 py-1 text-xs font-bold uppercase tracking-wide text-red-300 transition hover:border-red-600 hover:text-red-200 disabled:opacity-50"
          >
            {busyId === "__bulk__" ? "Lösche…" : "Alle Fehler löschen"}
          </button>
        </div>
      )}

      {error && <p className="mb-3 text-sm text-red-400">{error}</p>}

      <ul className="divide-y divide-[var(--color-border)] rounded-2xl border border-[var(--color-border)]">
        {items.map((a) => {
          const statusCls = STATUS_CLASS[a.status] ?? "border-[var(--color-border)] text-zinc-400";
          const rowBusy = busyId === a.id;
          return (
            <li key={a.id} className="flex items-center gap-3 px-6 py-4 transition hover:bg-white/5">
              <Link
                href={`/dashboard/analyses/${a.id}`}
                className="min-w-0 flex-1 truncate text-sm text-zinc-300"
              >
                {a.video_url}
              </Link>
              <span
                className={`shrink-0 rounded-md border px-2 py-1 text-xs uppercase tracking-wide ${statusCls}`}
              >
                {STATUS_LABEL[a.status] ?? a.status}
              </span>
              <button
                type="button"
                onClick={() => deleteOne(a.id)}
                disabled={busyId !== null || isPending}
                aria-label="Analyse löschen"
                title="Analyse löschen"
                className="shrink-0 rounded-md border border-[var(--color-border)] px-2 py-1 text-xs text-zinc-500 transition hover:border-red-700 hover:text-red-400 disabled:opacity-50"
              >
                {rowBusy ? "…" : "✕"}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
