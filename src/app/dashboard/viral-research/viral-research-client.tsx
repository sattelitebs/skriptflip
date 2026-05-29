"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteRun } from "./actions";

type Platform = "instagram" | "tiktok" | "youtube";

type ReelHit = {
  url: string;
  caption: string;
  author: string | null;
  views: number | null;
  likes: number | null;
  comments: number | null;
  thumbnailUrl: string | null;
  sales_score: number | null;
  sales_angle: string | null;
};

type NicheAnalysis = {
  summary: string;
  radar: string[];
  hooks: string[];
  verkauf: string[];
  content_gaps: string[];
  recommendation: string;
};

type Run = {
  id: string;
  niche: string;
  platform: Platform;
  status: string;
  reels: ReelHit[] | null;
  niche_analysis: NicheAnalysis | null;
  error: string | null;
};

type RecentRun = {
  id: string;
  niche: string;
  platform: Platform;
  status: string;
  created_at: string;
};

const PLATFORM_LABELS: Record<Platform, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
};

function formatCount(n: number | null): string {
  if (n == null) return "–";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export default function ViralResearchClient({
  disabled,
  recentRuns,
}: {
  disabled: boolean;
  recentRuns: RecentRun[];
}) {
  const router = useRouter();
  const [niche, setNiche] = useState("");
  const [platform, setPlatform] = useState<Platform>("instagram");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [run, setRun] = useState<Run | null>(null);
  const [repurposing, setRepurposing] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  async function loadRun(id: string) {
    const res = await fetch(`/api/viral-research/${id}`);
    const data = await res.json();
    if (res.ok) setRun(data as Run);
    else setError(data.error ?? "Run konnte nicht geladen werden.");
  }

  async function onScan(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setRun(null);
    setLoading(true);
    try {
      const res = await fetch("/api/viral-research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche, platform }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Scan fehlgeschlagen.");
        return;
      }
      await loadRun(data.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Netzwerkfehler");
    } finally {
      setLoading(false);
    }
  }

  async function onRepurpose(index: number) {
    if (!run) return;
    setError(null);
    setRepurposing(index);
    try {
      const res = await fetch(`/api/viral-research/${run.id}/repurpose`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reel_index: index }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Repurpose fehlgeschlagen.");
        return;
      }
      router.push(`/dashboard/analyses/${data.analysis_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Netzwerkfehler");
    } finally {
      setRepurposing(null);
    }
  }

  const analysis = run?.niche_analysis;
  const reels = run?.reels ?? [];

  return (
    <div className="flex flex-col gap-10">
      {/* Scan-Formular */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-8">
        <h2 className="mb-2 text-xl font-bold">Nische scannen</h2>
        <p className="mb-6 text-sm text-zinc-400">
          Gib eine Nische, ein Thema oder einen Hashtag ein. Die KI holt die viralsten Videos
          und verdichtet sie zu den Mustern, die gerade ziehen.
        </p>
        <form onSubmit={onScan} className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              required
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              placeholder="z. B. Finanzen für Anfänger, Hundetraining, faceless YouTube"
              disabled={loading || disabled}
              className="flex-1 rounded-md border border-[var(--color-border)] bg-black px-4 py-3 text-white placeholder:text-zinc-600 focus:border-[var(--color-brand)] focus:outline-none disabled:opacity-50"
            />
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value as Platform)}
              disabled={loading || disabled}
              className="rounded-md border border-[var(--color-border)] bg-black px-4 py-3 text-white focus:border-[var(--color-brand)] focus:outline-none disabled:opacity-50"
            >
              <option value="instagram">Instagram</option>
              <option value="tiktok">TikTok</option>
              <option value="youtube">YouTube</option>
            </select>
            <button
              type="submit"
              disabled={loading || !niche || disabled}
              className="rounded-md bg-[var(--color-brand)] px-6 py-3 font-bold text-black transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Scanne…" : "Scannen"}
            </button>
          </div>
          {loading && (
            <p className="text-xs text-zinc-500">
              Virale Videos werden geholt und analysiert. Das dauert ca. 30–90 Sekunden.
            </p>
          )}
          {error && <p className="text-sm text-red-400">{error}</p>}
        </form>
      </div>

      {/* Nischen-Analyse */}
      {analysis && (
        <div className="rounded-2xl border border-[var(--color-brand)]/40 bg-[var(--color-card)] p-8">
          <h2 className="mb-3 text-xl font-black uppercase tracking-tight text-[var(--color-brand)]">
            Was in „{run?.niche}" gerade zieht
          </h2>
          <p className="mb-6 text-zinc-300">{analysis.summary}</p>
          <div className="grid gap-6 sm:grid-cols-2">
            <AnalysisBlock title="Radar — zieht UND verkauft" items={analysis.radar} />
            <AnalysisBlock title="Hook — 3-Sekunden-Stopper" items={analysis.hooks} />
            <AnalysisBlock title="Verkauf — ohne Werbe-Sound" items={analysis.verkauf} />
            <AnalysisBlock title="Content-Lücken (Chancen)" items={analysis.content_gaps} />
            <div>
              <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-zinc-500">
                Dein nächster Schritt
              </h3>
              <p className="text-sm text-zinc-300">{analysis.recommendation}</p>
            </div>
          </div>
        </div>
      )}

      {/* Reel-Grid */}
      {reels.length > 0 && (
        <div>
          <h2 className="mb-1 text-xl font-bold">
            Die {reels.length} verkaufsstärksten Videos —{" "}
            <span className="text-zinc-500">{PLATFORM_LABELS[run!.platform]}</span>
          </h2>
          <p className="mb-4 text-sm text-zinc-500">
            Sortiert nach Verkaufspotenzial, nicht nach reiner Reichweite.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {reels.map((reel, i) => (
              <div
                key={reel.url + i}
                className="flex flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5"
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  {reel.sales_score != null ? (
                    <span
                      className="rounded-md bg-[var(--color-brand)] px-2 py-1 text-xs font-black uppercase tracking-wide text-black"
                      title="Verkaufspotenzial (Sales-Radar)"
                    >
                      Verkauf {reel.sales_score}/100
                    </span>
                  ) : (
                    <span />
                  )}
                  <span className="text-xs font-bold uppercase tracking-wide text-zinc-500">
                    {formatCount(reel.views)} Views
                  </span>
                </div>
                <div className="mb-3 flex items-center gap-3 text-xs uppercase tracking-wide text-zinc-500">
                  <span>{formatCount(reel.likes)} Likes</span>
                  <span>{formatCount(reel.comments)} Komm.</span>
                </div>
                {reel.author && (
                  <p className="mb-1 text-sm font-bold text-[var(--color-brand)]">{reel.author}</p>
                )}
                <p className="mb-3 line-clamp-3 text-sm text-zinc-300">
                  {reel.caption || "(keine Caption)"}
                </p>
                {reel.sales_angle && (
                  <p className="mb-4 flex-1 rounded-md border border-[var(--color-border)] bg-black/40 p-2 text-xs text-zinc-400">
                    <span className="font-bold text-zinc-300">Verkaufs-Winkel:</span> {reel.sales_angle}
                  </p>
                )}
                <div className="flex items-center gap-2">
                  <a
                    href={reel.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-md border border-[var(--color-border)] px-3 py-2 text-xs font-bold uppercase tracking-wide text-zinc-300 transition hover:border-[var(--color-brand)] hover:text-[var(--color-brand)]"
                  >
                    Original ↗
                  </a>
                  <button
                    onClick={() => onRepurpose(i)}
                    disabled={repurposing !== null || disabled}
                    className="flex-1 rounded-md bg-[var(--color-brand)] px-3 py-2 text-xs font-bold uppercase tracking-wide text-black transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {repurposing === i ? "Baue Skripte…" : "3 Skripte bauen →"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Letzte Scans */}
      {recentRuns.length > 0 && (
        <div>
          <h2 className="mb-4 text-xl font-bold">Letzte Scans</h2>
          <div className="flex flex-col divide-y divide-[var(--color-border)] rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)]">
            {recentRuns.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-4 px-5 py-3">
                <button
                  onClick={() => loadRun(r.id)}
                  className="flex-1 text-left transition hover:text-[var(--color-brand)]"
                >
                  <span className="font-bold">{r.niche}</span>
                  <span className="ml-3 text-xs uppercase tracking-wide text-zinc-500">
                    {PLATFORM_LABELS[r.platform]} · {r.status}
                  </span>
                </button>
                <button
                  onClick={() =>
                    startTransition(async () => {
                      await deleteRun(r.id);
                      router.refresh();
                    })
                  }
                  disabled={isPending}
                  className="text-xs uppercase tracking-wide text-zinc-600 transition hover:text-red-400 disabled:opacity-50"
                >
                  löschen
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AnalysisBlock({ title, items }: { title: string; items: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-zinc-500">{title}</h3>
      <ul className="flex flex-col gap-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2 text-sm text-zinc-300">
            <span className="text-[var(--color-brand)]">›</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
