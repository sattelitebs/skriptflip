import { createHash } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

// Server-seitiger Gratis-Zähler. NIE im Browser — der Browser ist fälschbar.
export const FREE_PER_EMAIL = 3;
// Tages-Deckel: so viele verschiedene Trial-Mails pro IP in 24h. Bremst
// Wegwerf-Mail-Farming, ohne einen ehrlichen wiederkehrenden Nutzer zu blocken.
export const IP_PER_DAY = 8;

export type TrialStatus = {
  allowed: boolean;
  remaining: number; // verbleibende Gratis-Umbauten für diese E-Mail
  reason?: "email_limit" | "ip_limit";
};

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function hashIp(ip: string): string {
  const salt = process.env.API_KEY_ENCRYPTION_SECRET ?? "";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

const dayAgoIso = () => new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

/**
 * Prüft (ohne zu verbrauchen), ob diese E-Mail/IP noch einen Gratis-Umbau frei
 * hat. Reihenfolge der Sperren: E-Mail-Limit vor IP-Deckel.
 */
export async function peekTrial(email: string, ip: string): Promise<TrialStatus> {
  const admin = createAdminClient();
  const normEmail = normalizeEmail(email);
  const ipHash = hashIp(ip);

  const { data: row } = await admin
    .from("hookvana_usage")
    .select("free_used")
    .eq("email", normEmail)
    .maybeSingle();

  const used = row?.free_used ?? 0;
  if (used >= FREE_PER_EMAIL) {
    return { allowed: false, remaining: 0, reason: "email_limit" };
  }

  // IP-Deckel nur für NEUE E-Mails greifen lassen (bekannte E-Mail darf ihr
  // Restkontingent von derselben IP aufbrauchen).
  if (!row) {
    const { data: ipRows } = await admin
      .from("hookvana_usage")
      .select("email")
      .eq("ip_hash", ipHash)
      .gt("last_used", dayAgoIso());
    const distinctEmails = new Set((ipRows ?? []).map((r) => r.email as string));
    if (distinctEmails.size >= IP_PER_DAY) {
      return { allowed: false, remaining: FREE_PER_EMAIL, reason: "ip_limit" };
    }
  }

  return { allowed: true, remaining: FREE_PER_EMAIL - used };
}

/**
 * Verbucht einen Gratis-Umbau (nach erfolgreichem KI-Call). Legt die Zeile an
 * oder erhöht free_used. Gibt das verbleibende Kontingent zurück.
 */
export async function consumeTrial(email: string, ip: string): Promise<{ remaining: number }> {
  const admin = createAdminClient();
  const normEmail = normalizeEmail(email);
  const ipHash = hashIp(ip);
  const nowIso = new Date().toISOString();

  const { data: row } = await admin
    .from("hookvana_usage")
    .select("free_used")
    .eq("email", normEmail)
    .maybeSingle();

  const newUsed = (row?.free_used ?? 0) + 1;
  await admin.from("hookvana_usage").upsert(
    {
      email: normEmail,
      ip_hash: ipHash,
      free_used: newUsed,
      last_used: nowIso,
    },
    { onConflict: "email" },
  );

  return { remaining: Math.max(0, FREE_PER_EMAIL - newUsed) };
}
