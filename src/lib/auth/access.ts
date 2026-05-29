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
    admin.from("profiles").select("role, blocked, email").eq("id", userId).maybeSingle(),
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
  let license = computeLicense(licenseRes.data, isAdmin);

  // Funnel-Normalfall: gekauft VOR der Registrierung. Ohne aktive Lizenz prüfen,
  // ob ein geparkter Kauf (pending_licenses) auf die E-Mail wartet, und übernehmen.
  if (!license.isActive && !isAdmin && profileRes.data?.email) {
    const claimed = await claimPendingLicense(admin, userId, profileRes.data.email);
    if (claimed) license = computeLicense(claimed, false);
  }

  return {
    hasOpenAI,
    hasAnthropic,
    hasAllKeys: hasOpenAI && hasAnthropic,
    blocked: profileRes.data?.blocked === true,
    isAdmin,
    license,
  };
}

type PendingLicenseRow = {
  type: "lifetime" | "yearly";
  status: string;
  valid_until: string | null;
  digistore_order_id: string;
  digistore_product_id: string | null;
  last_event: string | null;
  last_event_at: string | null;
};

/**
 * Übernimmt einen geparkten Kauf (pending_licenses) in die echte licenses-Tabelle,
 * sobald der Käufer einen Account hat. Idempotent: markiert geparkte Einträge als
 * claimed, sodass derselbe Kauf nicht doppelt greift. Gibt die übernommene Lizenz
 * zurück oder null, wenn nichts Passendes wartet.
 */
async function claimPendingLicense(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  rawEmail: string,
): Promise<{ type: string; status: string; valid_until: string | null } | null> {
  const email = rawEmail.trim().toLowerCase();

  const { data: pendings } = await admin
    .from("pending_licenses")
    .select("type, status, valid_until, digistore_order_id, digistore_product_id, last_event, last_event_at")
    .eq("email", email)
    .eq("status", "active")
    .is("claimed_at", null);

  const rows = (pendings ?? []) as PendingLicenseRow[];
  if (rows.length === 0) return null;

  // Bester Kauf gewinnt: Lifetime vor Yearly, sonst der zuletzt eingegangene.
  const best = rows.sort((a, b) => {
    if (a.type !== b.type) return a.type === "lifetime" ? -1 : 1;
    return (b.last_event_at ?? "").localeCompare(a.last_event_at ?? "");
  })[0];

  const { error: upErr } = await admin.from("licenses").upsert(
    {
      user_id: userId,
      email,
      type: best.type,
      status: "active",
      valid_until: best.valid_until,
      digistore_order_id: best.digistore_order_id,
      digistore_product_id: best.digistore_product_id,
      last_event: best.last_event,
      last_event_at: best.last_event_at,
    },
    { onConflict: "user_id" },
  );
  if (upErr) return null; // Fail-safe: lieber kein Claim als kaputter Status

  // Alle wartenden Einträge dieser E-Mail als übernommen markieren.
  await admin
    .from("pending_licenses")
    .update({ claimed_at: new Date().toISOString() })
    .eq("email", email)
    .is("claimed_at", null);

  return { type: best.type, status: "active", valid_until: best.valid_until };
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
