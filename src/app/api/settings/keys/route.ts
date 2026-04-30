import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { encryptApiKey, keyHint } from "@/lib/crypto/keys";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Provider = "openai" | "anthropic";

const PROVIDERS: Provider[] = ["openai", "anthropic"];

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });

  const { data, error } = await supabase
    .from("user_api_keys")
    .select("provider, key_hint, updated_at");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const byProvider: Record<Provider, { key_hint: string; updated_at: string } | null> = {
    openai: null,
    anthropic: null,
  };
  for (const row of (data ?? []) as { provider: string; key_hint: string; updated_at: string }[]) {
    if (row.provider === "openai" || row.provider === "anthropic") {
      byProvider[row.provider] = { key_hint: row.key_hint, updated_at: row.updated_at };
    }
  }
  return NextResponse.json({ keys: byProvider });
}

export async function PUT(request: Request) {
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
  const apiKey = body.api_key?.trim();

  if (!provider || !PROVIDERS.includes(provider)) {
    return NextResponse.json({ error: "provider muss 'openai' oder 'anthropic' sein" }, { status: 400 });
  }
  if (!apiKey || apiKey.length < 20) {
    return NextResponse.json({ error: "API-Key sieht zu kurz aus" }, { status: 400 });
  }

  const payload = encryptApiKey(apiKey);
  const hint = keyHint(apiKey);

  const { error } = await supabase
    .from("user_api_keys")
    .upsert(
      {
        user_id: user.id,
        provider,
        encrypted_key: payload.encrypted_key,
        iv: payload.iv,
        auth_tag: payload.auth_tag,
        key_hint: hint,
      },
      { onConflict: "user_id,provider" },
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, provider, key_hint: hint });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const provider = searchParams.get("provider") as Provider | null;
  if (!provider || !PROVIDERS.includes(provider)) {
    return NextResponse.json({ error: "provider muss 'openai' oder 'anthropic' sein" }, { status: 400 });
  }

  const { error } = await supabase
    .from("user_api_keys")
    .delete()
    .eq("user_id", user.id)
    .eq("provider", provider);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
