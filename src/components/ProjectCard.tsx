import { Project } from '@/types';
import { relativeTime } from '@/lib/helpers';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, FileText, Bell, ArrowRight } from 'lucide-react';

interface ProjectCardProps {
  project: Project;
  viewMode: 'list' | 'grid';
}

export function ProjectCard({ project, viewMode }: ProjectCardProps) {
  const navigate = useNavigate();
  const readyDrafts = project.drafts.filter((d) => d.status === 'Ready').length;
  const draftCount = project.drafts.length;
  const hasReminder = !!project.reminderAt;

  if (viewMode === 'grid') {
    return (
      <div
        className="bg-card border rounded-lg p-4 card-shadow transition-smooth hover:card-shadow-hover cursor-pointer group"
        onClick={() => navigate(`/projects/${project.id}`)}
      >
        <h3 className="font-semibold text-sm mb-1 group-hover:text-primary transition-smooth">{project.title}</h3>
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{project.objective}</p>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {draftCount > 0 && (
            <Badge variant="secondary" className="text-xs gap-1">
              <FileText className="w-3 h-3" /> {draftCount}
            </Badge>
          )}
          {hasReminder && (
            <Badge className="text-xs gap-1 bg-primary/15 text-primary border-primary/20 hover:bg-primary/20">
              <Bell className="w-3 h-3" /> Reminder
            </Badge>
          )}
          {readyDrafts > 0 && (
            <Badge className="text-xs gap-1 bg-accent/30 text-accent-foreground border-accent/30 hover:bg-accent/40">
              {readyDrafts} Ready
            </Badge>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" /> {relativeTime(project.lastActiveAt)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-card border rounded-lg px-4 py-3 card-shadow transition-smooth hover:card-shadow-hover cursor-pointer group flex items-center gap-4"
      onClick={() => navigate(`/projects/${project.id}`)}
    >
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-sm group-hover:text-primary transition-smooth">{project.title}</h3>
        <p className="text-xs text-muted-foreground truncate mt-0.5">{project.objective}</p>
      </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
        {draftCount > 0 && (
          <Badge variant="secondary" className="text-xs gap-1">
            <FileText className="w-3 h-3" /> {draftCount}
          </Badge>
        )}
        {hasReminder && (
          <Badge className="text-xs gap-1 bg-primary/15 text-primary border-primary/20 hover:bg-primary/20">
            <Bell className="w-3 h-3" />
          </Badge>
        )}
        {readyDrafts > 0 && (
          <Badge className="text-xs gap-1 bg-accent/30 text-accent-foreground border-accent/30 hover:bg-accent/40">
            {readyDrafts} Ready
          </Badge>
        )}
      </div>
      <span className="text-xs text-muted-foreground flex-shrink-0 w-24 text-right flex items-center justify-end gap-1">
        <Clock className="w-3 h-3" /> {relativeTime(project.lastActiveAt)}
      </span>
      <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-smooth">
        <ArrowRight className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}
