import { createAdminClient } from "@/lib/supabase/admin";

export type AccessStatus = {
  hasOpenAI: boolean;
  hasAnthropic: boolean;
  hasAllKeys: boolean;
  blocked: boolean;
  isAdmin: boolean;
};

/**
 * Liefert Zugriffs-Status eines Users: welche Keys hinterlegt sind,
 * ob das Profil gesperrt ist und ob er Admin ist.
 */
export async function getAccessStatus(userId: string): Promise<AccessStatus> {
  const admin = createAdminClient();

  const [keysRes, profileRes] = await Promise.all([
    admin.from("user_api_keys").select("provider").eq("user_id", userId),
    admin.from("profiles").select("role, blocked").eq("id", userId).maybeSingle(),
  ]);

  const providers = new Set((keysRes.data ?? []).map((r) => r.provider as string));
  const hasOpenAI = providers.has("openai");
  const hasAnthropic = providers.has("anthropic");

  return {
    hasOpenAI,
    hasAnthropic,
    hasAllKeys: hasOpenAI && hasAnthropic,
    blocked: profileRes.data?.blocked === true,
    isAdmin: profileRes.data?.role === "admin",
  };
}

export function gateError(status: AccessStatus): string | null {
  if (status.blocked) {
    return "Dein Account ist aktuell gesperrt. Melde dich beim Support.";
  }
  if (!status.hasOpenAI && !status.hasAnthropic) {
    return "Bitte trage zuerst deine OpenAI- und Anthropic-API-Keys in den Einstellungen ein.";
  }
  if (!status.hasOpenAI) {
    return "Bitte trage zuerst deinen OpenAI-API-Key in den Einstellungen ein.";
  }
  if (!status.hasAnthropic) {
    return "Bitte trage zuerst deinen Anthropic-API-Key in den Einstellungen ein.";
  }
  return null;
}
