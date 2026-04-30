import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Löscht alle Analysen des aktuellen Users mit status='error'.
 * Voiceover-Files für Error-Zeilen existieren in der Regel nicht, daher kein
 * Storage-Cleanup nötig.
 */
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });

  const { error, count } = await supabase
    .from("analyses")
    .delete({ count: "exact" })
    .eq("user_id", user.id)
    .eq("status", "error");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, deleted: count ?? 0 });
}
