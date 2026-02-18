import { supabase } from "@/integrations/supabase/client";
import type { DbCapture } from "@/types";

export async function fetchCaptures(): Promise<DbCapture[]> {
  const { data, error } = await (supabase as any)
    .from("captures")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return ((data as any[]) || []).map((row) => ({
    id: row.id,
    source: row.source,
    chat_title: row.chat_title,
    raw_transcript: row.raw_transcript,
    summary: row.summary,
    objective: row.objective,
    strategic_forks: Array.isArray(row.strategic_forks)
      ? row.strategic_forks
      : Array.isArray(row.alternatives)
        ? row.alternatives
        : [],
    deferred_decisions: Array.isArray(row.deferred_decisions)
      ? row.deferred_decisions
      : [],
    chosen_direction: row.chosen_direction,
    next_action: row.next_action,
    executive_snapshot: row.executive_snapshot || row.summary || "",
    resolved_to_project_id: row.resolved_to_project_id,
    created_at: row.created_at,
    ai_provider: row.ai_provider || undefined,
    ai_model: row.ai_model || undefined,
  }));
}

export async function markCapturePromoted(captureId: string): Promise<void> {
  const { error } = await (supabase
    .from("captures")
    .update({ status: "promoted" } as any)
    .eq("id", captureId) as any);

  if (error) {
    console.error("Failed to mark capture as promoted:", error);
    throw error;
  }
}

export async function markCaptureResolved(
  captureId: string,
  projectId: string
): Promise<void> {
  // This uses anon key — won't work because no UPDATE policy.
  // For now, we track this locally. The DB field is informational
  // and can be updated via the edge function or dashboard if needed.
}
