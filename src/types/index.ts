// ── Draft — first-class standalone entity ─────────────────────────────────────
export interface Draft {
  id: string;
  title: string;
  content: string;
  recipient: string;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string | null;
}

// ── Activity ──────────────────────────────────────────────────────────────────
export interface ActivityEvent {
  id: string;
  type:
    | 'created'
    | 'updated'
    | 'context_generated'
    | 'field_edited'
    | 'archived'
    | 'reactivated'
    | 'second_opinion_generated';
  description: string;
  timestamp: string;
  fieldName?: string;
  previousValue?: string;
  secondOpinionId?: string;
}

// ── Project ───────────────────────────────────────────────────────────────────
export interface Project {
  id: string;
  title: string;
  objective: string;
  chosenDirection: string;
  strategicForks: string[];
  deferredDecisions: string[];
  executiveSnapshot?: string;
  nextAction: string;
  lastActiveAt: string;
  archivedAt?: string | null;
  activityLog: ActivityEvent[];
  /** @deprecated Use archivedAt instead. Kept for migration compat. */
  status?: 'active' | 'archived';
  /** @deprecated Draft is now a standalone entity */
  drafts?: never[];
  reminderAt?: string;
}

// ── Capture ───────────────────────────────────────────────────────────────────
export interface CaptureEvent {
  chatId: string;
  transcript: string;
  instruction: string;
  createdAt: string;
  resolvedToProjectId?: string;
}

export interface DbCapture {
  id: string;
  source: string;
  chat_title: string;
  raw_transcript: string;
  summary: string;
  objective: string;
  strategic_forks: string[];
  deferred_decisions: string[];
  chosen_direction: string;
  next_action: string;
  executive_snapshot: string;
  resolved_to_project_id: string | null;
  created_at: string;
  ai_provider?: string;
  ai_model?: string;
  capture_type?: 'project' | 'draft';
  // Draft-specific fields returned from edge function for draft captures
  draft_recipient?: string;
}

// ── UI state ──────────────────────────────────────────────────────────────────
export type DashboardTab = 'active' | 'drafts' | 'archived';
export type ViewMode = 'list' | 'grid';

// Legacy alias so any remaining imports compile
export type ProjectFilter = DashboardTab;
