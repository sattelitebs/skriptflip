import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { synthesizeSpeech, VOICES, type Voice } from "@/lib/pipeline/voiceover";
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

  let body: { script_index?: number; voice?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültiger Body" }, { status: 400 });
  }
  const idx = body.script_index;
  if (idx !== 0 && idx !== 1 && idx !== 2) {
    return NextResponse.json({ error: "script_index muss 0, 1 oder 2 sein" }, { status: 400 });
  }
  const voice: Voice = VOICES.includes(body.voice as Voice) ? (body.voice as Voice) : "nova";

  const { data: analysis, error: loadErr } = await supabase
    .from("analyses")
    .select("scripts")
    .eq("id", analysisId)
    .single();
  if (loadErr || !analysis?.scripts?.scripts?.[idx]) {
    return NextResponse.json({ error: "Skript nicht gefunden" }, { status: 404 });
  }
  const source = analysis.scripts.scripts[idx] as { script: string };

  const { data: row, error: insertErr } = await supabase
    .from("voiceovers")
    .insert({
      user_id: user.id,
      analysis_id: analysisId,
      source_script_index: idx,
      source_text: source.script,
      voice,
      status: "generating",
    })
    .select("id")
    .single();
  if (insertErr || !row) {
    return NextResponse.json({ error: insertErr?.message ?? "DB-Fehler" }, { status: 500 });
  }

  try {
    const openaiKey = await getUserApiKey(user.id, "openai");
    const mp3 = await synthesizeSpeech(source.script, voice, openaiKey);
    const storagePath = `${user.id}/${row.id}.mp3`;
    const admin = createAdminClient();
    const { error: uploadErr } = await admin.storage
      .from("voiceovers")
      .upload(storagePath, mp3, { contentType: "audio/mpeg", upsert: true });
    if (uploadErr) throw new Error(`Storage-Upload: ${uploadErr.message}`);

    await supabase
      .from("voiceovers")
      .update({ status: "done", storage_path: storagePath })
      .eq("id", row.id);

    return NextResponse.json({ id: row.id, voice });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unbekannter Fehler";
    await supabase
      .from("voiceovers")
      .update({ status: "error", error: message })
      .eq("id", row.id);
    return NextResponse.json({ id: row.id, error: message }, { status: 500 });
  }
}
