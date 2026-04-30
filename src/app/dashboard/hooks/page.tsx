import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import HooksList from "./HooksList";

export const metadata: Metadata = {
  title: "Hook-Bibliothek – skriptflip",
};

export default async function HooksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: hooks } = await supabase
    .from("saved_hooks")
    .select("id, hook, pattern, notes, source_analysis_id, source_script_index, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <Link
        href="/dashboard"
        className="mb-8 inline-block text-sm text-zinc-400 transition hover:text-white"
      >
        ← Zurück zum Dashboard
      </Link>

      <h1 className="mb-2 text-balance text-4xl font-black uppercase tracking-tight">
        Hook-Bibliothek
      </h1>
      <p className="mb-12 text-zinc-400">
        Deine gespeicherten Hooks – sortiert nach Pattern. Filtere und kopiere mit einem Klick.
      </p>

      <HooksList initial={hooks ?? []} />
    </div>
  );
}
