import { createAdminClient } from "@/lib/supabase/admin";

export type LicenseInfo = {
  type: "lifetime" | "yearly" | null;
  status: "active" | "cancelled" | "expired" | "refunded" | null;
  validUntil: string | null;     // ISO oder null (= unbefristet, falls type=lifetime)
  isActive: boolean;             // status='active' UND (lifetime ODER validUntil>now)
};

export type AccessStatus = {
  hasOpenAI: boolean;
  hasAnthropic: boolean;
  hasAllKeys: boolean;
  blocked: boolean;
  isAdmin: boolean;
  license: LicenseInfo;
};

/**
 * Liefert Zugriffs-Status eines Users: Keys, Profil-Status, Rolle, Lizenz.
 * Admins gelten immer als lizenziert (license.isActive = true).
 */
export async function getAccessStatus(userId: string): Promise<AccessStatus> {
  const admin = createAdminClient();

  const [keysRes, profileRes, licenseRes] = await Promise.all([
    admin.from("user_api_keys").select("provider").eq("user_id", userId),
    admin.from("profiles").select("role, blocked").eq("id", userId).maybeSingle(),
    admin
      .from("licenses")
      .select("type, status, valid_until")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  const providers = new Set((keysRes.data ?? []).map((r) => r.provider as string));
  const hasOpenAI = providers.has("openai");
  const hasAnthropic = providers.has("anthropic");

  const isAdmin = profileRes.data?.role === "admin";
  const license = computeLicense(licenseRes.data, isAdmin);

  return {
    hasOpenAI,
    hasAnthropic,
    hasAllKeys: hasOpenAI && hasAnthropic,
    blocked: profileRes.data?.blocked === true,
    isAdmin,
    license,
  };
}

function computeLicense(
  row: { type: string | null; status: string | null; valid_until: string | null } | null,
  isAdmin: boolean,
): LicenseInfo {
  if (isAdmin) {
    return { type: null, status: null, validUntil: null, isActive: true };
  }
  if (!row || !row.type || !row.status) {
    return { type: null, status: null, validUntil: null, isActive: false };
  }
  const stillValid =
    row.valid_until === null || new Date(row.valid_until).getTime() > Date.now();
  return {
    type: row.type as LicenseInfo["type"],
    status: row.status as LicenseInfo["status"],
    validUntil: row.valid_until,
    isActive: row.status === "active" && stillValid,
  };
}

/**
 * Liefert Fehler-Text für gesperrte Pipeline-Aufrufe.
 * Reihenfolge: blocked > license > keys.
 */
export function gateError(status: AccessStatus): string | null {
  if (status.blocked) {
    return "Dein Account ist aktuell gesperrt. Melde dich beim Support.";
  }
  if (!status.license.isActive) {
    if (status.license.status === "expired" || status.license.status === "cancelled") {
      return "Deine Lizenz ist nicht mehr aktiv. Verlängere oder buche neu, um weiterzumachen.";
    }
    if (status.license.status === "refunded") {
      return "Deine Lizenz wurde rückerstattet. Du kannst aktuell nicht generieren.";
    }
    return "Du hast noch keine aktive Lizenz. Hol dir Zugang über skriptflip.com, dann kannst du loslegen.";
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
