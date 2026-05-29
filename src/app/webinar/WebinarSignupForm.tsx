"use client";

import { useState } from "react";

export default function WebinarSignupForm() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/webinar/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Etwas ist schiefgelaufen.");
        return;
      }
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Netzwerkfehler");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border-2 border-[var(--color-brand)] bg-[var(--color-card)] p-8 text-center">
        <p className="mb-2 text-xl font-black uppercase tracking-tight text-[var(--color-brand)]">
          Platz gesichert.
        </p>
        <p className="text-zinc-300">
          Check deine E-Mails — den Zugangslink zum Live-Webinar schicken wir dir dorthin.
          Schau auch im Spam nach, falls nichts ankommt.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 sm:p-8"
    >
      <div className="flex flex-col gap-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Dein Vorname"
          disabled={loading}
          className="rounded-md border border-[var(--color-border)] bg-black px-4 py-3 text-white placeholder:text-zinc-600 focus:border-[var(--color-brand)] focus:outline-none disabled:opacity-50"
        />
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Deine beste E-Mail-Adresse"
          disabled={loading}
          className="rounded-md border border-[var(--color-border)] bg-black px-4 py-3 text-white placeholder:text-zinc-600 focus:border-[var(--color-brand)] focus:outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !email}
          className="rounded-full bg-[var(--color-brand)] px-8 py-4 text-base font-bold text-black transition hover:bg-[var(--color-brand-hover)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Sichere Platz…" : "Kostenlos Platz sichern →"}
        </button>
      </div>
      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
      <p className="mt-3 text-center text-xs text-zinc-500">
        100 % kostenlos. Kein Verkaufsgespräch. Jederzeit abmeldbar.
      </p>
    </form>
  );
}
