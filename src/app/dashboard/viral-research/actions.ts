"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Löscht einen Viral-Research-Run des eingeloggten Users (RLS schützt fremde Zeilen).
 */
export async function deleteRun(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Nicht eingeloggt" };

  const { error } = await supabase.from("viral_research_runs").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/viral-research");
  return {};
}
