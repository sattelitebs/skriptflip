import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { downloadAudio } from "@/lib/pipeline/download";
import { transcribeAudio } from "@/lib/pipeline/transcribe";
import { generateScripts } from "@/lib/pipeline/generate";
import { getAccessStatus, gateError } from "@/lib/auth/access";
import { getUserApiKey } from "@/lib/crypto/user-keys";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const URL_PATTERN = /^https?:\/\/(www\.|m\.)?(tiktok\.com|instagram\.com|youtube\.com|youtu\.be)\//i;

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });

  const access = await getAccessStatus(user.id);
  const gate = gateError(access);
  if (gate) return NextResponse.json({ error: gate }, { status: 403 });

  let body: { url?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültiger Request-Body" }, { status: 400 });
  }

  const url = body.url?.trim();
  if (!url || !URL_PATTERN.test(url)) {
    return NextResponse.json(
      { error: "Bitte einen Link von TikTok, Instagram oder YouTube einfügen." },
      { status: 400 },
    );
  }

  const [openaiKey, anthropicKey] = await Promise.all([
    getUserApiKey(user.id, "openai"),
    getUserApiKey(user.id, "anthropic"),
  ]);

  const { data: row, error: insertErr } = await supabase
    .from("analyses")
    .insert({ user_id: user.id, video_url: url, status: "downloading" })
    .select("id")
    .single();
  if (insertErr || !row) {
    return NextResponse.json({ error: insertErr?.message ?? "DB-Fehler" }, { status: 500 });
  }

  let cleanup: (() => Promise<void>) | null = null;
  try {
    const dl = await downloadAudio(url);
    cleanup = dl.cleanup;

    await supabase.from("analyses").update({ status: "transcribing" }).eq("id", row.id);
    const transcript = await transcribeAudio(dl.audioPath, openaiKey);

    await supabase
      .from("analyses")
      .update({ status: "generating", transcript })
      .eq("id", row.id);

    const scripts = await generateScripts(transcript, anthropicKey);

    await supabase
      .from("analyses")
      .update({ status: "done", scripts })
      .eq("id", row.id);

    return NextResponse.json({ id: row.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unbekannter Fehler";
    await supabase
      .from("analyses")
      .update({ status: "error", error: message })
      .eq("id", row.id);
    return NextResponse.json({ id: row.id, error: message }, { status: 500 });
  } finally {
    if (cleanup) await cleanup().catch(() => {});
  }
}
