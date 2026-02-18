import { useState, useEffect } from 'react';
import { Project } from '@/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { BrainCircuit, ChevronDown, ChevronRight, Loader2, Trash2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { relativeTime } from '@/lib/helpers';
import { getSecondOpinion } from '@/lib/ai/secondOpinion';
import {
  fetchSecondOpinions,
  insertSecondOpinion,
  deleteSecondOpinion,
  type SecondOpinionRecord,
} from '@/lib/api/secondOpinions';
import { useStore } from '@/store/useStore';

interface ContextField {
  key: string;
  label: string;
  getValue: (p: Project, opinions: SecondOpinionRecord[]) => string | undefined;
}

const BASE_FIELDS: ContextField[] = [
  { key: 'executiveSnapshot', label: 'Executive Snapshot', getValue: (p) => p.executiveSnapshot },
  { key: 'objective', label: 'Objective', getValue: (p) => p.objective },
  { key: 'chosenDirection', label: 'Chosen Direction', getValue: (p) => p.chosenDirection },
  { key: 'strategicForks', label: 'Strategic Forks', getValue: (p) => p.strategicForks?.length ? p.strategicForks.join('\n') : undefined },
  { key: 'deferredDecisions', label: 'Deferred Decisions', getValue: (p) => p.deferredDecisions?.length ? p.deferredDecisions.join('\n') : undefined },
  { key: 'nextAction', label: 'Next Action', getValue: (p) => p.nextAction },
];

interface Props {
  project: Project;
}

export function SecondOpinionSection({ project }: Props) {
  const { addActivityEvent, deleteActivityEvent } = useStore();
  const [opinions, setOpinions] = useState<SecondOpinionRecord[]>([]);
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set(['executiveSnapshot', 'objective', 'chosenDirection', 'strategicForks', 'deferredDecisions', 'nextAction']));
  const [selectedOpinionIds, setSelectedOpinionIds] = useState<Set<string>>(new Set());
  const [instruction, setInstruction] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<{ opinionId: string; activityEventId?: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    setFetching(true);
    fetchSecondOpinions(project.id)
      .then((data) => { if (!cancelled) setOpinions(data); })
      .catch((err) => { if (!cancelled) console.error('Failed to load second opinions:', err); })
      .finally(() => { if (!cancelled) setFetching(false); });
    return () => { cancelled = true; };
  }, [project.id]);

  const toggleField = (key: string) => {
    setSelectedFields((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const toggleOpinion = (id: string) => {
    setSelectedOpinionIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const compileContext = (): string => {
    const sections: string[] = [];

    for (const field of BASE_FIELDS) {
      if (!selectedFields.has(field.key)) continue;
      const value = field.getValue(project, opinions);
      if (value?.trim()) {
        sections.push(`## ${field.label}\n${value}`);
      }
    }

    for (const op of opinions) {
      if (!selectedOpinionIds.has(op.id)) continue;
      sections.push(`## Previous Second Opinion (${op.ai_model} on ${op.ai_provider}, ${new Date(op.created_at).toLocaleString()})\n${op.instruction ? `**Instruction:** ${op.instruction}\n\n` : ''}${op.response}`);
    }

    return sections.join('\n\n---\n\n');
  };

  const handleRun = async () => {
    const compiled = compileContext();
    if (!compiled.trim()) {
      toast.error('Select at least one context field.');
      return;
    }

    setLoading(true);
    try {
      const result = await getSecondOpinion({
        compiledContext: compiled,
        instruction: instruction.trim() || undefined,
      });

      const record = await insertSecondOpinion({
        project_id: project.id,
        compiled_context: compiled,
        instruction: instruction.trim() || null,
        response: result.response,
        ai_provider: result.provider,
        ai_model: result.model,
      });

      setOpinions((prev) => [record, ...prev]);

      addActivityEvent(project.id, {
        type: 'second_opinion_generated',
        description: `Second opinion generated via ${result.model} on ${result.provider}`,
        secondOpinionId: record.id,
      });

      toast.success(`Second opinion generated (${result.model}, ${result.latency_ms}ms)`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate second opinion.');
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteSecondOpinion(deleteTarget.opinionId);
      setOpinions((prev) => prev.filter((o) => o.id !== deleteTarget.opinionId));

      // Find and remove the matching activity event
      const matchingEvent = project.activityLog.find(
        (e) => e.type === 'second_opinion_generated' && e.secondOpinionId === deleteTarget.opinionId
      );
      if (matchingEvent) {
        deleteActivityEvent(project.id, matchingEvent.id);
      }

      toast.success('Second opinion deleted');
    } catch (err: any) {
      toast.error('Failed to delete: ' + (err.message || 'Unknown error'));
    } finally {
      setDeleteTarget(null);
    }
  };

  const hasAnyContext = selectedFields.size > 0 || selectedOpinionIds.size > 0;

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Second Opinion</h3>

      {/* Context Selection */}
      <div className="bg-card border rounded-lg p-4 card-shadow space-y-3">
        <Label className="text-xs text-muted-foreground uppercase tracking-wide">Context to Include</Label>
        <div className="grid grid-cols-2 gap-2">
          {BASE_FIELDS.map((field) => {
            const value = field.getValue(project, opinions);
            const hasValue = !!value?.trim();
            return (
              <label
                key={field.key}
                className={`flex items-center gap-2 text-sm cursor-pointer ${!hasValue ? 'opacity-40' : ''}`}
              >
                <Checkbox
                  checked={selectedFields.has(field.key)}
                  onCheckedChange={() => toggleField(field.key)}
                  disabled={!hasValue}
                />
                {field.label}
              </label>
            );
          })}
        </div>

        {opinions.length > 0 && (
          <>
            <Label className="text-xs text-muted-foreground uppercase tracking-wide mt-3 block">
              Previous Second Opinions
            </Label>
            <div className="space-y-1">
              {opinions.map((op) => (
                <label key={op.id} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={selectedOpinionIds.has(op.id)}
                    onCheckedChange={() => toggleOpinion(op.id)}
                  />
                  <span className="truncate">
                    {op.ai_model} — {relativeTime(op.created_at)}
                    {op.instruction && <span className="text-muted-foreground ml-1">"{op.instruction.substring(0, 40)}…"</span>}
                  </span>
                </label>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Instruction */}
      <div className="bg-card border rounded-lg p-4 card-shadow space-y-2">
        <Label htmlFor="so-instruction" className="text-xs text-muted-foreground uppercase tracking-wide">
          What would you like AI to focus on?
        </Label>
        <Textarea
          id="so-instruction"
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder="e.g., Evaluate the risk of choosing direction A over B…"
          rows={3}
          className="resize-none"
        />
      </div>

      {/* Run Button */}
      <Button
        className="w-full gap-2"
        onClick={handleRun}
        disabled={loading || !hasAnyContext}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Generating…
          </>
        ) : (
          <>
            <BrainCircuit className="w-4 h-4" /> Get Second Opinion
          </>
        )}
      </Button>

      {/* Results */}
      {fetching ? (
        <div className="text-sm text-muted-foreground text-center py-4">Loading opinions…</div>
      ) : opinions.length > 0 ? (
        <div className="space-y-3">
          {opinions.map((op) => {
            const isExpanded = expandedIds.has(op.id);
            return (
              <div key={op.id} className="bg-card border rounded-lg card-shadow">
                <Collapsible open={isExpanded} onOpenChange={() => toggleExpanded(op.id)}>
                  <div className="flex items-center justify-between p-4">
                    <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-smooth cursor-pointer flex-1 text-left">
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      <BrainCircuit className="w-4 h-4 text-primary" />
                      <span>{op.ai_model}</span>
                      <Badge variant="secondary" className="text-xs font-normal">{op.ai_provider}</Badge>
                    </CollapsibleTrigger>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {relativeTime(op.created_at)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget({ opinionId: op.id }); }}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <CollapsibleContent>
                    <div className="px-4 pb-4 space-y-2">
                      {op.instruction && (
                        <div className="text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
                          <strong>Instruction:</strong> {op.instruction}
                        </div>
                      )}
                      <div className="text-sm bg-background rounded-md p-3 border whitespace-pre-wrap max-h-96 overflow-y-auto">
                        {op.response}
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            );
          })}
        </div>
      ) : null}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this Second Opinion?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently delete this AI response from the database. This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
