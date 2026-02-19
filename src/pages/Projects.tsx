import { useStore } from '@/store/useStore';
import { ProjectCard } from '@/components/ProjectCard';
import { DraftCard } from '@/components/DraftCard';
import { Layout } from '@/components/Layout';
import { ProjectFilter } from '@/types';
import { LayoutList, LayoutGrid } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const tabs: { key: ProjectFilter; label: string }[] = [
  { key: 'active', label: 'Active Projects' },
  { key: 'drafts', label: 'Drafts' },
  { key: 'archived', label: 'Archived' },
];

export default function Projects() {
  const { projects, filter, setFilter, viewMode, setViewMode } = useStore();

  // ── Active Projects: not archived, sorted by lastActiveAt desc ─────────────
  const activeProjects = projects
    .filter((p) => p.status !== 'archived')
    .sort((a, b) => new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime());

  // ── Drafts: not archived, has at least one draft ───────────────────────────
  // Flatten to individual (project, draft) pairs, sorted by draft reminderAt
  // (used as a proxy for lastEditedAt since Draft has no dedicated timestamp field)
  const draftEntries = projects
    .filter((p) => p.status !== 'archived' && p.drafts.length > 0)
    .flatMap((p) =>
      p.drafts.map((d) => ({ project: p, draft: d }))
    )
    .sort((a, b) => {
      // Fall back to project lastActiveAt if no reminderAt on draft
      const aTime = a.draft.reminderAt
        ? new Date(a.draft.reminderAt).getTime()
        : new Date(a.project.lastActiveAt).getTime();
      const bTime = b.draft.reminderAt
        ? new Date(b.draft.reminderAt).getTime()
        : new Date(b.project.lastActiveAt).getTime();
      return bTime - aTime;
    });

  // ── Archived: status archived, sorted by lastActiveAt desc ────────────────
  const archivedProjects = projects
    .filter((p) => p.status === 'archived')
    .sort((a, b) => new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime());

  const currentFilter = (filter === 'active' || filter === 'drafts' || filter === 'archived')
    ? filter
    : 'active';

  const isEmpty =
    (currentFilter === 'active' && activeProjects.length === 0) ||
    (currentFilter === 'drafts' && draftEntries.length === 0) ||
    (currentFilter === 'archived' && archivedProjects.length === 0);

  const emptyMessages: Record<typeof currentFilter, string> = {
    active: 'No active projects.',
    drafts: 'No drafts yet.',
    archived: 'No archived projects.',
  };

  return (
    <Layout>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        {/* Tab switcher */}
        <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-0.5">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-smooth ${
                currentFilter === t.key
                  ? 'bg-card text-foreground card-shadow'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* View mode — only relevant for project views */}
        {currentFilter !== 'drafts' && (
          <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-smooth ${
                viewMode === 'list' ? 'bg-card card-shadow' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <LayoutList className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-smooth ${
                viewMode === 'grid' ? 'bg-card card-shadow' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      {isEmpty ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground text-sm">{emptyMessages[currentFilter]}</p>
        </div>
      ) : currentFilter === 'drafts' ? (
        // ── Drafts tab: outbound message centre feel ─────────────────────────
        <div className="space-y-2">
          {draftEntries.map(({ project, draft }) => (
            <DraftCard key={`${project.id}-${draft.id}`} project={project} draft={draft} />
          ))}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(currentFilter === 'archived' ? archivedProjects : activeProjects).map((p) => (
            <ProjectCard key={p.id} project={p} viewMode="grid" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {(currentFilter === 'archived' ? archivedProjects : activeProjects).map((p) => (
            <ProjectCard key={p.id} project={p} viewMode="list" />
          ))}
        </div>
      )}
    </Layout>
  );
}
