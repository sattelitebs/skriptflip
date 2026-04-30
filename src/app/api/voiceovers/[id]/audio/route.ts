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

  const { data: row, error } = await supabase
    .from("voiceovers")
    .select("storage_path")
    .eq("id", id)
    .single();
  if (error || !row?.storage_path) {
    return NextResponse.json({ error: "Voiceover nicht gefunden" }, { status: 404 });
  }

  const admin = createAdminClient();
  const { data: signed, error: signErr } = await admin.storage
    .from("voiceovers")
    .createSignedUrl(row.storage_path, 3600);
  if (signErr || !signed) {
    return NextResponse.json({ error: signErr?.message ?? "Signed-URL-Fehler" }, { status: 500 });
  }

  return NextResponse.redirect(signed.signedUrl, { status: 302 });
}
