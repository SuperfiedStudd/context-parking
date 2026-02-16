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
  type: 'created' | 'updated' | 'reminder_set' | 'draft_copied' | 'context_generated' | 'draft_status_changed';
  description: string;
  timestamp: string;
}

export interface Project {
  id: string;
  title: string;
  objective: string;
  chosenDirection: string;
  alternatives: string[];
  drafts: Draft[];
  nextAction: string;
  lastActiveAt: string;
  reminderAt?: string;
  activityLog: ActivityEvent[];
}

export interface CaptureEvent {
  chatId: string;
  transcript: string;
  instruction: string;
  createdAt: string;
  resolvedToProjectId?: string;
}

export type ProjectFilter = 'all' | 'active' | 'dormant' | 'unsent_drafts' | 'unexplored_alternatives';
export type ViewMode = 'list' | 'grid';
