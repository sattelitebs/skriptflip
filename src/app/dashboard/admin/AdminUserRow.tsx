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
  license_type: "lifetime" | "yearly" | null;
  license_status: "active" | "cancelled" | "expired" | "refunded" | null;
  license_valid_until: string | null;
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

type PatchPayload = {
  blocked?: boolean;
  role?: "user" | "admin";
  license?: { action: "grant" | "revoke"; type?: "lifetime" | "yearly" };
  resendEmail?: boolean;
};

export default function AdminUserRow({ user, isSelf }: { user: AdminUser; isSelf: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [grantType, setGrantType] = useState<"lifetime" | "yearly">("lifetime");

  const licenseActive =
    user.license_status === "active" &&
    (user.license_valid_until === null ||
      new Date(user.license_valid_until).getTime() > Date.now());

  async function patch(payload: PatchPayload, successNote?: string) {
    setError(null);
    setNotice(null);
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
    if (successNote) setNotice(successNote);
    startTransition(() => router.refresh());
  }

  return (
    <tr className="border-b border-[var(--color-border)] last:border-b-0 hover:bg-white/5">
      <td className="px-4 py-3">
        <div className="font-mono text-zinc-200">{user.email}</div>
        <div className="text-xs text-zinc-500">seit {formatDate(user.created_at)}</div>
        {error && <div className="mt-1 text-xs text-red-400">{error}</div>}
        {notice && <div className="mt-1 text-xs text-emerald-400">{notice}</div>}
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
      <td className="px-4 py-3">
        <LicenseBadge user={user} />
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
          <div className="flex flex-col items-end gap-2">
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => patch({ blocked: !user.blocked })}
                disabled={isPending}
                className="rounded-md border border-[var(--color-border)] px-3 py-1 text-xs font-bold uppercase tracking-wide text-zinc-200 transition hover:border-[var(--color-brand)] hover:text-[var(--color-brand)] disabled:opacity-50"
              >
                {user.blocked ? "Entsperren" : "Sperren"}
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

            {/* Lizenz / Zugang */}
            <div className="flex items-center justify-end gap-2">
              {licenseActive ? (
                <>
                  <button
                    type="button"
                    onClick={() => patch({ resendEmail: true }, "Zugangs-Mail gesendet.")}
                    disabled={isPending}
                    className="rounded-md border border-[var(--color-border)] px-3 py-1 text-xs font-bold uppercase tracking-wide text-zinc-200 transition hover:border-[var(--color-brand)] hover:text-[var(--color-brand)] disabled:opacity-50"
                  >
                    Mail erneut
                  </button>
                  <button
                    type="button"
                    onClick={() => patch({ license: { action: "revoke" } })}
                    disabled={isPending}
                    className="rounded-md border border-red-800 px-3 py-1 text-xs font-bold uppercase tracking-wide text-red-300 transition hover:border-red-500 hover:text-red-200 disabled:opacity-50"
                  >
                    Lizenz entziehen
                  </button>
                </>
              ) : (
                <>
                  <select
                    value={grantType}
                    onChange={(e) => setGrantType(e.target.value as "lifetime" | "yearly")}
                    disabled={isPending}
                    className="rounded-md border border-[var(--color-border)] bg-black px-2 py-1 text-xs text-zinc-200 focus:border-[var(--color-brand)] focus:outline-none disabled:opacity-50"
                  >
                    <option value="lifetime">Lifetime</option>
                    <option value="yearly">Jahr</option>
                  </select>
                  <button
                    type="button"
                    onClick={() =>
                      patch(
                        { license: { action: "grant", type: grantType } },
                        "Zugang vergeben + Mail gesendet.",
                      )
                    }
                    disabled={isPending}
                    className="rounded-md border border-[var(--color-brand)] bg-[var(--color-brand)]/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-[var(--color-brand)] transition hover:bg-[var(--color-brand)]/20 disabled:opacity-50"
                  >
                    Zugang geben
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </td>
    </tr>
  );
}

function LicenseBadge({ user }: { user: AdminUser }) {
  if (!user.license_type) {
    return (
      <span className="rounded-md border border-[var(--color-border)] px-2 py-1 text-xs text-zinc-500">
        keine
      </span>
    );
  }
  const isActive =
    user.license_status === "active" &&
    (user.license_valid_until === null ||
      new Date(user.license_valid_until).getTime() > Date.now());

  const tone = isActive
    ? "border-emerald-700 bg-emerald-900/20 text-emerald-400"
    : "border-orange-700 bg-orange-900/20 text-orange-400";

  const label = user.license_type === "lifetime" ? "Lifetime" : "Jahresabo";
  const subline =
    user.license_type === "yearly" && user.license_valid_until
      ? `bis ${formatDate(user.license_valid_until)}`
      : isActive
        ? "unbefristet"
        : (user.license_status ?? "");

  return (
    <div className={`inline-flex flex-col rounded-md border px-2 py-1 ${tone}`}>
      <span className="text-xs font-bold uppercase tracking-wide">{label}</span>
      <span className="text-[10px] opacity-80">{subline}</span>
    </div>
  );
}
