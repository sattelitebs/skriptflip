import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyDigistoreSignature } from "@/lib/digistore/verify";
import { handleDigistoreEvent } from "@/lib/digistore/handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Digistore24 IPN-Empfänger.
 *
 * Verfahren:
 *   1. Body als x-www-form-urlencoded parsen.
 *   2. Signatur prüfen (SHA-512 mit DIGISTORE_PASSPHRASE).
 *   3. Event in `digistore_events` loggen (auch bei ungültiger Signatur).
 *   4. Bei valider Signatur: Event verarbeiten (Lizenz upsert / status updaten).
 *   5. Antwort: immer HTTP 200, mit "OK" oder Fehlermeldung im Body.
 *      Digistore retried bei != 200 endlos — daher beantworten wir auch
 *      verarbeitete Fehler (ungültige Sig, kein User, …) mit 200 + Body-Text.
 */
export async function POST(request: Request) {
  const passphrase = process.env.DIGISTORE_PASSPHRASE;
  if (!passphrase) {
    console.error("[digistore] DIGISTORE_PASSPHRASE fehlt in env");
    return NextResponse.json(
      { error: "server not configured" },
      { status: 500 },
    );
  }

  // Digistore IPN sendet x-www-form-urlencoded
  const rawBody = await request.text();
  const params = parseFormBody(rawBody);

  const event = params.event ?? "";
  const orderId = params.order_id ?? null;
  const productId = params.product_id ?? null;
  const buyerEmail = (params.email ?? params.address_email ?? "").toLowerCase() || null;

  const sig = verifyDigistoreSignature(params, passphrase);

  const admin = createAdminClient();

  // Erst Event loggen — auch bei ungültiger Signatur, damit nichts verloren geht
  const { data: eventRow, error: logErr } = await admin
    .from("digistore_events")
    .insert({
      event,
      order_id: orderId,
      product_id: productId,
      buyer_email: buyerEmail,
      raw: params,
      signature_ok: sig.ok,
      processed_ok: false,
    })
    .select("id")
    .single();

  if (logErr) {
    console.error("[digistore] event-log-insert failed:", logErr.message);
    return new Response("Logged: ok\n", { status: 200 });
  }

  if (!sig.ok) {
    console.warn("[digistore] invalid signature for event", event, "order", orderId);
    return new Response("Logged: invalid signature\n", { status: 200 });
  }

  // Event verarbeiten
  try {
    const outcome = await handleDigistoreEvent(params);
    await admin
      .from("digistore_events")
      .update({
        processed_ok: outcome.processed,
        process_error: outcome.processed ? null : outcome.message,
      })
      .eq("id", eventRow.id);
    return new Response(`OK: ${outcome.message}\n`, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    console.error("[digistore] handler crashed:", message);
    await admin
      .from("digistore_events")
      .update({ processed_ok: false, process_error: message })
      .eq("id", eventRow.id);
    return new Response(`Logged: handler-error: ${message}\n`, { status: 200 });
  }
}

/**
 * GET-Handler für manuelle Connection-Tests aus dem Browser.
 * Antwortet mit „OK" damit du einfach prüfen kannst dass die Route lebt.
 */
export async function GET() {
  return new Response("digistore-webhook alive\n", { status: 200 });
}

function parseFormBody(body: string): Record<string, string> {
  const out: Record<string, string> = {};
  const sp = new URLSearchParams(body);
  for (const [k, v] of sp.entries()) {
    out[k] = v;
  }
  return out;
}
