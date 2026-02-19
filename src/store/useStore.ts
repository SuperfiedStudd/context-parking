import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Project, Draft, CaptureEvent, ActivityEvent, DashboardTab, ViewMode } from '@/types';
import { seedProjects } from '@/data/seed';

const generateId = () => Math.random().toString(36).substring(2, 10);

interface AppState {
  projects: Project[];
  drafts: Draft[];
  captures: CaptureEvent[];
  storeRawTranscripts: boolean;
  filter: DashboardTab;
  viewMode: ViewMode;
  searchQuery: string;

  setFilter: (f: DashboardTab) => void;
  setViewMode: (m: ViewMode) => void;
  setSearchQuery: (q: string) => void;
  setStoreRawTranscripts: (v: boolean) => void;

  // Projects
  addProject: (p: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  archiveProject: (id: string) => void;
  reactivateProject: (id: string) => void;
  addActivityEvent: (projectId: string, event: Omit<ActivityEvent, 'id' | 'timestamp'>) => void;
  deleteActivityEvent: (projectId: string, eventId: string) => void;

  // Drafts (first-class entities)
  addDraft: (d: Draft) => void;
  updateDraft: (id: string, updates: Partial<Pick<Draft, 'title' | 'content' | 'recipient'>>) => void;
  archiveDraft: (id: string) => void;
  unarchiveDraft: (id: string) => void;
  deleteDraft: (id: string) => void;

  addCapture: (c: CaptureEvent) => void;
  clearAllData: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      projects: seedProjects,
      drafts: [],
      captures: [],
      storeRawTranscripts: false,
      filter: 'active',
      viewMode: 'list',
      searchQuery: '',

      setFilter: (f) => set({ filter: f }),
      setViewMode: (m) => set({ viewMode: m }),
      setSearchQuery: (q) => set({ searchQuery: q }),
      setStoreRawTranscripts: (v) => set({ storeRawTranscripts: v }),

      addProject: (p) => set((s) => ({ projects: [p, ...s.projects] })),
      updateProject: (id, updates) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id ? { ...p, ...updates, lastActiveAt: new Date().toISOString() } : p
          ),
        })),
      deleteProject: (id) => set((s) => ({ projects: s.projects.filter((p) => p.id !== id) })),

      archiveProject: (id) => {
        const now = new Date().toISOString();
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id ? { ...p, archivedAt: now, lastActiveAt: now } : p
          ),
        }));
        get().addActivityEvent(id, { type: 'archived', description: 'Project archived' });
      },

      reactivateProject: (id) => {
        const now = new Date().toISOString();
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id ? { ...p, archivedAt: null, lastActiveAt: now } : p
          ),
        }));
        get().addActivityEvent(id, { type: 'reactivated', description: 'Project reactivated' });
      },

      addActivityEvent: (projectId, event) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  activityLog: [
                    { ...event, id: generateId(), timestamp: new Date().toISOString() },
                    ...p.activityLog,
                  ],
                  lastActiveAt: new Date().toISOString(),
                }
              : p
          ),
        })),

      deleteActivityEvent: (projectId, eventId) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === projectId
              ? { ...p, activityLog: p.activityLog.filter((e) => e.id !== eventId) }
              : p
          ),
        })),

      // ── Draft CRUD ────────────────────────────────────────────────────────
      addDraft: (d) => set((s) => ({ drafts: [d, ...s.drafts] })),

      updateDraft: (id, updates) => {
        const now = new Date().toISOString();
        set((s) => ({
          drafts: s.drafts.map((d) =>
            d.id === id ? { ...d, ...updates, updatedAt: now } : d
          ),
        }));
      },

      archiveDraft: (id) => {
        const now = new Date().toISOString();
        set((s) => ({
          drafts: s.drafts.map((d) =>
            d.id === id ? { ...d, archivedAt: now, updatedAt: now } : d
          ),
        }));
      },

      unarchiveDraft: (id) => {
        const now = new Date().toISOString();
        set((s) => ({
          drafts: s.drafts.map((d) =>
            d.id === id ? { ...d, archivedAt: null, updatedAt: now } : d
          ),
        }));
      },

      deleteDraft: (id) => set((s) => ({ drafts: s.drafts.filter((d) => d.id !== id) })),

      addCapture: (c) => set((s) => ({ captures: [c, ...s.captures] })),

      clearAllData: () => set({ projects: seedProjects, drafts: [], captures: [], storeRawTranscripts: false }),
    }),
    { name: 'context-parking-store' }
  )
);
