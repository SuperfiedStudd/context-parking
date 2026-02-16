import { useState } from 'react';
import { Project } from '@/types';
import { generateContextPrompt, estimateTokens } from '@/lib/helpers';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Copy, X, Check } from 'lucide-react';
import { toast } from 'sonner';

interface ContextPromptDrawerProps {
  project: Project;
  open: boolean;
  onClose: () => void;
}

export function ContextPromptDrawer({ project, open, onClose }: ContextPromptDrawerProps) {
  const addActivityEvent = useStore((s) => s.addActivityEvent);
  const [includeAlternatives, setIncludeAlternatives] = useState(true);
  const [includeDraft1, setIncludeDraft1] = useState(true);
  const [includeDraft2, setIncludeDraft2] = useState(!!project.drafts[1]);
  const [copied, setCopied] = useState(false);

  const prompt = generateContextPrompt(project, {
    includeAlternatives,
    includeDraft1,
    includeDraft2,
  });

  const charCount = prompt.length;
  const tokenEstimate = estimateTokens(prompt);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    addActivityEvent(project.id, {
      type: 'context_generated',
      description: 'Context prompt generated and copied',
    });
    toast.success('Context prompt copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-foreground/10" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-card border-l animate-slide-in-right flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold">Context Prompt</h2>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="space-y-3">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Include</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="alt" className="text-sm">Alternatives ({project.alternatives.length})</Label>
                <Switch id="alt" checked={includeAlternatives} onCheckedChange={setIncludeAlternatives} />
              </div>
              {project.drafts[0] && (
                <div className="flex items-center justify-between">
                  <Label htmlFor="d1" className="text-sm">Draft 1: {project.drafts[0].title}</Label>
                  <Switch id="d1" checked={includeDraft1} onCheckedChange={setIncludeDraft1} />
                </div>
              )}
              {project.drafts[1] && (
                <div className="flex items-center justify-between">
                  <Label htmlFor="d2" className="text-sm">Draft 2: {project.drafts[1].title}</Label>
                  <Switch id="d2" checked={includeDraft2} onCheckedChange={setIncludeDraft2} />
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Preview</h3>
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
