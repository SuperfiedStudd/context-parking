import { useState } from 'react';
import { Project } from '@/types';
import {
  compileContextInjectPrompt,
  estimateTokens,
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
if (typeof window !== 'undefined') {
  const guard = () => console.error('GUARD: AI invocation blocked from context inject');
  void guard;
}

interface ContextPromptDrawerProps {
  project: Project;
  open: boolean;
  onClose: () => void;
}

const TOGGLE_ITEMS: { key: keyof InjectPromptOptions; label: string; countFn?: (p: Project) => number }[] = [
  { key: 'includeObjective', label: 'Objective' },
  { key: 'includeDirection', label: 'Chosen Direction' },
  { key: 'includeAlternatives', label: 'Alternatives', countFn: (p) => p.alternatives.length },
  { key: 'includeNextAction', label: 'Next Action' },
  { key: 'includeActivity', label: 'Recent Activity', countFn: (p) => Math.min(p.activityLog.length, 3) },
  { key: 'includeStatus', label: 'Current Status' },
];

export function ContextPromptDrawer({ project, open, onClose }: ContextPromptDrawerProps) {
  const addActivityEvent = useStore((s) => s.addActivityEvent);
  const [copied, setCopied] = useState(false);
  const [options, setOptions] = useState<InjectPromptOptions>({ ...defaultInjectOptions });

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
              {TOGGLE_ITEMS.map(({ key, label, countFn }) => {
                const count = countFn ? countFn(project) : null;
                return (
                  <div key={key} className="flex items-center justify-between">
                    <Label htmlFor={key} className="text-sm">
                      {label}{count !== null ? ` (${count})` : ''}
                    </Label>
                    <Switch
                      id={key}
                      checked={options[key]}
                      onCheckedChange={() => toggleOption(key)}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Compiled prompt — single unified textarea */}
          <div>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Raw Prompt</h3>
            <textarea
              readOnly
              value={prompt}
              className="w-full h-64 rounded-lg border bg-background p-3 text-xs font-mono resize-none focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
              <span>{charCount.toLocaleString()} chars</span>
              <span>~{tokenEstimate.toLocaleString()} tokens</span>
            </div>
          </div>
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
