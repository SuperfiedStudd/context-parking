import { Project, Draft } from '@/types';
import { relativeTime } from '@/lib/helpers';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DraftCardProps {
  project: Project;
  draft: Draft;
}

export function DraftCard({ project, draft }: DraftCardProps) {
  const navigate = useNavigate();

  // Extract recipient from draft title heuristically: "Draft to X" or just use the title
  const recipientMatch = draft.title.match(/^(?:draft\s+to\s+|to:\s*)(.+)$/i);
  const recipient = recipientMatch ? recipientMatch[1] : null;

  // Content preview: strip markdown symbols, take first ~160 chars
  const preview = draft.content
    .replace(/#{1,6}\s+/g, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/\n+/g, ' ')
    .trim()
    .slice(0, 160);

  const statusColors: Record<Draft['status'], string> = {
    Draft: 'bg-muted text-muted-foreground border-border',
    Ready: 'bg-accent/30 text-accent-foreground border-accent/40',
    Sent: 'bg-secondary text-secondary-foreground border-border',
  };

  return (
    <div
      className="bg-card border rounded-lg px-4 py-3.5 card-shadow transition-smooth hover:card-shadow-hover cursor-pointer group"
      onClick={() => navigate(`/projects/${project.id}`)}
    >
      <div className="flex items-start gap-3">
        {/* Left: icon */}
        <div className="mt-0.5 flex-shrink-0 w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center">
          <FileText className="w-3.5 h-3.5 text-primary" />
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Headline */}
          <div className="flex items-center gap-2 mb-1">
            {recipient ? (
              <span className="text-sm font-semibold group-hover:text-primary transition-smooth truncate">
                Draft to {recipient}
              </span>
            ) : (
              <>
                <span className="text-sm font-semibold text-muted-foreground group-hover:text-foreground transition-smooth truncate">
                  {draft.title || 'Untitled Draft'}
                </span>
                <Badge variant="outline" className="text-xs flex-shrink-0 px-1.5 py-0">
                  Has Draft
                </Badge>
              </>
            )}
            <Badge
              className={`text-xs flex-shrink-0 px-1.5 py-0 border ${statusColors[draft.status]}`}
            >
              {draft.status}
            </Badge>
          </div>

          {/* Content preview */}
          {preview && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-1.5 leading-relaxed">
              {preview}
              {draft.content.length > 160 && '…'}
            </p>
          )}

          {/* Footer meta */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground/70">
            <span className="truncate">{project.title}</span>
            {draft.reminderAt && (
              <>
                <span>·</span>
                <span>edited {relativeTime(draft.reminderAt)}</span>
              </>
            )}
          </div>
        </div>

        {/* Arrow */}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-smooth mt-0.5"
        >
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
