import { supabase } from "@/integrations/supabase/client";
import type { DbCapture } from "@/types";

export async function fetchCaptures(): Promise<DbCapture[]> {
  const { data, error } = await supabase
    .from("captures" as any)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return ((data as any[]) || []).map((row) => ({
    id: row.id,
    source: row.source,
    chat_title: row.chat_title,
    raw_transcript: row.raw_transcript,
    summary: row.summary,
    objective: row.objective,
    alternatives: Array.isArray(row.alternatives)
      ? row.alternatives
      : [],
    chosen_direction: row.chosen_direction,
    next_action: row.next_action,
    resolved_to_project_id: row.resolved_to_project_id,
    created_at: row.created_at,
  }));
}

export async function markCaptureResolved(
  captureId: string,
  projectId: string
): Promise<void> {
  // This uses anon key — won't work because no UPDATE policy.
  // For now, we track this locally. The DB field is informational
  // and can be updated via the edge function or dashboard if needed.
}
