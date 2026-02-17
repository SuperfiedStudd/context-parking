import { useState } from 'react';
import { Project } from '@/types';
import { generateContextPrompt, estimateTokens } from '@/lib/helpers';
import { summarize, type SummarizeResponse } from '@/lib/ai/summarize';
import { isSetupComplete } from '@/lib/configStore';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Copy, X, Check, Sparkles, Loader2, AlertCircle, Clock, Cpu } from 'lucide-react';
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

  // AI summarization state
  const [summaryResult, setSummaryResult] = useState<SummarizeResponse | null>(null);
  const [summarizing, setSummarizing] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const prompt = generateContextPrompt(project, {
    includeAlternatives,
    includeDraft1,
    includeDraft2,
  });

  const charCount = prompt.length;
  const tokenEstimate = estimateTokens(prompt);
  const canSummarize = isSetupComplete();

  const handleCopy = async (text?: string) => {
    await navigator.clipboard.writeText(text ?? prompt);
    setCopied(true);
    addActivityEvent(project.id, {
      type: 'context_generated',
      description: 'Context prompt generated and copied',
    });
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSummarize = async () => {
    setSummarizing(true);
    setSummaryError(null);
    setSummaryResult(null);

    try {
      const result = await summarize(prompt);
      setSummaryResult(result);
      addActivityEvent(project.id, {
        type: 'context_generated',
        description: `AI summary generated via ${result.provider} (${result.latency_ms}ms)`,
      });
    } catch (err: any) {
      setSummaryError(err.message || 'Summarization failed');
    } finally {
      setSummarizing(false);
    }
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
          {/* Toggle controls */}
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

          {/* Raw prompt preview */}
          <div>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Raw Prompt</h3>
            <textarea
              readOnly
              value={prompt}
              className="w-full h-40 rounded-lg border bg-background p-3 text-xs font-mono resize-none focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
              <span>{charCount.toLocaleString()} chars</span>
              <span>~{tokenEstimate.toLocaleString()} tokens</span>
            </div>
          </div>

          {/* AI Summary section */}
          {canSummarize && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">AI Summary</h3>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1.5 text-xs"
                  onClick={handleSummarize}
                  disabled={summarizing}
                >
                  {summarizing ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3" />
                  )}
                  {summarizing ? 'Summarizing…' : 'Summarize'}
                </Button>
              </div>

              {summaryError && (
                <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>{summaryError}</span>
                </div>
              )}

              {summaryResult && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary" className="text-[10px] gap-1 font-normal">
                      <Cpu className="w-2.5 h-2.5" />
                      {summaryResult.provider} · {summaryResult.model}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px] gap-1 font-normal">
                      <Clock className="w-2.5 h-2.5" />
                      {summaryResult.latency_ms.toLocaleString()}ms
                    </Badge>
                    {summaryResult.usage?.input_tokens != null && (
                      <Badge variant="secondary" className="text-[10px] font-normal">
                        {summaryResult.usage.input_tokens}→{summaryResult.usage.output_tokens} tok
                      </Badge>
                    )}
                  </div>
                  <div className="rounded-lg border bg-background p-3 text-xs whitespace-pre-wrap max-h-64 overflow-y-auto">
                    {summaryResult.summary}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1 text-xs"
                    onClick={() => handleCopy(summaryResult.summary)}
                  >
                    <Copy className="w-3 h-3" /> Copy Summary
                  </Button>
                </div>
              )}

              {!summaryResult && !summaryError && !summarizing && (
                <p className="text-xs text-muted-foreground">
                  Click Summarize to generate a structured summary using your configured AI provider.
                </p>
              )}
            </div>
          )}

          {!canSummarize && (
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
              <Sparkles className="w-3.5 h-3.5 inline mr-1.5" />
              Configure an AI provider in Settings to enable AI summaries.
            </div>
          )}
        </div>

        <div className="p-4 border-t">
          <Button className="w-full gap-2" onClick={() => handleCopy()}>
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy Raw Prompt'}
          </Button>
        </div>
      </div>
    </div>
  );
}
