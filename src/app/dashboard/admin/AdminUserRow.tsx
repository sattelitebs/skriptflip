"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export type AdminUser = {
  id: string;
  email: string;
  role: "user" | "admin";
  blocked: boolean;
  created_at: string;
  last_activity_at: string | null;
  analyses_count: number;
  has_openai_key: boolean;
  has_anthropic_key: boolean;
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function AdminUserRow({ user, isSelf }: { user: AdminUser; isSelf: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function patch(payload: Partial<Pick<AdminUser, "blocked" | "role">>) {
    setError(null);
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Fehler");
      return;
    }
    startTransition(() => router.refresh());
  }

  return (
    <tr className="border-b border-[var(--color-border)] last:border-b-0 hover:bg-white/5">
      <td className="px-4 py-3">
        <div className="font-mono text-zinc-200">{user.email}</div>
        <div className="text-xs text-zinc-500">seit {formatDate(user.created_at)}</div>
        {error && <div className="mt-1 text-xs text-red-400">{error}</div>}
      </td>
      <td className="px-4 py-3">
        <span
          className={`rounded-md border px-2 py-1 text-xs font-bold uppercase tracking-wide ${
            user.role === "admin"
              ? "border-[var(--color-brand)] bg-[var(--color-brand)]/10 text-[var(--color-brand)]"
              : "border-[var(--color-border)] text-zinc-400"
          }`}
        >
          {user.role}
        </span>
      </td>
      <td className="px-4 py-3 text-xs">
        <div className="flex gap-1">
          <span
            className={`rounded px-2 py-0.5 ${
              user.has_openai_key ? "bg-emerald-900/30 text-emerald-400" : "bg-zinc-800 text-zinc-500"
            }`}
          >
            OpenAI
          </span>
          <span
            className={`rounded px-2 py-0.5 ${
              user.has_anthropic_key ? "bg-emerald-900/30 text-emerald-400" : "bg-zinc-800 text-zinc-500"
            }`}
          >
            Claude
          </span>
        </div>
      </td>
      <td className="px-4 py-3 text-zinc-300">{user.analyses_count}</td>
      <td className="px-4 py-3 text-zinc-400">{formatDate(user.last_activity_at)}</td>
      <td className="px-4 py-3">
        {user.blocked ? (
          <span className="rounded-md border border-red-700 bg-red-900/20 px-2 py-1 text-xs font-bold uppercase tracking-wide text-red-400">
            Gesperrt
          </span>
        ) : (
          <span className="rounded-md border border-emerald-700 bg-emerald-900/20 px-2 py-1 text-xs font-bold uppercase tracking-wide text-emerald-400">
            Aktiv
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        {isSelf ? (
          <span className="text-xs text-zinc-500">Du</span>
        ) : (
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => patch({ blocked: !user.blocked })}
              disabled={isPending}
              className="rounded-md border border-[var(--color-border)] px-3 py-1 text-xs font-bold uppercase tracking-wide text-zinc-200 transition hover:border-[var(--color-brand)] hover:text-[var(--color-brand)] disabled:opacity-50"
            >
              {user.blocked ? "Freischalten" : "Sperren"}
            </button>
            <button
              type="button"
              onClick={() => patch({ role: user.role === "admin" ? "user" : "admin" })}
              disabled={isPending}
              className="rounded-md border border-[var(--color-border)] px-3 py-1 text-xs font-bold uppercase tracking-wide text-zinc-200 transition hover:border-[var(--color-brand)] hover:text-[var(--color-brand)] disabled:opacity-50"
            >
              {user.role === "admin" ? "Admin entziehen" : "Admin geben"}
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}
