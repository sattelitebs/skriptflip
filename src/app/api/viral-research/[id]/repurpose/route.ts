import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAccessStatus, gateError } from "@/lib/auth/access";
import { getUserApiKey } from "@/lib/crypto/user-keys";
import { runViralReelRepurpose } from "@/lib/pipeline/viral-reel-repurpose";
import type { ReelHit } from "@/lib/pipeline/apify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: runId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });

  const access = await getAccessStatus(user.id);
  const gate = gateError(access);
  if (gate) return NextResponse.json({ error: gate }, { status: 403 });

  let body: { reel_index?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültiger Body" }, { status: 400 });
  }
  const idx = body.reel_index;
  if (typeof idx !== "number" || idx < 0) {
    return NextResponse.json({ error: "reel_index fehlt oder ist ungültig" }, { status: 400 });
  }

  const { data: run, error: loadErr } = await supabase
    .from("viral_research_runs")
    .select("id, niche, reels")
    .eq("id", runId)
    .single();
  if (loadErr || !run) {
    return NextResponse.json({ error: "Run nicht gefunden" }, { status: 404 });
  }
  const reels = (run.reels ?? []) as ReelHit[];
  const reel = reels[idx];
  if (!reel) {
    return NextResponse.json({ error: "Reel nicht gefunden" }, { status: 404 });
  }

  const [openaiKey, anthropicKey] = await Promise.all([
    getUserApiKey(user.id, "openai"),
    getUserApiKey(user.id, "anthropic"),
  ]);

  try {
    const analysisId = await runViralReelRepurpose({
      supabase,
      userId: user.id,
      reelUrl: reel.url,
      niche: run.niche as string,
      meta: { caption: reel.caption, views: reel.views, likes: reel.likes },
      openaiKey,
      anthropicKey,
      salesAngle: reel.sales_angle ?? null,
    });
    return NextResponse.json({ analysis_id: analysisId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unbekannter Fehler";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
