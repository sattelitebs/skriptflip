"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AnalyzeForm({ disabled = false }: { disabled?: boolean }) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Etwas ist schiefgelaufen.");
        if (data.id) router.push(`/dashboard/analyses/${data.id}`);
        return;
      }
      router.push(`/dashboard/analyses/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Netzwerkfehler");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="url"
          required
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.tiktok.com/@user/video/..."
          disabled={loading || disabled}
          className="flex-1 rounded-md border border-[var(--color-border)] bg-black px-4 py-3 text-white placeholder:text-zinc-600 focus:border-[var(--color-brand)] focus:outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !url || disabled}
          className="rounded-md bg-[var(--color-brand)] px-6 py-3 font-bold text-black transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Analysiere…" : "Analysieren"}
        </button>
      </div>
      {loading && (
        <p className="text-xs text-zinc-500">
          Audio wird geladen, transkribiert und Skripte werden geschrieben. Dauert ca. 30–60 Sekunden.
        </p>
      )}
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
    </form>
  );
}
