"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { checkHook, type CheckLevel } from "@/lib/hook/heuristic";

type Mode = "thema" | "umschreiben";
type Variant = { typ: string; hook: string };

const TYP_LABEL: Record<string, string> = {
  schmerz_zahl: "Schmerz / Zahl",
  frage: "Frage",
  panne: "Panne",
};

const AMPEL_STYLE: Record<string, { dot: string; text: string; label: string }> = {
  gruen: { dot: "bg-emerald-400", text: "text-emerald-400", label: "Stark" },
  gelb: { dot: "bg-[var(--color-brand)]", text: "text-[var(--color-brand)]", label: "Geht besser" },
  rot: { dot: "bg-red-400", text: "text-red-400", label: "Schwach" },
};

const LEVEL_DOT: Record<CheckLevel, string> = {
  gut: "bg-emerald-400",
  warnung: "bg-[var(--color-brand)]",
  problem: "bg-red-400",
};

export function HookTool() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<Mode>("umschreiben");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paywall, setPaywall] = useState(false);
  const [variants, setVariants] = useState<Variant[] | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [copied, setCopied] = useState<number | null>(null);

  const check = useMemo(() => (input.trim() ? checkHook(input) : null), [input]);

  async function handleRewrite() {
    setError(null);
    setPaywall(false);
    if (!input.trim()) {
      setError("Gib erst dein Thema oder deinen Hook ein.");
      return;
    }
    setLoading(true);
    setVariants(null);
    try {
      const res = await fetch("/api/hook/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, input: input.trim(), email: email.trim() }),
      });
      const data = await res.json();
      if (res.status === 402 && data.paywall) {
        setPaywall(true);
        setError(data.error ?? null);
        return;
      }
      if (!res.ok) {
        setError(data.error ?? "Etwas ist schiefgelaufen.");
        return;
      }
      setVariants(data.variants ?? []);
      setRemaining(typeof data.remaining === "number" ? data.remaining : null);
    } catch {
      setError("Verbindung fehlgeschlagen. Versuch es nochmal.");
    } finally {
      setLoading(false);
    }
  }

  async function copy(text: string, i: number) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(i);
      setTimeout(() => setCopied((c) => (c === i ? null : c)), 1500);
    } catch {
      /* Clipboard nicht verfügbar — ignorieren */
    }
  }

  const ampel = check ? AMPEL_STYLE[check.ampel] : null;

  return (
    <div className="mt-12 space-y-8">
      {/* Eingabe */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 sm:p-6">
        <div className="mb-3 flex flex-wrap gap-2">
          <ModeButton active={mode === "umschreiben"} onClick={() => setMode("umschreiben")}>
            Hook umschreiben
          </ModeButton>
          <ModeButton active={mode === "thema"} onClick={() => setMode("thema")}>
            Hook aus Thema
          </ModeButton>
        </div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={3}
          maxLength={400}
          placeholder={
            mode === "umschreiben"
              ? "Dein bestehender Hook…"
              : "Worum geht dein Video? (Thema in ein, zwei Sätzen)"
          }
          className="w-full resize-none rounded-xl border border-[var(--color-border)] bg-black px-4 py-3 text-lg text-zinc-100 placeholder:text-zinc-600 focus:border-[var(--color-brand)] focus:outline-none"
        />
        <div className="mt-1 text-right text-xs text-zinc-600">{input.length}/400</div>
      </div>

      {/* Live-Ampel (Heuristik, 0 Kosten) */}
      {check && ampel && (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={`h-3 w-3 rounded-full ${ampel.dot}`} />
              <span className={`text-sm font-bold uppercase tracking-widest ${ampel.text}`}>
                {ampel.label}
              </span>
            </div>
            <div className="text-2xl font-black tabular-nums">
              {check.score}
              <span className="text-sm font-bold text-zinc-600">/100</span>
            </div>
          </div>
          <ul className="mt-5 space-y-3">
            {check.signale.map((s, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${LEVEL_DOT[s.level]}`} />
                <span className="text-sm text-zinc-300">
                  <span className="font-bold text-zinc-100">{s.titel}:</span> {s.text}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-xs text-zinc-600">
            Schnell-Check nach den Regeln aus echten Reichweiten-Zahlen — kein Ersatz für den KI-Umbau.
          </p>
        </div>
      )}

      {/* KI-Umbau */}
      <div className="rounded-2xl border border-[var(--color-brand)]/30 bg-[var(--color-card)] p-5 sm:p-6">
        <h2 className="text-lg font-black uppercase tracking-tight">
          Hol dir 3 stärkere Varianten
        </h2>
        <p className="mt-1 text-sm text-zinc-400">
          Die KI baut deinen Hook um — Schmerz zuerst, kein Jargon, sofort klar.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="deine@email.de"
            className="flex-1 rounded-xl border border-[var(--color-border)] bg-black px-4 py-3 text-zinc-100 placeholder:text-zinc-600 focus:border-[var(--color-brand)] focus:outline-none"
          />
          <button
            onClick={handleRewrite}
            disabled={loading}
            className="rounded-xl bg-[var(--color-brand)] px-6 py-3 font-black uppercase tracking-wide text-black transition hover:bg-[var(--color-brand-hover)] disabled:opacity-60"
          >
            {loading ? "Baue um…" : "Umbauen"}
          </button>
        </div>
        {remaining !== null && !paywall && (
          <p className="mt-3 text-xs text-zinc-500">
            Noch {remaining} Gratis-{remaining === 1 ? "Umbau" : "Umbauten"} übrig.
          </p>
        )}
        {error && !paywall && <p className="mt-3 text-sm text-red-400">{error}</p>}

        {paywall && (
          <div className="mt-4 rounded-xl border border-[var(--color-brand)] bg-black p-5">
            <p className="text-sm text-zinc-200">{error}</p>
            <Link
              href="/angebot"
              className="mt-4 inline-block rounded-xl bg-[var(--color-brand)] px-6 py-3 font-black uppercase tracking-wide text-black transition hover:bg-[var(--color-brand-hover)]"
            >
              Vollzugang holen
            </Link>
          </div>
        )}
      </div>

      {/* Ergebnisse */}
      {variants && variants.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">
            Deine 3 Varianten
          </h3>
          {variants.map((v, i) => (
            <div
              key={i}
              className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="rounded-full bg-[var(--color-brand)]/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-[var(--color-brand)]">
                  {TYP_LABEL[v.typ] ?? v.typ}
                </span>
                <button
                  onClick={() => copy(v.hook, i)}
                  className="flex-shrink-0 text-xs font-bold uppercase tracking-wide text-zinc-500 transition hover:text-zinc-200"
                >
                  {copied === i ? "Kopiert" : "Kopieren"}
                </button>
              </div>
              <p className="mt-3 text-lg text-zinc-100">{v.hook}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-4 py-1.5 text-sm font-bold transition ${
        active
          ? "bg-[var(--color-brand)] text-black"
          : "border border-[var(--color-border)] text-zinc-400 hover:text-zinc-200"
      }`}
    >
      {children}
    </button>
  );
}
