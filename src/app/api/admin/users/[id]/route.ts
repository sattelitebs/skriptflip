import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

  let body: { blocked?: boolean; role?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültiger Body" }, { status: 400 });
  }

  const update: { blocked?: boolean; role?: "user" | "admin" } = {};
  if (typeof body.blocked === "boolean") update.blocked = body.blocked;
  if (body.role === "user" || body.role === "admin") update.role = body.role;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nichts zu aktualisieren" }, { status: 400 });
  }

  // Service-Role bypasst RLS-Trigger nicht — der Trigger erlaubt Admin-Updates,
  // aber wir nutzen Admin-Client für saubere Audit-Trennung.
  const admin = createAdminClient();
  const { error } = await admin.from("profiles").update(update).eq("id", targetId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
