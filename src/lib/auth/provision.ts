import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Zugangs-Provisionierung für Käufer/freigeschaltete User.
 *
 * Nutzt ausschließlich die in Supabase konfigurierten Auth-Mails (Resend-SMTP,
 * gebrandete Templates) — kein separater Mail-Versand nötig:
 *   - Kein Account vorhanden  → inviteUserByEmail: legt den User an UND schickt
 *     die „Setze dein Passwort"-Einladungsmail. Link führt auf /auth/set-password.
 *   - Account existiert schon  → Magic-Link-Login-Mail (signInWithOtp), KEIN
 *     Passwort-Reset, damit ein bestehendes Passwort unangetastet bleibt.
 */

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

function anonClient() {
  // Session-loser Client nur zum Auslösen der Magic-Link-Mail (setzt keine Cookies).
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

export type ProvisionResult = {
  userId: string | null; // user_id zum Verknüpfen der Lizenz (null bei Mail-Fehler)
  created: boolean; // true = neuer Account angelegt
  emailSent: boolean;
  note: string;
};

/**
 * Stellt sicher, dass es für `email` einen Account gibt, und schickt die passende
 * Zugangs-Mail. Liefert die user_id zurück, damit der Aufrufer die Lizenz setzen kann.
 */
export async function provisionAccessAndSendEmail(email: string): Promise<ProvisionResult> {
  const admin = createAdminClient();
  const normalized = email.trim().toLowerCase();

  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("email", normalized)
    .maybeSingle();

  if (profile) {
    const emailSent = await sendMagicLink(normalized);
    return { userId: profile.id, created: false, emailSent, note: "Bestehender Account – Login-Link gesendet." };
  }

  const { data, error } = await admin.auth.admin.inviteUserByEmail(normalized, {
    redirectTo: `${siteUrl()}/auth/set-password`,
  });

  if (!error && data?.user) {
    return { userId: data.user.id, created: true, emailSent: true, note: "Account angelegt + Passwort-Mail gesendet." };
  }

  // Invite kann scheitern, wenn der User in auth.users existiert, aber (noch) kein
  // profiles-Row hat → dann Magic-Link versuchen, damit der Kauf nicht ins Leere läuft.
  console.error("[provision] invite failed:", error?.message);
  const emailSent = await sendMagicLink(normalized);
  return { userId: null, created: false, emailSent, note: `Invite fehlgeschlagen (${error?.message ?? "unbekannt"}).` };
}

/**
 * Schickt nur die Zugangs-Mail (für „Mail erneut senden" / Admin-Freischalten von
 * bereits registrierten Usern). Wählt automatisch Invite vs. Magic-Link.
 */
export async function sendAccessEmail(email: string): Promise<boolean> {
  const admin = createAdminClient();
  const normalized = email.trim().toLowerCase();

  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("email", normalized)
    .maybeSingle();

  if (profile) {
    return sendMagicLink(normalized);
  }

  const { error } = await admin.auth.admin.inviteUserByEmail(normalized, {
    redirectTo: `${siteUrl()}/auth/set-password`,
  });
  if (error) {
    console.error("[provision] invite (resend) failed:", error.message);
    return sendMagicLink(normalized);
  }
  return true;
}

async function sendMagicLink(email: string): Promise<boolean> {
  const { error } = await anonClient().auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false, emailRedirectTo: `${siteUrl()}/dashboard` },
  });
  if (error) console.error("[provision] magic link failed:", error.message);
  return !error;
}
