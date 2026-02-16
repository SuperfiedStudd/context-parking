import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Project, CaptureEvent, ActivityEvent, DraftStatus, ProjectFilter, ViewMode } from '@/types';
import { seedProjects } from '@/data/seed';

interface AppState {
  projects: Project[];
  captures: CaptureEvent[];
  storeRawTranscripts: boolean;
  filter: ProjectFilter;
  viewMode: ViewMode;
  searchQuery: string;

  setFilter: (f: ProjectFilter) => void;
  setViewMode: (m: ViewMode) => void;
  setSearchQuery: (q: string) => void;
  setStoreRawTranscripts: (v: boolean) => void;

  addProject: (p: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  addActivityEvent: (projectId: string, event: Omit<ActivityEvent, 'id' | 'timestamp'>) => void;

  updateDraftStatus: (projectId: string, draftId: string, status: DraftStatus) => void;
  updateDraftContent: (projectId: string, draftId: string, content: string) => void;

  addCapture: (c: CaptureEvent) => void;
  clearAllData: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 10);

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      projects: seedProjects,
      captures: [],
      storeRawTranscripts: false,
      filter: 'all',
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

      updateDraftStatus: (projectId, draftId, status) => {
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  drafts: p.drafts.map((d) => (d.id === draftId ? { ...d, status } : d)),
                  lastActiveAt: new Date().toISOString(),
                }
              : p
          ),
        }));
        get().addActivityEvent(projectId, {
          type: 'draft_status_changed',
          description: `Draft status changed to ${status}`,
        });
      },

      updateDraftContent: (projectId, draftId, content) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  drafts: p.drafts.map((d) => (d.id === draftId ? { ...d, content } : d)),
                  lastActiveAt: new Date().toISOString(),
                }
              : p
          ),
        })),

      addCapture: (c) => set((s) => ({ captures: [c, ...s.captures] })),

      clearAllData: () => set({ projects: seedProjects, captures: [], storeRawTranscripts: false }),
    }),
    { name: 'context-parking-store' }
  )
);
