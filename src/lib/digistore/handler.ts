import { createAdminClient } from "@/lib/supabase/admin";

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
 * die Lizenz in `public.licenses` an.
 *
 * Mapping:
 *   - billing_type "single_payment" → license.type = "lifetime"  (valid_until = NULL)
 *   - billing_type "subscription"   → license.type = "yearly"    (valid_until = now + 1 Jahr)
 *
 * Wenn der Buyer noch keinen skriptflip-Account hat (Email kommt nicht in
 * `profiles` vor), wird das Event geloggt und mit processed=false beantwortet —
 * Digistore bekommt trotzdem 200 zurück (Code im Route-Handler), damit es
 * keine Endlos-Retries gibt.
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

  if (!profile) {
    return {
      processed: false,
      message:
        "Käufer hat noch keinen skriptflip-Account. Lizenz wird bei Registrierung übernommen.",
    };
  }

  const billingType = params.order_billing_type ?? params.billing_type ?? "";
  const isSubscription = billingType === "subscription";
  const licenseType: "lifetime" | "yearly" = isSubscription ? "yearly" : "lifetime";

  switch (event) {
    case "on_payment": {
      const validUntil = isSubscription ? oneYearFromNow() : null;
      await upsertLicense(admin, {
        user_id: profile.id,
        email: buyerEmail,
        type: licenseType,
        status: "active",
        valid_until: validUntil,
        digistore_order_id: orderId,
        digistore_product_id: productId,
        last_event: event,
        last_event_at: new Date().toISOString(),
      });
      return { processed: true, message: `Lizenz (${licenseType}) aktiviert.` };
    }

    case "on_rebill": {
      await upsertLicense(admin, {
        user_id: profile.id,
        email: buyerEmail,
        type: "yearly",
        status: "active",
        valid_until: oneYearFromNow(),
        digistore_order_id: orderId,
        digistore_product_id: productId,
        last_event: event,
        last_event_at: new Date().toISOString(),
      });
      return { processed: true, message: "Jahresabo verlängert." };
    }

    case "on_refund":
    case "on_chargeback": {
      await admin
        .from("licenses")
        .update({
          status: "refunded",
          last_event: event,
          last_event_at: new Date().toISOString(),
        })
        .eq("digistore_order_id", orderId);
      return { processed: true, message: "Lizenz auf 'refunded' gesetzt." };
    }

    case "on_revoke":
    case "on_payment_missed": {
      await admin
        .from("licenses")
        .update({
          status: "cancelled",
          last_event: event,
          last_event_at: new Date().toISOString(),
        })
        .eq("digistore_order_id", orderId);
      return { processed: true, message: "Lizenz auf 'cancelled' gesetzt." };
    }

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

function oneYearFromNow(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString();
}
