import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });

  const { data, error } = await supabase
    .from("analyses")
    .select("id, video_url, status, transcript, scripts, error, created_at, updated_at")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  }
  return NextResponse.json(data);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });

  // Voiceover-Storage-Files vor dem DB-Delete aufräumen (Cascade leert nur DB).
  const { data: voiceovers } = await supabase
    .from("voiceovers")
    .select("storage_path")
    .eq("analysis_id", id);

  const paths = (voiceovers ?? [])
    .map((v) => v.storage_path as string | null)
    .filter((p): p is string => !!p);

  if (paths.length > 0) {
    const admin = createAdminClient();
    await admin.storage.from("voiceovers").remove(paths);
  }

  const { error } = await supabase.from("analyses").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
