import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { Layout } from '@/components/Layout';
import { ActivityTimeline } from '@/components/ActivityTimeline';
import { ContextPromptDrawer } from '@/components/ContextPromptDrawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft, Sparkles, Copy, Check, CheckCircle, Send, Bell, Clock, Edit3,
} from 'lucide-react';
import { toast } from 'sonner';
import { relativeTime } from '@/lib/helpers';
import { DraftStatus } from '@/types';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { projects, updateProject, updateDraftStatus, updateDraftContent, addActivityEvent } = useStore();
  const project = projects.find((p) => p.id === id);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingObjective, setEditingObjective] = useState(false);
  const [editingNextAction, setEditingNextAction] = useState(false);
  const [objectiveValue, setObjectiveValue] = useState('');
  const [nextActionValue, setNextActionValue] = useState('');
  const objectiveRef = useRef<HTMLTextAreaElement>(null);
  const nextActionRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (project) {
      setObjectiveValue(project.objective);
      setNextActionValue(project.nextAction);
    }
  }, [project]);

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

  const saveObjective = () => {
    updateProject(project.id, { objective: objectiveValue });
    setEditingObjective(false);
    addActivityEvent(project.id, { type: 'updated', description: 'Objective updated' });
  };

  const saveNextAction = () => {
    updateProject(project.id, { nextAction: nextActionValue });
    setEditingNextAction(false);
    addActivityEvent(project.id, { type: 'updated', description: 'Next action updated' });
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

  return (
    <Layout>
      <div className="mb-4">
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={() => navigate('/projects')}>
          <ArrowLeft className="w-3.5 h-3.5" /> Projects
        </Button>
      </div>

      <div className="flex items-start justify-between mb-6">
        <h1 className="text-xl font-bold">{project.title}</h1>
        <Button className="gap-2" onClick={() => setDrawerOpen(true)}>
          <Sparkles className="w-4 h-4" /> Generate Context Prompt
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — Structured State */}
        <div className="lg:col-span-2 space-y-4">
          {/* Objective */}
          <div className="bg-card border rounded-lg p-4 card-shadow">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Objective</h3>
              {!editingObjective && (
                <button className="text-xs text-muted-foreground hover:text-foreground transition-smooth" onClick={() => { setEditingObjective(true); setTimeout(() => objectiveRef.current?.focus(), 50); }}>
                  Edit
                </button>
              )}
            </div>
            {editingObjective ? (
              <div>
                <textarea
                  ref={objectiveRef}
                  value={objectiveValue}
                  onChange={(e) => setObjectiveValue(e.target.value)}
                  className="w-full rounded-md border bg-background p-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                  rows={2}
                  onBlur={saveObjective}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveObjective(); } }}
                />
              </div>
            ) : (
              <p className="text-sm">{project.objective}</p>
            )}
          </div>

          {/* Chosen Direction */}
          <div className="bg-card border rounded-lg p-4 card-shadow">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Chosen Direction</h3>
            <p className="text-sm">{project.chosenDirection || <span className="text-muted-foreground italic">Not set</span>}</p>
          </div>

          {/* Alternatives */}
          {project.alternatives.length > 0 && (
            <div className="bg-card border rounded-lg p-4 card-shadow">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Alternatives</h3>
              <div className="space-y-2">
                {project.alternatives.map((a, i) => (
                  <div key={i} className="flex gap-2 items-start text-sm">
                    <span className="text-muted-foreground font-mono text-xs mt-0.5">{i + 1}.</span>
                    <span>{a}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

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
          <div className="bg-card border rounded-lg p-4 card-shadow">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Next Action</h3>
              {!editingNextAction && (
                <button className="text-xs text-muted-foreground hover:text-foreground transition-smooth" onClick={() => { setEditingNextAction(true); setTimeout(() => nextActionRef.current?.focus(), 50); }}>
                  Edit
                </button>
              )}
            </div>
            {editingNextAction ? (
              <input
                ref={nextActionRef}
                value={nextActionValue}
                onChange={(e) => setNextActionValue(e.target.value)}
                className="w-full rounded-md border bg-background p-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                onBlur={saveNextAction}
                onKeyDown={(e) => { if (e.key === 'Enter') saveNextAction(); }}
              />
            ) : (
              <p className="text-sm">{project.nextAction || <span className="text-muted-foreground italic">Not set</span>}</p>
            )}
          </div>
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
            <ActivityTimeline events={project.activityLog} />
          </div>
        </div>
      </div>

      <ContextPromptDrawer project={project} open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </Layout>
  );
}
