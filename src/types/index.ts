export type DraftStatus = 'Draft' | 'Ready' | 'Sent';

export interface Draft {
  id: string;
  title: string;
  content: string;
  status: DraftStatus;
  reminderAt?: string;
}

export interface ActivityEvent {
  id: string;
  type: 'created' | 'updated' | 'reminder_set' | 'draft_copied' | 'context_generated' | 'draft_status_changed' | 'field_edited' | 'archived' | 'reactivated' | 'second_opinion_generated';
  description: string;
  timestamp: string;
  fieldName?: string;
  previousValue?: string;
  secondOpinionId?: string;
}

export type ProjectStatus = 'active' | 'archived';

export interface Project {
  id: string;
  title: string;
  objective: string;
  chosenDirection: string;
  strategicForks: string[];
  deferredDecisions: string[];
  executiveSnapshot?: string;
  drafts: Draft[];
  nextAction: string;
  lastActiveAt: string;
  reminderAt?: string;
  activityLog: ActivityEvent[];
  status?: ProjectStatus;
}

export interface CaptureEvent {
  chatId: string;
  transcript: string;
  instruction: string;
  createdAt: string;
  resolvedToProjectId?: string;
}

export type ProjectFilter = 'active' | 'drafts' | 'archived';
export type ViewMode = 'list' | 'grid';

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
}
