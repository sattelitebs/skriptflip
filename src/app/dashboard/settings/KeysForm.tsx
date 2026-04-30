"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Provider = "openai" | "anthropic";

type SavedKey = { key_hint: string; updated_at: string } | null;

type Props = {
  initial: Record<Provider, SavedKey>;
};

const LABELS: Record<Provider, { title: string; placeholder: string; usedFor: string }> = {
  openai: {
    title: "OpenAI API-Key",
    placeholder: "sk-…",
    usedFor: "Wird genutzt für: Whisper-Transkription und TTS-Voiceover",
  },
  anthropic: {
    title: "Anthropic API-Key (Claude)",
    placeholder: "sk-ant-…",
    usedFor: "Wird genutzt für: Skript-, Repurpose- und Hook-Generierung",
  },
};

export default function KeysForm({ initial }: Props) {
  const [keys, setKeys] = useState(initial);

  return (
    <div className="space-y-6">
      <KeyRow provider="openai" saved={keys.openai} onSaved={(v) => setKeys((s) => ({ ...s, openai: v }))} />
      <KeyRow provider="anthropic" saved={keys.anthropic} onSaved={(v) => setKeys((s) => ({ ...s, anthropic: v }))} />
    </div>
  );
}

type RowProps = {
  provider: Provider;
  saved: SavedKey;
  onSaved: (v: SavedKey) => void;
};

function KeyRow({ provider, saved, onSaved }: RowProps) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState<"save" | "test" | "delete" | null>(null);
  const [feedback, setFeedback] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const meta = LABELS[provider];

  async function save() {
    setBusy("save");
    setFeedback(null);
    try {
      const res = await fetch("/api/settings/keys", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, api_key: value }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ kind: "error", text: data.error ?? "Speichern fehlgeschlagen" });
        return;
      }
      setValue("");
      onSaved({ key_hint: data.key_hint, updated_at: new Date().toISOString() });
      setFeedback({ kind: "ok", text: "Gespeichert." });
      router.refresh();
    } catch (err) {
      setFeedback({ kind: "error", text: err instanceof Error ? err.message : "Netzwerkfehler" });
    } finally {
      setBusy(null);
    }
  }

  async function test() {
    setBusy("test");
    setFeedback(null);
    try {
      const res = await fetch("/api/settings/keys/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, api_key: value || undefined }),
      });
      const data = await res.json();
      if (data.ok) {
        setFeedback({ kind: "ok", text: "Key funktioniert." });
      } else {
        setFeedback({ kind: "error", text: data.error ?? "Key abgelehnt" });
      }
    } catch (err) {
      setFeedback({ kind: "error", text: err instanceof Error ? err.message : "Netzwerkfehler" });
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    if (!confirm(`${meta.title} wirklich löschen?`)) return;
    setBusy("delete");
    setFeedback(null);
    try {
      const res = await fetch(`/api/settings/keys?provider=${provider}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ kind: "error", text: data.error ?? "Löschen fehlgeschlagen" });
        return;
      }
      onSaved(null);
      setFeedback({ kind: "ok", text: "Gelöscht." });
      router.refresh();
    } catch (err) {
      setFeedback({ kind: "error", text: err instanceof Error ? err.message : "Netzwerkfehler" });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold">{meta.title}</h2>
        {saved ? (
          <span className="rounded-md border border-emerald-700 bg-emerald-900/20 px-2 py-1 text-xs font-bold uppercase tracking-wide text-emerald-400">
            Hinterlegt · …{saved.key_hint}
          </span>
        ) : (
          <span className="rounded-md border border-amber-700 bg-amber-900/20 px-2 py-1 text-xs font-bold uppercase tracking-wide text-amber-400">
            Fehlt
          </span>
        )}
      </div>
      <p className="mb-4 text-xs text-zinc-500">{meta.usedFor}</p>

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="password"
          autoComplete="off"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={meta.placeholder}
          disabled={busy !== null}
          className="flex-1 rounded-md border border-[var(--color-border)] bg-black px-4 py-3 font-mono text-sm text-white placeholder:text-zinc-600 focus:border-[var(--color-brand)] focus:outline-none disabled:opacity-50"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={test}
            disabled={busy !== null || (!value && !saved)}
            className="rounded-md border border-[var(--color-border)] px-4 py-3 text-sm font-bold uppercase tracking-wide text-zinc-200 transition hover:border-[var(--color-brand)] hover:text-[var(--color-brand)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy === "test" ? "Teste…" : "Testen"}
          </button>
          <button
            type="button"
            onClick={save}
            disabled={busy !== null || value.length < 20}
            className="rounded-md bg-[var(--color-brand)] px-4 py-3 text-sm font-bold uppercase tracking-wide text-black transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy === "save" ? "Speichere…" : "Speichern"}
          </button>
        </div>
      </div>

      {saved && (
        <button
          type="button"
          onClick={remove}
          disabled={busy !== null}
          className="mt-3 text-xs text-zinc-500 underline-offset-2 hover:text-red-400 hover:underline disabled:opacity-50"
        >
          {busy === "delete" ? "Lösche…" : "Hinterlegten Key löschen"}
        </button>
      )}

      {feedback && (
        <p
          className={`mt-3 text-sm ${feedback.kind === "ok" ? "text-emerald-400" : "text-red-400"}`}
        >
          {feedback.text}
        </p>
      )}
    </div>
  );
}
