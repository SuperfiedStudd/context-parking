import { ActivityEvent } from '@/types';
import { relativeTime } from '@/lib/helpers';
import { Plus, Edit, Bell, Copy, Sparkles, RefreshCw } from 'lucide-react';

const iconMap: Record<ActivityEvent['type'], typeof Plus> = {
  created: Plus,
  updated: Edit,
  reminder_set: Bell,
  draft_copied: Copy,
  context_generated: Sparkles,
  draft_status_changed: RefreshCw,
};

export function ActivityTimeline({ events }: { events: ActivityEvent[] }) {
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
          <div key={event.id} className="flex gap-3 py-2.5 relative">
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
          </div>
        );
      })}
    </div>
  );
}
