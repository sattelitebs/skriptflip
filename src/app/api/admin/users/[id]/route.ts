import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendAccessEmail } from "@/lib/auth/provision";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Nicht eingeloggt", status: 401 } as const;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    return { error: "Kein Admin-Zugriff", status: 403 } as const;
  }
  return { user } as const;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdmin();
  if ("error" in guard) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const { id: targetId } = await params;
  if (targetId === guard.user.id) {
    return NextResponse.json(
      { error: "Eigener Account kann nicht über Admin-API geändert werden" },
      { status: 400 },
    );
  }

  let body: {
    blocked?: boolean;
    role?: string;
    license?: { action: "grant" | "revoke"; type?: "lifetime" | "yearly" };
    resendEmail?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültiger Body" }, { status: 400 });
  }

  const admin = createAdminClient();
  let didSomething = false;

  // 1. Profil-Felder (blocked / role)
  const update: { blocked?: boolean; role?: "user" | "admin" } = {};
  if (typeof body.blocked === "boolean") update.blocked = body.blocked;
  if (body.role === "user" || body.role === "admin") update.role = body.role;
  if (Object.keys(update).length > 0) {
    const { error } = await admin.from("profiles").update(update).eq("id", targetId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    didSomething = true;
  }

  // 2. Lizenz vergeben / entziehen
  if (body.license) {
    const { data: targetProfile } = await admin
      .from("profiles")
      .select("email")
      .eq("id", targetId)
      .maybeSingle();
    if (!targetProfile) {
      return NextResponse.json({ error: "User nicht gefunden" }, { status: 404 });
    }
    const nowIso = new Date().toISOString();

    if (body.license.action === "grant") {
      const type = body.license.type === "yearly" ? "yearly" : "lifetime";
      const validUntil = type === "yearly" ? oneYearFromNow() : null;
      const { error } = await admin.from("licenses").upsert(
        {
          user_id: targetId,
          email: targetProfile.email,
          type,
          status: "active",
          valid_until: validUntil,
          digistore_order_id: `manual-${targetId}`,
          digistore_product_id: null,
          last_event: "admin_grant",
          last_event_at: nowIso,
        },
        { onConflict: "user_id" },
      );
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      // Zugangs-Mail (Account anlegen falls nötig / Login-Link)
      await sendAccessEmail(targetProfile.email).catch((e) =>
        console.error("[admin] access mail failed:", e),
      );
      didSomething = true;
    } else if (body.license.action === "revoke") {
      const { error } = await admin
        .from("licenses")
        .update({ status: "cancelled", last_event: "admin_revoke", last_event_at: nowIso })
        .eq("user_id", targetId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      didSomething = true;
    }
  }

  // 3. Zugangs-Mail erneut senden
  if (body.resendEmail) {
    const { data: targetProfile } = await admin
      .from("profiles")
      .select("email")
      .eq("id", targetId)
      .maybeSingle();
    if (!targetProfile) {
      return NextResponse.json({ error: "User nicht gefunden" }, { status: 404 });
    }
    const ok = await sendAccessEmail(targetProfile.email);
    if (!ok) {
      return NextResponse.json({ error: "Mail konnte nicht gesendet werden" }, { status: 500 });
    }
    didSomething = true;
  }

  if (!didSomething) {
    return NextResponse.json({ error: "Nichts zu aktualisieren" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

function oneYearFromNow(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString();
}
