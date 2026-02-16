import { useStore } from '@/store/useStore';
import { ProjectCard } from '@/components/ProjectCard';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { ProjectFilter } from '@/types';
import { LayoutList, LayoutGrid, Bell, Clock } from 'lucide-react';
import { relativeTime } from '@/lib/helpers';
import { useNavigate } from 'react-router-dom';

const filters: { key: ProjectFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'dormant', label: 'Dormant' },
  { key: 'unsent_drafts', label: 'Unsent Drafts' },
  { key: 'unexplored_alternatives', label: 'Unexplored' },
];

export default function Projects() {
  const { projects, filter, setFilter, viewMode, setViewMode } = useStore();
  const navigate = useNavigate();
  const now = Date.now();
  const fourteenDays = 14 * 86400000;

  const upNext = projects.filter(
    (p) => p.reminderAt && new Date(p.reminderAt).getTime() > now && new Date(p.reminderAt).getTime() - now < 2 * 86400000
  );
  const dormantNudges = projects.filter(
    (p) => now - new Date(p.lastActiveAt).getTime() > fourteenDays
  );

  const filtered = projects.filter((p) => {
    switch (filter) {
      case 'active':
        return now - new Date(p.lastActiveAt).getTime() < fourteenDays;
      case 'dormant':
        return now - new Date(p.lastActiveAt).getTime() >= fourteenDays;
      case 'unsent_drafts':
        return p.drafts.some((d) => d.status !== 'Sent');
      case 'unexplored_alternatives':
        return p.alternatives.length > 0 && !p.chosenDirection;
      default:
        return true;
    }
  });

  return (
    <Layout>
      {/* Resurfacing */}
      {(upNext.length > 0 || dormantNudges.length > 0) && (
        <div className="mb-6 space-y-3">
          {upNext.length > 0 && (
            <div className="bg-primary/8 border border-primary/15 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Bell className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-medium text-primary">Up Next</span>
              </div>
              <div className="space-y-1">
                {upNext.map((p) => (
                  <button
                    key={p.id}
                    className="w-full text-left text-sm hover:underline"
                    onClick={() => navigate(`/projects/${p.id}`)}
                  >
                    {p.title} — reminder {relativeTime(p.reminderAt!)}
                  </button>
                ))}
              </div>
            </div>
          )}
          {dormantNudges.length > 0 && (
            <div className="bg-muted/50 border rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Dormant — needs attention</span>
              </div>
              <div className="space-y-1">
                {dormantNudges.map((p) => (
                  <button
                    key={p.id}
                    className="w-full text-left text-sm text-muted-foreground hover:text-foreground transition-smooth"
                    onClick={() => navigate(`/projects/${p.id}`)}
                  >
                    {p.title} — last active {relativeTime(p.lastActiveAt)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-0.5">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-smooth ${
                filter === f.key
                  ? 'bg-card text-foreground card-shadow'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-0.5">
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-md transition-smooth ${viewMode === 'list' ? 'bg-card card-shadow' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <LayoutList className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-md transition-smooth ${viewMode === 'grid' ? 'bg-card card-shadow' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Project list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground text-sm">No projects match this filter.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((p) => (
            <ProjectCard key={p.id} project={p} viewMode="grid" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((p) => (
            <ProjectCard key={p.id} project={p} viewMode="list" />
          ))}
        </div>
      )}
    </Layout>
  );
}
