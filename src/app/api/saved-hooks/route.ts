import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PATTERNS = ["frage", "schock", "versprechen", "zahl", "story", "andere"] as const;
type Pattern = (typeof PATTERNS)[number];

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });

  const { data, error } = await supabase
    .from("saved_hooks")
    .select("id, hook, pattern, notes, source_analysis_id, source_script_index, created_at")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ hooks: data });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });

  let body: {
    hook?: string;
    pattern?: string;
    notes?: string;
    source_analysis_id?: string;
    source_script_index?: number;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültiger Body" }, { status: 400 });
  }

  const hook = body.hook?.trim();
  if (!hook) return NextResponse.json({ error: "Hook fehlt" }, { status: 400 });
  const pattern: Pattern = PATTERNS.includes(body.pattern as Pattern)
    ? (body.pattern as Pattern)
    : "andere";

  const { data, error } = await supabase
    .from("saved_hooks")
    .insert({
      user_id: user.id,
      hook,
      pattern,
      notes: body.notes ?? null,
      source_analysis_id: body.source_analysis_id ?? null,
      source_script_index: body.source_script_index ?? null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "DB-Fehler" }, { status: 500 });
  }
  return NextResponse.json({ id: data.id });
}
