import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAccessStatus } from "@/lib/auth/access";
import ViralResearchClient from "./viral-research-client";

export const metadata: Metadata = {
  title: "Viral-Research – skriptflip",
};

export default async function ViralResearchPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const access = await getAccessStatus(user.id);

  const { data: runs } = await supabase
    .from("viral_research_runs")
    .select("id, niche, platform, status, created_at")
    .order("created_at", { ascending: false })
    .limit(15);

  const ready = access.hasAllKeys && !access.blocked && access.license.isActive;

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="mb-2 text-balance text-4xl font-black uppercase tracking-tight">
            Viral-Research
          </h1>
          <p className="text-zinc-400">
            Finde die viralsten Videos deiner Nische — und mach 3 eigene Skripte draus.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="rounded-md border border-[var(--color-border)] px-4 py-2 text-sm font-bold uppercase tracking-wide text-zinc-300 transition hover:border-[var(--color-brand)] hover:text-[var(--color-brand)]"
        >
          ← Dashboard
        </Link>
      </div>

      {!ready && (
        <div className="mb-6 rounded-2xl border border-amber-700 bg-amber-900/10 p-6">
          <p className="mb-1 text-sm font-bold uppercase tracking-wide text-amber-400">
            Noch nicht startklar
          </p>
          <p className="mb-4 text-sm text-amber-100">
            {access.blocked
              ? "Dein Account ist gesperrt."
              : !access.license.isActive
                ? "Du brauchst eine aktive Lizenz, um Viral-Research zu nutzen."
                : "Trag zuerst deine OpenAI- und Anthropic-API-Keys in den Einstellungen ein."}
          </p>
          <Link
            href={access.license.isActive ? "/dashboard/settings" : "/angebot"}
            className="inline-block rounded-md bg-[var(--color-brand)] px-4 py-2 text-sm font-bold uppercase tracking-wide text-black transition hover:brightness-95"
          >
            {access.license.isActive ? "Zu den Einstellungen →" : "Lizenz sichern →"}
          </Link>
        </div>
      )}

      <ViralResearchClient disabled={!ready} recentRuns={runs ?? []} />
    </div>
  );
}
