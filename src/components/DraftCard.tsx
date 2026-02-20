import { Draft } from '@/types';
import { relativeTime } from '@/lib/helpers';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Mail, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DraftCardProps {
  draft: Draft;
  viewMode?: 'list' | 'grid';
}

export function DraftCard({ draft, viewMode = 'list' }: DraftCardProps) {
  const navigate = useNavigate();

  // Content preview: strip markdown symbols
  const preview = draft.content
    .replace(/#{1,6}\s+/g, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/\n+/g, ' ')
    .trim()
    .slice(0, 180);

  if (viewMode === 'grid') {
    return (
      <div
        className="bg-card border rounded-xl p-4 card-shadow transition-smooth hover:card-shadow-hover cursor-pointer group flex flex-col h-full relative"
        onClick={() => navigate(`/drafts/${draft.id}`)}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center text-accent-foreground">
            <Mail className="w-4 h-4" />
          </div>
          <span className="text-xs text-muted-foreground/60">{relativeTime(draft.updatedAt)}</span>
        </div>

        <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors line-clamp-1">
          {draft.title || 'Untitled Draft'}
        </h3>

        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
          <User className="w-3 h-3 flex-shrink-0" />
          {draft.recipient ? (
            <span className="truncate max-w-[150px]">{draft.recipient}</span>
          ) : (
            <span className="italic text-muted-foreground/60">No recipient</span>
          )}
        </div>

        {preview && (
          <p className="text-xs text-muted-foreground line-clamp-4 leading-relaxed flex-1">
            {preview}
          </p>
        )}

        {/* Hover arrow */}
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-smooth">
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-card border rounded-lg px-4 py-3.5 card-shadow transition-smooth hover:card-shadow-hover cursor-pointer group"
      onClick={() => navigate(`/drafts/${draft.id}`)}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="mt-0.5 flex-shrink-0 w-7 h-7 rounded-md bg-accent/20 flex items-center justify-center">
          <Mail className="w-3.5 h-3.5 text-accent-foreground" />
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <p className="text-sm font-semibold group-hover:text-primary transition-smooth truncate mb-0.5">
            {draft.title || 'Untitled Draft'}
          </p>

          {/* Recipient */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1.5">
            <User className="w-3 h-3 flex-shrink-0" />
            {draft.recipient ? (
              <span className="truncate">To: {draft.recipient}</span>
            ) : (
              <span className="italic text-muted-foreground/60">Recipient: —</span>
            )}
          </div>

          {/* Content preview */}
          {preview && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {preview}
              {draft.content.length > 180 && '…'}
            </p>
          )}

          {/* Updated time */}
          <p className="text-xs text-muted-foreground/60 mt-1.5">
            {relativeTime(draft.updatedAt)}
          </p>
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
