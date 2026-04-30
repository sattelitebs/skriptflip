import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateHookVariants } from "@/lib/pipeline/hook-variants";
import { getAccessStatus, gateError } from "@/lib/auth/access";
import { getUserApiKey } from "@/lib/crypto/user-keys";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

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
    .select("scripts")
    .eq("id", analysisId)
    .single();
  if (loadErr || !analysis?.scripts?.scripts?.[idx]) {
    return NextResponse.json({ error: "Skript nicht gefunden" }, { status: 404 });
  }
  const source = analysis.scripts.scripts[idx] as { title: string; script: string };

  try {
    const anthropicKey = await getUserApiKey(user.id, "anthropic");
    const variants = await generateHookVariants(source.title, source.script, anthropicKey);
    return NextResponse.json({ variants });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unbekannter Fehler" },
      { status: 500 },
    );
  }
}
