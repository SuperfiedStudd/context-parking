import { ActivityEvent } from '@/types';
import { relativeTime } from '@/lib/helpers';
import { Plus, Edit, Sparkles, Archive, RotateCcw, Pencil, Trash2, BrainCircuit } from 'lucide-react';
import { Button } from '@/components/ui/button';

const iconMap: Record<ActivityEvent['type'], typeof Plus> = {
  created: Plus,
  updated: Edit,
  context_generated: Sparkles,
  field_edited: Pencil,
  archived: Archive,
  reactivated: RotateCcw,
  second_opinion_generated: BrainCircuit,
};

interface Props {
  events: ActivityEvent[];
  onDeleteEvent?: (eventId: string) => void;
}

export function ActivityTimeline({ events, onDeleteEvent }: Props) {
  if (events.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-8 text-center">
        No activity yet
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {events.map((event, i) => {
        const Icon = iconMap[event.type] || Edit;
        return (
          <div key={event.id} className="flex gap-3 py-2.5 relative group">
            {i < events.length - 1 && (
              <div className="absolute left-[11px] top-[30px] bottom-0 w-px bg-border" />
            )}
            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0 relative z-10">
              <Icon className="w-3 h-3 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm">{event.description}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{relativeTime(event.timestamp)}</p>
            </div>
            {onDeleteEvent && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                onClick={() => onDeleteEvent(event.id)}
              >
                <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}
