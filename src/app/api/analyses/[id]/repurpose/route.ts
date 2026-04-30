import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { repurposeScript } from "@/lib/pipeline/repurpose";
import { getAccessStatus, gateError } from "@/lib/auth/access";
import { getUserApiKey } from "@/lib/crypto/user-keys";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: analysisId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });

  const access = await getAccessStatus(user.id);
  const gate = gateError(access);
  if (gate) return NextResponse.json({ error: gate }, { status: 403 });

  let body: { script_index?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültiger Body" }, { status: 400 });
  }
  const idx = body.script_index;
  if (idx !== 0 && idx !== 1 && idx !== 2) {
    return NextResponse.json({ error: "script_index muss 0, 1 oder 2 sein" }, { status: 400 });
  }

  const { data: analysis, error: loadErr } = await supabase
    .from("analyses")
    .select("id, scripts")
    .eq("id", analysisId)
    .single();
  if (loadErr || !analysis?.scripts?.scripts?.[idx]) {
    return NextResponse.json({ error: "Analyse oder Skript nicht gefunden" }, { status: 404 });
  }
  const source = analysis.scripts.scripts[idx] as { title: string; script: string };

  const { data: row, error: insertErr } = await supabase
    .from("repurposes")
    .insert({
      user_id: user.id,
      analysis_id: analysisId,
      source_script_index: idx,
      source_script_title: source.title,
      source_script_text: source.script,
      status: "generating",
    })
    .select("id")
    .single();
  if (insertErr || !row) {
    return NextResponse.json({ error: insertErr?.message ?? "DB-Fehler" }, { status: 500 });
  }

  try {
    const anthropicKey = await getUserApiKey(user.id, "anthropic");
    const formats = await repurposeScript(source.title, source.script, anthropicKey);
    await supabase
      .from("repurposes")
      .update({ status: "done", formats })
      .eq("id", row.id);
    return NextResponse.json({ id: row.id, formats });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unbekannter Fehler";
    await supabase
      .from("repurposes")
      .update({ status: "error", error: message })
      .eq("id", row.id);
    return NextResponse.json({ id: row.id, error: message }, { status: 500 });
  }
}
