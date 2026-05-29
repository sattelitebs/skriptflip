import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAccessStatus, gateError } from "@/lib/auth/access";
import { getUserApiKey } from "@/lib/crypto/user-keys";
import { runViralResearchScan } from "@/lib/pipeline/viral-research-scan";
import type { Platform } from "@/lib/pipeline/apify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const PLATFORMS: Platform[] = ["instagram", "tiktok", "youtube"];

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });

  const access = await getAccessStatus(user.id);
  const gate = gateError(access);
  if (gate) return NextResponse.json({ error: gate }, { status: 403 });

  let body: { niche?: string; platform?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültiger Request-Body" }, { status: 400 });
  }

  const niche = body.niche?.trim();
  const platform = (body.platform ?? "instagram") as Platform;
  if (!niche || niche.length < 2) {
    return NextResponse.json({ error: "Bitte gib eine Nische oder ein Keyword ein." }, { status: 400 });
  }
  if (!PLATFORMS.includes(platform)) {
    return NextResponse.json({ error: "Unbekannte Plattform." }, { status: 400 });
  }

  const anthropicKey = await getUserApiKey(user.id, "anthropic");

  const { data: row, error: insertErr } = await supabase
    .from("viral_research_runs")
    .insert({ user_id: user.id, niche, platform, status: "pending" })
    .select("id")
    .single();
  if (insertErr || !row) {
    return NextResponse.json({ error: insertErr?.message ?? "DB-Fehler" }, { status: 500 });
  }

  try {
    await runViralResearchScan({ supabase, runId: row.id, niche, platform, anthropicKey });
    return NextResponse.json({ id: row.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unbekannter Fehler";
    return NextResponse.json({ id: row.id, error: message }, { status: 500 });
  }
}
