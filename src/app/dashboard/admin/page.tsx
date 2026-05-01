import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import AdminUserRow, { type AdminUser } from "./AdminUserRow";

export const metadata: Metadata = {
  title: "Admin – skriptflip",
};

export const dynamic = "force-dynamic";

type ProfileRow = {
  id: string;
  email: string;
  role: "user" | "admin";
  blocked: boolean;
  created_at: string;
};

type KeyRow = { user_id: string; provider: string };

type AnalysisCountRow = { user_id: string; created_at: string };

type LicenseRow = {
  user_id: string;
  type: "lifetime" | "yearly";
  status: "active" | "cancelled" | "expired" | "refunded";
  valid_until: string | null;
};

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: ownProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (ownProfile?.role !== "admin") {
    redirect("/dashboard");
  }

  const admin = createAdminClient();
  const [profilesRes, keysRes, analysesRes, licensesRes] = await Promise.all([
    admin.from("profiles").select("id, email, role, blocked, created_at").order("created_at", { ascending: false }),
    admin.from("user_api_keys").select("user_id, provider"),
    admin.from("analyses").select("user_id, created_at"),
    admin.from("licenses").select("user_id, type, status, valid_until"),
  ]);

  const profiles = (profilesRes.data ?? []) as ProfileRow[];
  const keys = (keysRes.data ?? []) as KeyRow[];
  const analyses = (analysesRes.data ?? []) as AnalysisCountRow[];
  const licenses = (licensesRes.data ?? []) as LicenseRow[];
  const licenseByUser = new Map<string, LicenseRow>();
  for (const l of licenses) licenseByUser.set(l.user_id, l);

  const keysByUser = new Map<string, Set<string>>();
  for (const k of keys) {
    const set = keysByUser.get(k.user_id) ?? new Set<string>();
    set.add(k.provider);
    keysByUser.set(k.user_id, set);
  }

  const lastByUser = new Map<string, string>();
  const countByUser = new Map<string, number>();
  for (const a of analyses) {
    countByUser.set(a.user_id, (countByUser.get(a.user_id) ?? 0) + 1);
    const cur = lastByUser.get(a.user_id);
    if (!cur || a.created_at > cur) lastByUser.set(a.user_id, a.created_at);
  }

  const users: AdminUser[] = profiles.map((p) => {
    const userKeys = keysByUser.get(p.id) ?? new Set<string>();
    const lic = licenseByUser.get(p.id) ?? null;
    return {
      id: p.id,
      email: p.email,
      role: p.role,
      blocked: p.blocked,
      created_at: p.created_at,
      last_activity_at: lastByUser.get(p.id) ?? null,
      analyses_count: countByUser.get(p.id) ?? 0,
      has_openai_key: userKeys.has("openai"),
      has_anthropic_key: userKeys.has("anthropic"),
      license_type: lic?.type ?? null,
      license_status: lic?.status ?? null,
      license_valid_until: lic?.valid_until ?? null,
    };
  });

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="mb-2 text-balance text-4xl font-black uppercase tracking-tight">
            Admin
          </h1>
          <p className="text-zinc-400">{users.length} User gesamt</p>
        </div>
        <Link
          href="/dashboard"
          className="rounded-md border border-[var(--color-border)] px-4 py-2 text-sm font-bold uppercase tracking-wide text-zinc-300 transition hover:border-[var(--color-brand)] hover:text-[var(--color-brand)]"
        >
          ← Dashboard
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--color-border)]">
        <table className="w-full text-sm">
          <thead className="border-b border-[var(--color-border)] bg-white/5 text-xs uppercase tracking-wide text-zinc-400">
            <tr>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Rolle</th>
              <th className="px-4 py-3 text-left">Keys</th>
              <th className="px-4 py-3 text-left">Lizenz</th>
              <th className="px-4 py-3 text-left">Analysen</th>
              <th className="px-4 py-3 text-left">Letzte Aktivität</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Aktion</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <AdminUserRow key={u.id} user={u} isSelf={u.id === user.id} />
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-zinc-500">
                  Keine User gefunden.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
