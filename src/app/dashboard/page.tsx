import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAccessStatus } from "@/lib/auth/access";
import AnalyzeForm from "./AnalyzeForm";
import AnalysisList from "./AnalysisList";

export const metadata: Metadata = {
  title: "Dashboard – skriptflip",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const access = await getAccessStatus(user.id);

  const { data: analyses } = await supabase
    .from("analyses")
    .select("id, video_url, status, created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="mb-2 text-balance text-4xl font-black uppercase tracking-tight">
            Dashboard
          </h1>
          <p className="text-zinc-400">Eingeloggt als {user.email}</p>
        </div>
        <div className="flex gap-3">
          {access.isAdmin && (
            <Link
              href="/dashboard/admin"
              className="rounded-md border border-[var(--color-border)] px-4 py-2 text-sm font-bold uppercase tracking-wide text-zinc-300 transition hover:border-[var(--color-brand)] hover:text-[var(--color-brand)]"
            >
              Admin →
            </Link>
          )}
          <Link
            href="/dashboard/settings"
            className="rounded-md border border-[var(--color-border)] px-4 py-2 text-sm font-bold uppercase tracking-wide text-zinc-300 transition hover:border-[var(--color-brand)] hover:text-[var(--color-brand)]"
          >
            Einstellungen
          </Link>
          <Link
            href="/dashboard/hooks"
            className="rounded-md border border-[var(--color-border)] px-4 py-2 text-sm font-bold uppercase tracking-wide text-zinc-300 transition hover:border-[var(--color-brand)] hover:text-[var(--color-brand)]"
          >
            Hook-Bibliothek →
          </Link>
        </div>
      </div>

      {access.blocked && (
        <div className="mb-6 rounded-2xl border border-red-700 bg-red-900/20 p-6">
          <p className="mb-1 text-sm font-bold uppercase tracking-wide text-red-400">
            Account gesperrt
          </p>
          <p className="text-sm text-red-200">
            Dein Account ist aktuell gesperrt. Melde dich beim Support, um ihn freizuschalten.
          </p>
        </div>
      )}

      {!access.blocked && !access.isAdmin && !access.license.isActive && (
        <div className="mb-6 rounded-2xl border border-orange-700 bg-orange-900/10 p-6">
          <p className="mb-1 text-sm font-bold uppercase tracking-wide text-orange-400">
            {licenseBannerHeadline(access.license.status)}
          </p>
          <p className="mb-4 text-sm text-orange-100">
            {licenseBannerBody(access.license.status)}
          </p>
          <a
            href="https://skriptflip.com#preise"
            className="inline-block rounded-md bg-[var(--color-brand)] px-4 py-2 text-sm font-bold uppercase tracking-wide text-black transition hover:brightness-95"
          >
            Lifetime sichern →
          </a>
        </div>
      )}

      {!access.blocked && access.license.isActive && !access.isAdmin && access.license.type && (
        <div className="mb-6 rounded-2xl border border-emerald-700/50 bg-emerald-900/10 p-4">
          <p className="text-sm text-emerald-200">
            <span className="font-bold uppercase tracking-wide text-emerald-400">
              {access.license.type === "lifetime" ? "Lifetime aktiv" : "Jahresabo aktiv"}
            </span>
            {access.license.type === "yearly" && access.license.validUntil && (
              <span className="ml-2 text-emerald-300/80">
                läuft bis {formatDate(access.license.validUntil)}
              </span>
            )}
          </p>
        </div>
      )}

      {!access.blocked && access.license.isActive && !access.hasAllKeys && (
        <div className="mb-6 rounded-2xl border border-amber-700 bg-amber-900/10 p-6">
          <p className="mb-1 text-sm font-bold uppercase tracking-wide text-amber-400">
            Setup unvollständig
          </p>
          <p className="mb-4 text-sm text-amber-100">
            Trage zuerst deine eigenen API-Keys ein, dann kannst du Skripte generieren.
            {!access.hasOpenAI && " OpenAI-Key fehlt."}
            {!access.hasAnthropic && " Anthropic-Key fehlt."}
          </p>
          <Link
            href="/dashboard/settings"
            className="inline-block rounded-md bg-[var(--color-brand)] px-4 py-2 text-sm font-bold uppercase tracking-wide text-black transition hover:brightness-95"
          >
            Jetzt Keys eintragen →
          </Link>
        </div>
      )}

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-8">
        <h2 className="mb-2 text-xl font-bold">Neues virales Skript analysieren</h2>
        <p className="mb-6 text-sm text-zinc-400">
          Füge einen TikTok-, Instagram- oder YouTube-Link ein. Die KI legt los und liefert
          dir Transkript, Hook-Analyse und 3 eigene Skript-Versionen.
        </p>
        <AnalyzeForm
          disabled={!access.hasAllKeys || access.blocked || !access.license.isActive}
        />
      </div>

      <div className="mt-10">
        <h2 className="mb-4 text-xl font-bold">Deine Analysen</h2>
        <AnalysisList items={analyses ?? []} />
      </div>
    </div>
  );
}

function licenseBannerHeadline(status: string | null): string {
  if (status === "expired" || status === "cancelled") return "Lizenz abgelaufen";
  if (status === "refunded") return "Lizenz rückerstattet";
  return "Noch keine Lizenz";
}

function licenseBannerBody(status: string | null): string {
  if (status === "expired" || status === "cancelled") {
    return "Deine Lizenz ist nicht mehr aktiv. Verlängere oder buche neu, um wieder zu generieren.";
  }
  if (status === "refunded") {
    return "Deine Lizenz wurde rückerstattet. Du kannst aktuell nicht generieren.";
  }
  return "Hol dir deine Lifetime- oder Jahres-Lizenz, dann kannst du sofort loslegen.";
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
