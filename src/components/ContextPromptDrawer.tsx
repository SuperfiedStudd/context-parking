import { useState } from 'react';
import { Project } from '@/types';
import {
  compileContextInjectPrompt,
  estimateTokens,
  relativeTime,
  defaultInjectOptions,
  type InjectPromptOptions,
} from '@/lib/helpers';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Copy, X, Check } from 'lucide-react';
import { toast } from 'sonner';

// GUARD: No AI imports allowed in this file.
// If any AI module is ever imported here, block and log.
if (typeof window !== 'undefined') {
  const guard = () => console.error('GUARD: AI invocation blocked from context inject');
  void guard;
}

interface ContextPromptDrawerProps {
  project: Project;
  open: boolean;
  onClose: () => void;
}

type ViewMode = 'structured' | 'raw';

const TOGGLE_ITEMS: { key: keyof InjectPromptOptions; label: string }[] = [
  { key: 'includeObjective', label: 'Objective' },
  { key: 'includeDirection', label: 'Chosen Direction' },
  { key: 'includeAlternatives', label: 'Alternatives' },
  { key: 'includeNextAction', label: 'Next Action' },
  { key: 'includeActivity', label: 'Recent Activity' },
  { key: 'includeStatus', label: 'Current Status' },
];

export function ContextPromptDrawer({ project, open, onClose }: ContextPromptDrawerProps) {
  const addActivityEvent = useStore((s) => s.addActivityEvent);
  const [copied, setCopied] = useState(false);
  const [options, setOptions] = useState<InjectPromptOptions>({ ...defaultInjectOptions });
  const [viewMode, setViewMode] = useState<ViewMode>('structured');

  const prompt = compileContextInjectPrompt(project, options);
  const charCount = prompt.length;
  const tokenEstimate = estimateTokens(prompt);

  const toggleOption = (key: keyof InjectPromptOptions) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    addActivityEvent(project.id, {
      type: 'context_generated',
      description: 'Context inject prompt compiled and copied',
    });
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-foreground/10" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-card border-l animate-slide-in-right flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold">Context Inject Prompt</h2>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Toggle controls */}
          <div className="space-y-3">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Include</h3>
            <div className="space-y-2">
              {TOGGLE_ITEMS.map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between">
                  <Label htmlFor={key} className="text-sm">{label}</Label>
                  <Switch
                    id={key}
                    checked={options[key]}
                    onCheckedChange={() => toggleOption(key)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* View mode toggle */}
          <div className="flex items-center gap-2">
            <button
              className={`text-xs px-2.5 py-1 rounded-md transition-colors ${viewMode === 'structured' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
              onClick={() => setViewMode('structured')}
            >
              Structured View
            </button>
            <button
              className={`text-xs px-2.5 py-1 rounded-md transition-colors ${viewMode === 'raw' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
              onClick={() => setViewMode('raw')}
            >
              Raw Prompt
            </button>
          </div>

          {/* Content */}
          {viewMode === 'raw' ? (
            <div>
              <textarea
                readOnly
                value={prompt}
                className="w-full h-72 rounded-lg border bg-background p-3 text-xs font-mono resize-none focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          ) : (
            <StructuredView project={project} options={options} />
          )}

          {/* Stats */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{charCount.toLocaleString()} chars</span>
            <span>~{tokenEstimate.toLocaleString()} tokens</span>
          </div>

          <p className="text-xs text-muted-foreground">
            Compiled deterministically from stored project data. No AI calls.
          </p>
        </div>

        <div className="p-4 border-t">
          <Button className="w-full gap-2" onClick={handleCopy}>
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy to Clipboard'}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ── Structured View sub-component ── */

function StructuredView({
  project,
  options,
}: {
  project: Project;
  options: InjectPromptOptions;
}) {
  const sectionClass = 'rounded-md border bg-background p-3 text-sm space-y-1';
  const labelClass = 'text-xs font-medium text-muted-foreground uppercase tracking-wide';

  return (
    <div className="space-y-3">
      <div className={sectionClass}>
        <p className={labelClass}>Project Title</p>
        <p>{project.title}</p>
      </div>

      {options.includeObjective && (
        <div className={sectionClass}>
          <p className={labelClass}>Objective</p>
          <p>{project.objective || 'Not set'}</p>
        </div>
      )}

      {options.includeDirection && (
        <div className={sectionClass}>
          <p className={labelClass}>Chosen Direction</p>
          <p>{project.chosenDirection || 'Not set'}</p>
        </div>
      )}

      {options.includeAlternatives && (
        <div className={sectionClass}>
          <p className={labelClass}>Alternatives Considered</p>
          {project.alternatives.length > 0 ? (
            <ol className="list-decimal list-inside space-y-0.5">
              {project.alternatives.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ol>
          ) : (
            <p className="text-muted-foreground italic">None</p>
          )}
        </div>
      )}

      {options.includeNextAction && (
        <div className={sectionClass}>
          <p className={labelClass}>Next Action</p>
          <p>{project.nextAction || 'Not set'}</p>
        </div>
      )}

      {options.includeActivity && (
        <div className={sectionClass}>
          <p className={labelClass}>Recent Activity</p>
          {project.activityLog.length > 0 ? (
            <ul className="space-y-0.5">
              {project.activityLog.slice(0, 3).map((e) => (
                <li key={e.id} className="text-xs">
                  – {e.description} ({relativeTime(e.timestamp)})
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground italic text-xs">No recent activity</p>
          )}
        </div>
      )}

      {options.includeStatus && (
        <div className={sectionClass}>
          <p className={labelClass}>Current Status</p>
          <p className="text-xs">Last active {relativeTime(project.lastActiveAt)}</p>
        </div>
      )}
    </div>
  );
}
