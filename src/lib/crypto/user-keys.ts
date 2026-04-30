import { createAdminClient } from "@/lib/supabase/admin";
import { decryptApiKey, type EncryptedPayload } from "@/lib/crypto/keys";

export type Provider = "openai" | "anthropic";

/**
 * Lädt den entschlüsselten API-Key eines Users für einen Provider.
 * Wirft, wenn kein Key hinterlegt ist.
 */
export async function getUserApiKey(userId: string, provider: Provider): Promise<string> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("user_api_keys")
    .select("encrypted_key, iv, auth_tag")
    .eq("user_id", userId)
    .eq("provider", provider)
    .maybeSingle();

  if (error) throw new Error(`Key-Lookup fehlgeschlagen: ${error.message}`);
  if (!data) {
    throw new Error(
      provider === "openai"
        ? "Kein OpenAI-Key hinterlegt. Trage ihn in den Einstellungen ein."
        : "Kein Anthropic-Key hinterlegt. Trage ihn in den Einstellungen ein.",
    );
  }

  return decryptApiKey(data as EncryptedPayload);
}
