"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Bitte ein Passwort mit mindestens 8 Zeichen wählen.");
      return;
    }
    if (password !== confirm) {
      setError("Die beiden Passwörter stimmen nicht überein.");
      return;
    }
    setLoading(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError(
        "Dein Link ist abgelaufen oder ungültig. Melde dich an oder fordere einen neuen Link an.",
      );
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-12rem)] max-w-md flex-col justify-center px-6 py-16">
      <div className="mb-10 text-center">
        <h1 className="text-balance text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">
          Passwort festlegen
        </h1>
        <p className="mt-3 text-zinc-400">
          Vergib dein Passwort — danach bist du startklar und dein Zugang ist freigeschaltet.
        </p>
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-8">
        {error && (
          <div className="mb-6 rounded-md border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}
        <form onSubmit={onSubmit} className="space-y-5">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-zinc-300">Neues Passwort</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              required
              minLength={8}
              className="w-full rounded-md border border-[var(--color-border)] bg-black px-4 py-3 text-white placeholder:text-zinc-600 focus:border-[var(--color-brand)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand)]"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-zinc-300">Passwort wiederholen</span>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              required
              minLength={8}
              className="w-full rounded-md border border-[var(--color-border)] bg-black px-4 py-3 text-white placeholder:text-zinc-600 focus:border-[var(--color-brand)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand)]"
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-[var(--color-brand)] px-6 py-3 font-bold text-black transition hover:bg-[var(--color-brand-hover)] disabled:opacity-50"
          >
            {loading ? "Speichern…" : "Passwort speichern & loslegen"}
          </button>
        </form>
      </div>
    </div>
  );
}
