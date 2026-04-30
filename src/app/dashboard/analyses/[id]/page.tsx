import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AnalysisView from "./AnalysisView";

export const metadata: Metadata = {
  title: "Analyse – skriptflip",
};

export default async function AnalysisPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [analysisRes, repurposesRes, voiceoversRes] = await Promise.all([
    supabase
      .from("analyses")
      .select("id, video_url, status, transcript, scripts, error, created_at, updated_at")
      .eq("id", id)
      .single(),
    supabase
      .from("repurposes")
      .select("id, source_script_index, formats, status, error, created_at")
      .eq("analysis_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("voiceovers")
      .select("id, source_script_index, voice, status, created_at")
      .eq("analysis_id", id)
      .eq("status", "done")
      .order("created_at", { ascending: false }),
  ]);

  if (analysisRes.error || !analysisRes.data) notFound();

  return (
    <AnalysisView
      initial={analysisRes.data}
      initialRepurposes={repurposesRes.data ?? []}
      initialVoiceovers={voiceoversRes.data ?? []}
    />
  );
}
