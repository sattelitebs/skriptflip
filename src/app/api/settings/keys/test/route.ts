import { NextResponse } from "next/server";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Provider = "openai" | "anthropic";

/**
 * Validiert einen API-Key gegen den Anbieter ohne ihn zu speichern.
 * Body kann entweder einen frisch eingegebenen Key enthalten oder leer sein —
 * dann wird der gespeicherte Key getestet.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });

  let body: { provider?: string; api_key?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültiger Body" }, { status: 400 });
  }

  const provider = body.provider as Provider | undefined;
  if (provider !== "openai" && provider !== "anthropic") {
    return NextResponse.json({ error: "provider muss 'openai' oder 'anthropic' sein" }, { status: 400 });
  }

  let apiKey = body.api_key?.trim();
  if (!apiKey) {
    const { getUserApiKey } = await import("@/lib/crypto/user-keys");
    try {
      apiKey = await getUserApiKey(user.id, provider);
    } catch (err) {
      return NextResponse.json(
        { ok: false, error: err instanceof Error ? err.message : "Kein Key" },
        { status: 400 },
      );
    }
  }

  try {
    if (provider === "openai") {
      const client = new OpenAI({ apiKey });
      await client.models.list();
    } else {
      const client = new Anthropic({ apiKey });
      await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 8,
        messages: [{ role: "user", content: "ping" }],
      });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unbekannter Fehler";
    return NextResponse.json({ ok: false, error: message }, { status: 200 });
  }
}
