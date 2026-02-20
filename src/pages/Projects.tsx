import { useStore } from '@/store/useStore';
import { ProjectCard } from '@/components/ProjectCard';
import { DraftCard } from '@/components/DraftCard';
import { Layout } from '@/components/Layout';
import { DashboardTab } from '@/types';
import { LayoutList, LayoutGrid, Archive, FileText, FolderOpen } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { relativeTime } from '@/lib/helpers';
import { toast } from 'sonner';

const tabs: { key: DashboardTab; label: string }[] = [
  { key: 'active', label: 'Active Projects' },
  { key: 'drafts', label: 'Drafts' },
  { key: 'archived', label: 'Archived' },
];

export default function Projects() {
  const { projects, drafts, filter, setFilter, viewMode, setViewMode, archiveProject, reactivateProject, archiveDraft, unarchiveDraft } = useStore();
  const [searchParams, setSearchParams] = useSearchParams();

  // Sync tab with URL
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'active' || tabParam === 'drafts' || tabParam === 'archived') {
      setFilter(tabParam);
    }
  }, [searchParams, setFilter]); // Removed 'filter' to prevent loop/revert

  // Update URL when filter changes
  useEffect(() => {
    setSearchParams({ tab: filter });
  }, [filter, setSearchParams]);

  // ── Active Projects: no archivedAt, sorted by lastActiveAt desc ─────────────
  const activeProjects = projects
    .filter((p) => !p.archivedAt)
    .sort((a, b) => new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime());

  // ── Drafts: no archivedAt, sorted by updatedAt desc ───────────────────────
  const activeDrafts = drafts
    .filter((d) => !d.archivedAt)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  // ── Archived: both archived projects + archived drafts ─────────────────────
  const archivedProjects = projects
    .filter((p) => !!p.archivedAt)
    .map((p) => ({ type: 'project' as const, item: p, archivedAt: p.archivedAt! }));

  const archivedDrafts = drafts
    .filter((d) => !!d.archivedAt)
    .map((d) => ({ type: 'draft' as const, item: d, archivedAt: d.archivedAt! }));

  const archivedItems = [...archivedProjects, ...archivedDrafts].sort(
    (a, b) => new Date(b.archivedAt).getTime() - new Date(a.archivedAt).getTime()
  );

  const currentFilter = (filter === 'active' || filter === 'drafts' || filter === 'archived')
    ? filter
    : 'active';

  const isEmpty =
    (currentFilter === 'active' && activeProjects.length === 0) ||
    (currentFilter === 'drafts' && activeDrafts.length === 0) ||
    (currentFilter === 'archived' && archivedItems.length === 0);

  const emptyMessages: Record<typeof currentFilter, string> = {
    active: 'No active projects. Use the browser extension or Capture page to create one.',
    drafts: 'No drafts yet. Use the browser extension and choose "Create Draft".',
    archived: 'Nothing archived yet.',
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
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-smooth ${currentFilter === t.key
                ? 'bg-card text-foreground card-shadow'
                : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-0.5">
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-md transition-smooth ${viewMode === 'list' ? 'bg-card card-shadow' : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            <LayoutList className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-md transition-smooth ${viewMode === 'grid' ? 'bg-card card-shadow' : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {isEmpty ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground text-sm">{emptyMessages[currentFilter]}</p>
        </div>
      ) : currentFilter === 'drafts' ? (
        // ── Drafts tab ───────────────────────────────────────────────────────
        <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" : "space-y-2"}>
          {activeDrafts.map((draft) => (
            <DraftCard key={draft.id} draft={draft} viewMode={viewMode} />
          ))}
        </div>
      ) : currentFilter === 'archived' ? (
        // ── Archived tab ─────────────────────────────────────────────────────
        <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" : "space-y-2"}>
          {archivedItems.map((entry) => {
            if (entry.type === 'project') {
              const project = entry.item;
              return (
                <div
                  key={`project-${project.id}`}
                  className={`bg-card border rounded-lg card-shadow flex ${viewMode === 'grid' ? 'flex-col p-4 h-full' : 'items-center gap-3 px-4 py-3'}`}
                >
                  <div className={`flex ${viewMode === 'grid' ? 'items-start justify-between w-full mb-3' : 'items-center gap-3 flex-1 min-w-0'}`}>
                    {viewMode === 'grid' ? (
                      <>
                        <FolderOpen className="w-8 h-8 p-1.5 bg-muted rounded-md text-muted-foreground" />
                        <Badge variant="secondary" className="text-xs">Project</Badge>
                      </>
                    ) : (
                      <FolderOpen className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    )}

                    {viewMode === 'list' && (
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <Badge variant="secondary" className="text-xs px-1.5 py-0">Project</Badge>
                          <span className="text-sm font-medium truncate">{project.title}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Archived {relativeTime(project.archivedAt!)}
                        </p>
                      </div>
                    )}
                  </div>

                  {viewMode === 'grid' && (
                    <div className="flex-1">
                      <h3 className="font-medium text-sm truncate mb-1">{project.title}</h3>
                      <p className="text-xs text-muted-foreground mb-4">
                        Archived {relativeTime(project.archivedAt!)}
                      </p>
                    </div>
                  )}

                  <div className={viewMode === 'grid' ? 'mt-auto pt-3 border-t flex justify-end' : ''}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      onClick={() => { reactivateProject(project.id); toast.success('Project reactivated'); }}
                    >
                      Unarchive
                    </Button>
                  </div>
                </div>
              );
            } else {
              const draft = entry.item;
              return (
                <div
                  key={`draft-${draft.id}`}
                  className={`bg-card border rounded-lg card-shadow flex ${viewMode === 'grid' ? 'flex-col p-4 h-full' : 'items-center gap-3 px-4 py-3'}`}
                >
                  <div className={`flex ${viewMode === 'grid' ? 'items-start justify-between w-full mb-3' : 'items-center gap-3 flex-1 min-w-0'}`}>
                    {viewMode === 'grid' ? (
                      <>
                        <Archive className="w-8 h-8 p-1.5 bg-accent/20 rounded-md text-accent-foreground" />
                        <Badge className="text-xs bg-accent/20 text-accent-foreground border-accent/20">Draft</Badge>
                      </>
                    ) : (
                      <Archive className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    )}

                    {viewMode === 'list' && (
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <Badge className="text-xs px-1.5 py-0 bg-accent/20 text-accent-foreground border-accent/20">Draft</Badge>
                          <span className="text-sm font-medium truncate">{draft.title}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {draft.recipient ? `To: ${draft.recipient} · ` : ''}
                          Archived {relativeTime(draft.archivedAt!)}
                        </p>
                      </div>
                    )}
                  </div>

                  {viewMode === 'grid' && (
                    <div className="flex-1">
                      <h3 className="font-medium text-sm truncate mb-1">{draft.title}</h3>
                      <p className="text-xs text-muted-foreground mb-4">
                        {draft.recipient ? `To: ${draft.recipient}` : 'No Recipient'}
                      </p>
                    </div>
                  )}

                  <div className={viewMode === 'grid' ? 'mt-auto pt-3 border-t flex justify-between items-center' : ''}>
                    {viewMode === 'grid' && <span className="text-[10px] text-muted-foreground/60">{relativeTime(draft.archivedAt!)}</span>}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      onClick={() => { unarchiveDraft(draft.id); toast.success('Draft restored'); }}
                    >
                      Unarchive
                    </Button>
                  </div>
                </div>
              );
            }
          })}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {activeProjects.map((p) => (
            <ProjectCard key={p.id} project={p} viewMode="grid" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {activeProjects.map((p) => (
            <ProjectCard key={p.id} project={p} viewMode="list" />
          ))}
        </div>
      )}
    </Layout>
  );
}
