/**
 * Einmaliges Bootstrap-Script: trägt die OpenAI- und Anthropic-Keys aus
 * .env.local für einen User in die user_api_keys-Tabelle ein.
 *
 * Aufruf: npx tsx scripts/seed-keys.ts <email>
 */
import { createClient } from "@supabase/supabase-js";
import { encryptApiKey, keyHint } from "../src/lib/crypto/keys";

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Aufruf: npx tsx scripts/seed-keys.ts <email>");
    process.exit(1);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (!url || !serviceRole || !openaiKey || !anthropicKey) {
    console.error("Fehlt: SUPABASE_URL, SERVICE_ROLE_KEY, OPENAI_API_KEY oder ANTHROPIC_API_KEY in .env.local");
    process.exit(1);
  }

  const admin = createClient(url, serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: profile, error: profileErr } = await admin
    .from("profiles")
    .select("id, email")
    .eq("email", email)
    .maybeSingle();

  if (profileErr) {
    console.error("Profil-Lookup fehlgeschlagen:", profileErr.message);
    process.exit(1);
  }
  if (!profile) {
    console.error(`Kein Profil mit Email "${email}" gefunden.`);
    process.exit(1);
  }

  console.log(`User gefunden: ${profile.email} (${profile.id})`);

  for (const [provider, plain] of [
    ["openai", openaiKey],
    ["anthropic", anthropicKey],
  ] as const) {
    const payload = encryptApiKey(plain);
    const hint = keyHint(plain);
    const { error } = await admin.from("user_api_keys").upsert(
      {
        user_id: profile.id,
        provider,
        encrypted_key: payload.encrypted_key,
        iv: payload.iv,
        auth_tag: payload.auth_tag,
        key_hint: hint,
      },
      { onConflict: "user_id,provider" },
    );
    if (error) {
      console.error(`Upsert ${provider} fehlgeschlagen:`, error.message);
      process.exit(1);
    }
    console.log(`✓ ${provider} eingetragen (…${hint})`);
  }

  console.log("Fertig.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
