import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { Layout } from '@/components/Layout';
import { ActivityTimeline } from '@/components/ActivityTimeline';
import { SecondOpinionSection } from '@/components/SecondOpinionSection';
import { ContextPromptDrawer } from '@/components/ContextPromptDrawer';
import { Button } from '@/components/ui/button';
import { deleteSecondOpinion } from '@/lib/api/secondOpinions';
import { Badge } from '@/components/ui/badge';
import { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft, FileText, Copy, Check, CheckCircle, Send, Bell, Clock, Edit3, Archive, RotateCcw, Plus, X, Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { relativeTime } from '@/lib/helpers';
import { DraftStatus } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

// Reusable editable text section
function EditableSection({
  label,
  value,
  onSave,
  multiline = false,
  placeholder = 'Not set',
}: {
  label: string;
  value: string;
  onSave: (newValue: string) => void;
  multiline?: boolean;
  placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const ref = useRef<HTMLTextAreaElement | HTMLInputElement>(null);

  useEffect(() => { setEditValue(value); }, [value]);

  const save = () => {
    if (editValue !== value) onSave(editValue);
    setEditing(false);
  };

  return (
    <div className="bg-card border rounded-lg p-4 card-shadow">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</h3>
        {!editing && (
          <button
            className="text-xs text-muted-foreground hover:text-foreground transition-smooth"
            onClick={() => { setEditing(true); setTimeout(() => ref.current?.focus(), 50); }}
          >
            Edit
          </button>
        )}
      </div>
      {editing ? (
        multiline ? (
          <textarea
            ref={ref as React.RefObject<HTMLTextAreaElement>}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-full rounded-md border bg-background p-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
            rows={3}
            onBlur={save}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); save(); } }}
          />
        ) : (
          <input
            ref={ref as React.RefObject<HTMLInputElement>}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-full rounded-md border bg-background p-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            onBlur={save}
            onKeyDown={(e) => { if (e.key === 'Enter') save(); }}
          />
        )
      ) : (
        <p className="text-sm">{value || <span className="text-muted-foreground italic">{placeholder}</span>}</p>
      )}
    </div>
  );
}

// Editable list section (for strategic forks, deferred decisions)
function EditableListSection({
  label,
  items,
  onSave,
}: {
  label: string;
  items: string[];
  onSave: (newItems: string[]) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editItems, setEditItems] = useState(items);
  const [newItem, setNewItem] = useState('');

  useEffect(() => { setEditItems(items); }, [items]);

  const save = () => {
    const filtered = editItems.filter((i) => i.trim());
    if (JSON.stringify(filtered) !== JSON.stringify(items)) onSave(filtered);
    setEditing(false);
  };

  const addItem = () => {
    if (newItem.trim()) {
      setEditItems([...editItems, newItem.trim()]);
      setNewItem('');
    }
  };

  const removeItem = (idx: number) => {
    setEditItems(editItems.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, val: string) => {
    setEditItems(editItems.map((item, i) => (i === idx ? val : item)));
  };

  return (
    <div className="bg-card border rounded-lg p-4 card-shadow">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</h3>
        {!editing ? (
          <button
            className="text-xs text-muted-foreground hover:text-foreground transition-smooth"
            onClick={() => setEditing(true)}
          >
            Edit
          </button>
        ) : (
          <button
            className="text-xs text-primary hover:text-primary/80 font-medium transition-smooth"
            onClick={save}
          >
            Done
          </button>
        )}
      </div>
      {editing ? (
        <div className="space-y-2">
          {editItems.map((item, i) => (
            <div key={i} className="flex gap-2 items-center">
              <span className="text-muted-foreground font-mono text-xs">{i + 1}.</span>
              <input
                value={item}
                onChange={(e) => updateItem(i, e.target.value)}
                className="flex-1 rounded-md border bg-background p-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <button onClick={() => removeItem(i)} className="text-muted-foreground hover:text-destructive">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          <div className="flex gap-2 items-center">
            <input
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              placeholder="Add new…"
              className="flex-1 rounded-md border bg-background p-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              onKeyDown={(e) => { if (e.key === 'Enter') addItem(); }}
            />
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={addItem} disabled={!newItem.trim()}>
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      ) : items.length > 0 ? (
        <div className="space-y-2">
          {items.map((f, i) => (
            <div key={i} className="flex gap-2 items-start text-sm">
              <span className="text-muted-foreground font-mono text-xs mt-0.5">{i + 1}.</span>
              <span>{f}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground italic">None</p>
      )}
    </div>
  );
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { projects, updateProject, updateDraftStatus, addActivityEvent, deleteActivityEvent, archiveProject, reactivateProject } = useStore();
  const project = projects.find((p) => p.id === id);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [confirmDeleteEvent, setConfirmDeleteEvent] = useState<{ eventId: string; secondOpinionId?: string } | null>(null);

  if (!project) {
    return (
      <Layout>
        <div className="text-center py-16">
          <p className="text-muted-foreground">Project not found.</p>
          <Button variant="ghost" className="mt-4" onClick={() => navigate('/projects')}>
            Back to Projects
          </Button>
        </div>
      </Layout>
    );
  }

  const isArchived = project.status === 'archived';

  const editField = (fieldName: string, fieldLabel: string, newValue: any, previousValue?: string) => {
    updateProject(project.id, { [fieldName]: newValue });
    addActivityEvent(project.id, {
      type: 'field_edited',
      description: `${fieldLabel} edited`,
      fieldName,
      previousValue: previousValue?.substring(0, 200),
    });
  };

  const copyDraft = async (content: string) => {
    await navigator.clipboard.writeText(content);
    toast.success('Draft copied');
    addActivityEvent(project.id, { type: 'draft_copied', description: 'Draft copied to clipboard' });
  };

  const statusIcon = (s: DraftStatus) => {
    if (s === 'Ready') return <CheckCircle className="w-3 h-3" />;
    if (s === 'Sent') return <Send className="w-3 h-3" />;
    return <Edit3 className="w-3 h-3" />;
  };

  const statusColor = (s: DraftStatus) => {
    if (s === 'Ready') return 'bg-accent/30 text-accent-foreground border-accent/30';
    if (s === 'Sent') return 'bg-primary/15 text-primary border-primary/20';
    return 'bg-muted text-muted-foreground';
  };

  const cycleDraftStatus = (draftId: string, current: DraftStatus) => {
    const next: DraftStatus = current === 'Draft' ? 'Ready' : current === 'Ready' ? 'Sent' : 'Draft';
    updateDraftStatus(project.id, draftId, next);
  };

  const handleDeleteEvent = (eventId: string) => {
    const event = project.activityLog.find((e) => e.id === eventId);
    if (event?.type === 'second_opinion_generated' && event.secondOpinionId) {
      setConfirmDeleteEvent({ eventId, secondOpinionId: event.secondOpinionId });
    } else {
      deleteActivityEvent(project.id, eventId);
      toast.success('Activity entry removed');
    }
  };

  const confirmDeleteActivityEvent = async () => {
    if (!confirmDeleteEvent) return;
    try {
      if (confirmDeleteEvent.secondOpinionId) {
        await deleteSecondOpinion(confirmDeleteEvent.secondOpinionId);
      }
      deleteActivityEvent(project.id, confirmDeleteEvent.eventId);
      toast.success('Activity entry and AI response deleted');
    } catch (err: any) {
      toast.error('Failed to delete: ' + (err.message || 'Unknown error'));
    } finally {
      setConfirmDeleteEvent(null);
    }
  };

  const handleArchive = () => {
    archiveProject(project.id);
    setConfirmArchive(false);
    toast.success('Project archived');
  };

  const handleReactivate = () => {
    reactivateProject(project.id);
    toast.success('Project reactivated');
  };

  return (
    <Layout>
      <div className="mb-4">
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={() => navigate('/projects')}>
          <ArrowLeft className="w-3.5 h-3.5" /> Projects
        </Button>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold">{project.title}</h1>
          {isArchived && (
            <Badge variant="secondary" className="gap-1">
              <Archive className="w-3 h-3" /> Archived
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isArchived ? (
            <Button variant="secondary" className="gap-2" onClick={handleReactivate}>
              <RotateCcw className="w-4 h-4" /> Reactivate
            </Button>
          ) : (
            <Button variant="secondary" className="gap-2" onClick={() => setConfirmArchive(true)}>
              <Archive className="w-4 h-4" /> Archive
            </Button>
          )}
          <Button className="gap-2" onClick={() => setDrawerOpen(true)}>
            <FileText className="w-4 h-4" /> Compile Context Inject Prompt
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — Structured State */}
        <div className="lg:col-span-2 space-y-4">
          {/* Executive Snapshot */}
          <EditableSection
            label="Executive Snapshot"
            value={project.executiveSnapshot || ''}
            onSave={(v) => editField('executiveSnapshot', 'Executive Snapshot', v, project.executiveSnapshot)}
            multiline
            placeholder="No snapshot"
          />

          {/* Objective */}
          <EditableSection
            label="Objective"
            value={project.objective}
            onSave={(v) => editField('objective', 'Objective', v, project.objective)}
            multiline
          />

          {/* Chosen Direction */}
          <EditableSection
            label="Chosen Direction"
            value={project.chosenDirection}
            onSave={(v) => editField('chosenDirection', 'Chosen Direction', v, project.chosenDirection)}
            multiline
          />

          {/* Strategic Forks */}
          <EditableListSection
            label="Strategic Forks"
            items={project.strategicForks || []}
            onSave={(v) => editField('strategicForks', 'Strategic Forks', v, (project.strategicForks || []).join('; '))}
          />

          {/* Deferred Decisions */}
          <EditableListSection
            label="Deferred Decisions"
            items={project.deferredDecisions || []}
            onSave={(v) => editField('deferredDecisions', 'Deferred Decisions', v, (project.deferredDecisions || []).join('; '))}
          />

          {/* Drafts */}
          {project.drafts.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Drafts</h3>
              {project.drafts.map((draft) => (
                <div key={draft.id} className="bg-card border rounded-lg p-4 card-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium">{draft.title}</h4>
                      <Badge
                        className={`text-xs gap-1 cursor-pointer ${statusColor(draft.status)}`}
                        onClick={() => cycleDraftStatus(draft.id, draft.status)}
                      >
                        {statusIcon(draft.status)} {draft.status}
                      </Badge>
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => copyDraft(draft.content)}>
                      <Copy className="w-3 h-3" /> Copy
                    </Button>
                  </div>
                  <pre className="text-xs bg-background rounded-md p-3 whitespace-pre-wrap font-sans border max-h-40 overflow-y-auto">
                    {draft.content}
                  </pre>
                  {draft.reminderAt && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-primary">
                      <Bell className="w-3 h-3" /> Reminder {relativeTime(draft.reminderAt)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Next Action */}
          <EditableSection
            label="Next Action"
            value={project.nextAction}
            onSave={(v) => editField('nextAction', 'Next Action', v, project.nextAction)}
          />

          {/* Second Opinion */}
          {!isArchived && <SecondOpinionSection project={project} />}
        </div>

        {/* Right — Activity */}
        <div>
          <div className="bg-card border rounded-lg p-4 card-shadow sticky top-20">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Activity</h3>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" /> {relativeTime(project.lastActiveAt)}
              </span>
            </div>
            <ActivityTimeline events={project.activityLog} onDeleteEvent={handleDeleteEvent} />
          </div>
        </div>
      </div>

      {/* Archive confirm dialog */}
      <Dialog open={confirmArchive} onOpenChange={setConfirmArchive}>
        <DialogContent>
          <DialogHeader><DialogTitle>Archive this project?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Archived projects are hidden from the main view but can be reactivated later.</p>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setConfirmArchive(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleArchive}>Archive</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete second opinion activity confirm dialog */}
      <Dialog open={!!confirmDeleteEvent} onOpenChange={(open) => { if (!open) setConfirmDeleteEvent(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete this activity entry?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This will permanently delete this AI response from the database. This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setConfirmDeleteEvent(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDeleteActivityEvent}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ContextPromptDrawer project={project} open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </Layout>
  );
}
