import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import KeysForm from "./KeysForm";

export const metadata: Metadata = {
  title: "Einstellungen – skriptflip",
};

type ProviderRow = { provider: string; key_hint: string; updated_at: string };

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: rows } = await supabase
    .from("user_api_keys")
    .select("provider, key_hint, updated_at");

  const initial: Record<"openai" | "anthropic", { key_hint: string; updated_at: string } | null> = {
    openai: null,
    anthropic: null,
  };
  for (const r of (rows ?? []) as ProviderRow[]) {
    if (r.provider === "openai" || r.provider === "anthropic") {
      initial[r.provider] = { key_hint: r.key_hint, updated_at: r.updated_at };
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="mb-2 text-balance text-4xl font-black uppercase tracking-tight">
        Einstellungen
      </h1>
      <p className="mb-10 text-zinc-400">
        Trage hier deine eigenen API-Keys ein. Sie werden verschlüsselt gespeichert
        (AES-256-GCM) und nur zur Laufzeit für deine Pipelines entschlüsselt.
      </p>

      <KeysForm initial={initial} />

      <div className="mt-12 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 text-sm text-zinc-400">
        <p className="mb-2 font-bold text-white">Wo bekomme ich die Keys her?</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <span className="font-semibold text-zinc-200">OpenAI</span> (für Whisper-Transkription
            + TTS-Voiceover): <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="text-[var(--color-brand)] hover:underline">platform.openai.com/api-keys</a>
          </li>
          <li>
            <span className="font-semibold text-zinc-200">Anthropic</span> (für Skript- und Hook-Generierung
            mit Claude): <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer" className="text-[var(--color-brand)] hover:underline">console.anthropic.com/settings/keys</a>
          </li>
        </ul>
      </div>
    </div>
  );
}
