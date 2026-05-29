import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isValidSlot } from "@/lib/webinar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  let body: { email?: string; name?: string; slot?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültiger Request-Body" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const name = body.name?.trim() || null;
  if (!email || !EMAIL_PATTERN.test(email)) {
    return NextResponse.json({ error: "Bitte gib eine gültige E-Mail-Adresse ein." }, { status: 400 });
  }

  const slot = body.slot?.trim();
  if (!isValidSlot(slot)) {
    return NextResponse.json({ error: "Bitte wähle einen gültigen Termin aus." }, { status: 400 });
  }

  const admin = createAdminClient();
  // Upsert auf lower(email): meldet sich jemand erneut für einen anderen Termin an,
  // gewinnt der neueste Termin (kein ignoreDuplicates).
  const { error } = await admin
    .from("webinar_signups")
    .upsert({ email, name, slot, source: "webinar-optin" }, { onConflict: "email" });

  if (error && !/duplicate key|conflict/i.test(error.message)) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
