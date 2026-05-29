import { createAdminClient } from "@/lib/supabase/admin";
import { licenseTypeFor, type LicenseType } from "@/lib/digistore/products";

export type DigistoreEvent =
  | "Connection-Test"
  | "on_payment"
  | "on_rebill"
  | "on_payment_missed"
  | "on_refund"
  | "on_chargeback"
  | "on_revoke"
  | string;

type HandlerOutcome = {
  processed: boolean;
  message: string;
};

/**
 * Verarbeitet einen verifizierten Digistore-IPN-Call und legt/aktualisiert
 * die Lizenz an.
 *
 * Typ-Zuordnung (src/lib/digistore/products.ts): explizite Produkt-ID-Map gewinnt,
 * Fallback ist Digistores billing_type (subscription → yearly, sonst lifetime).
 * yearly bekommt valid_until = now + 1 Jahr, lifetime bleibt unbefristet (NULL).
 *
 * Hat der Käufer schon einen Account (profiles-Treffer per E-Mail), landet die
 * Lizenz direkt in `public.licenses`. Andernfalls (Kauf vor Registrierung — der
 * Funnel-Normalfall) wird sie in `public.pending_licenses` geparkt und beim ersten
 * eingeloggten Seitenaufruf übernommen (siehe claimPendingLicense in access.ts).
 */
export async function handleDigistoreEvent(
  params: Record<string, string>,
): Promise<HandlerOutcome> {
  const event = params.event as DigistoreEvent;
  const orderId = params.order_id ?? null;
  const productId = params.product_id ?? null;
  const buyerEmail = (params.email ?? params.address_email ?? "")
    .trim()
    .toLowerCase();

  if (event === "Connection-Test") {
    return { processed: true, message: "Connection-Test akzeptiert." };
  }

  if (!buyerEmail) {
    return { processed: false, message: "Kein Buyer-Email im Webhook." };
  }
  if (!orderId) {
    return { processed: false, message: "Keine order_id im Webhook." };
  }

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("id, email")
    .eq("email", buyerEmail)
    .maybeSingle();

  // Produkt-ID-Zuordnung gewinnt, Fallback ist Digistores billing_type.
  const billingType = params.order_billing_type ?? params.billing_type ?? "";
  const licenseType = licenseTypeFor(productId, billingType);
  const now = new Date().toISOString();

  switch (event) {
    case "on_payment":
    case "on_rebill": {
      // on_rebill betrifft nur Abos → immer yearly.
      const type: LicenseType = event === "on_rebill" ? "yearly" : licenseType;
      const validUntil = type === "yearly" ? oneYearFromNow() : null;
      const base = {
        email: buyerEmail,
        type,
        status: "active" as const,
        valid_until: validUntil,
        digistore_order_id: orderId,
        digistore_product_id: productId,
        last_event: event,
        last_event_at: now,
      };

      if (profile) {
        await upsertLicense(admin, { ...base, user_id: profile.id });
        return {
          processed: true,
          message: event === "on_rebill" ? "Jahresabo verlängert." : `Lizenz (${type}) aktiviert.`,
        };
      }

      // Noch kein Account → Entitlement parken, wird beim ersten Login übernommen.
      await upsertPending(admin, base);
      return {
        processed: true,
        message: `Kauf (${type}) geparkt — wird bei Registrierung von ${buyerEmail} übernommen.`,
      };
    }

    case "on_refund":
    case "on_chargeback":
      await setStatusByOrder(admin, orderId, "refunded", event, now);
      return { processed: true, message: "Lizenz auf 'refunded' gesetzt." };

    case "on_revoke":
    case "on_payment_missed":
      await setStatusByOrder(admin, orderId, "cancelled", event, now);
      return { processed: true, message: "Lizenz auf 'cancelled' gesetzt." };

    default:
      return { processed: false, message: `Event '${event}' wird nicht behandelt.` };
  }
}

type LicenseRow = {
  user_id: string;
  email: string;
  type: "lifetime" | "yearly";
  status: "active" | "cancelled" | "expired" | "refunded";
  valid_until: string | null;
  digistore_order_id: string;
  digistore_product_id: string | null;
  last_event: string;
  last_event_at: string;
};

async function upsertLicense(
  admin: ReturnType<typeof createAdminClient>,
  row: LicenseRow,
): Promise<void> {
  const { error } = await admin
    .from("licenses")
    .upsert(row, { onConflict: "user_id" });
  if (error) {
    throw new Error(`License upsert failed: ${error.message}`);
  }
}

// Käufe ohne Account: per Bestellung idempotent parken (siehe 010_pending_licenses.sql).
type PendingRow = Omit<LicenseRow, "user_id">;

async function upsertPending(
  admin: ReturnType<typeof createAdminClient>,
  row: PendingRow,
): Promise<void> {
  const { error } = await admin
    .from("pending_licenses")
    .upsert(row, { onConflict: "digistore_order_id" });
  if (error) {
    throw new Error(`Pending-License upsert failed: ${error.message}`);
  }
}

// Storno/Refund kann eine Bestellung treffen, die schon übernommen ODER noch
// geparkt ist — beide Tabellen per order_id aktualisieren.
async function setStatusByOrder(
  admin: ReturnType<typeof createAdminClient>,
  orderId: string,
  status: "refunded" | "cancelled",
  event: string,
  at: string,
): Promise<void> {
  const patch = { status, last_event: event, last_event_at: at };
  await admin.from("licenses").update(patch).eq("digistore_order_id", orderId);
  await admin.from("pending_licenses").update(patch).eq("digistore_order_id", orderId);
}

function oneYearFromNow(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString();
}
