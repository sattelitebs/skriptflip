import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase-Client mit Service-Role-Key. Niemals im Browser
 * importieren. Nutze diesen Client für Storage-Uploads, Signed-URLs und andere
 * Operationen, die RLS umgehen müssen.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
