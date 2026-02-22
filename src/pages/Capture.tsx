import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Project, Draft, DbCapture } from '@/types';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { fetchCaptures, markCapturePromoted } from '@/lib/api/captures';
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
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, MessageSquare, Bot, ArrowRight, ChevronDown, ChevronRight, FolderOpen, Mail } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const generateId = () => Math.random().toString(36).substring(2, 10);

function parseCapture(instruction: string, transcript: string) {
  const result: Partial<Project> = {};
  const planMatch = instruction.match(/plan\s+(.+)/i);
  if (planMatch) result.chosenDirection = planMatch[1].trim();
  const altLines = transcript.match(/^\d+\.\s+.+$/gm);
  if (altLines) {
    result.strategicForks = altLines.slice(0, 3).map((l) => l.replace(/^\d+\.\s+/, '').trim());
  }
  return result;
}

export default function Capture() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { projects, addProject, updateProject, addCapture, addActivityEvent, addDraft } = useStore();
  const [chatId, setChatId] = useState('');
  const [transcript, setTranscript] = useState('');
  const [instruction, setInstruction] = useState('');
  const [preview, setPreview] = useState<ReturnType<typeof parseCapture> | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [conflictModal, setConflictModal] = useState(false);
  const [existingProject, setExistingProject] = useState<Project | null>(null);

  const { data: dbCaptures = [], isLoading: capturesLoading } = useQuery({
    queryKey: ['db-captures'],
    queryFn: fetchCaptures,
    refetchInterval: 30000,
  });

  const handleCapture = () => {
    if (!chatId || !transcript || !instruction) {
      toast.error('All fields are required');
      return;
    }
    const parsed = parseCapture(instruction, transcript);
    setPreview(parsed);
    const existing = projects.find((p) => p.title.toLowerCase().includes(chatId.toLowerCase()));
    if (existing) {
      setExistingProject(existing);
      setConflictModal(true);
      return;
    }
    setShowPreview(true);
  };

  const applyAsNew = () => {
    const parsed = preview || parseCapture(instruction, transcript);
    const newProject: Project = {
      id: generateId(),
      title: chatId,
      objective: instruction,
      chosenDirection: parsed.chosenDirection || '',
      strategicForks: parsed.strategicForks || [],
      deferredDecisions: [],
      nextAction: '',
      lastActiveAt: new Date().toISOString(),
      activityLog: [{ id: generateId(), type: 'created', description: 'Project created from capture', timestamp: new Date().toISOString() }],
    };
    addProject(newProject);
    addCapture({ chatId, transcript, instruction, createdAt: new Date().toISOString(), resolvedToProjectId: newProject.id });
    toast.success('Capture applied — new project created');
    navigate(`/projects/${newProject.id}`);
  };

  const applyToExisting = () => {
    if (!existingProject || !preview) return;
    const updates: Partial<Project> = {};
    if (preview.chosenDirection) updates.chosenDirection = preview.chosenDirection;
    if (preview.strategicForks) updates.strategicForks = preview.strategicForks;
    updateProject(existingProject.id, updates);
    addActivityEvent(existingProject.id, { type: 'updated', description: 'Updated from capture' });
    toast.success('Capture applied to existing project');
    setConflictModal(false);
    navigate(`/projects/${existingProject.id}`);
  };

  // Promote a DB capture — routes to Project or Draft based on capture_type
  const promoteCapture = async (cap: DbCapture) => {
    console.log('[promoteCapture] capture_type:', cap.capture_type, '| chat_title:', cap.chat_title);
    console.log('[promoteCapture] store.drafts BEFORE:', useStore.getState().drafts.length);
    console.log('[promoteCapture] store.projects BEFORE:', useStore.getState().projects.length);

    if (cap.capture_type === 'draft') {
      console.log('[promoteCapture] → DRAFT branch');
      // Create standalone Draft entity
      const now = new Date().toISOString();
      const newDraft: Draft = {
        id: generateId(),
        title: cap.chat_title || 'Untitled Draft',
        content: cap.chosen_direction || cap.summary || '',
        recipient: cap.draft_recipient || '',
        createdAt: now,
        updatedAt: now,
      };
      addDraft(newDraft);
      console.log('[promoteCapture] store.drafts AFTER addDraft:', useStore.getState().drafts.length);
      try {
        await markCapturePromoted(cap.id);
        queryClient.invalidateQueries({ queryKey: ['db-captures'] });
      } catch (e) {
        console.error('Failed to mark capture promoted:', e);
      }
      // Ensure we land on drafts tab if user goes back
      useStore.getState().setFilter('drafts');
      toast.success('Draft promoted');
      navigate(`/drafts/${newDraft.id}`);
    } else {
      console.log('[promoteCapture] → PROJECT branch');
      // Create standalone Project entity
      const newProject: Project = {
        id: generateId(),
        title: cap.chat_title || 'Untitled Capture',
        objective: cap.objective || '',
        chosenDirection: cap.chosen_direction || '',
        strategicForks: cap.strategic_forks || [],
        deferredDecisions: cap.deferred_decisions || [],
        executiveSnapshot: cap.executive_snapshot || '',
        nextAction: cap.next_action || '',
        lastActiveAt: new Date().toISOString(),
        activityLog: [{
          id: generateId(),
          type: 'created',
          description: `Promoted from ${cap.source} capture${cap.ai_provider && cap.ai_model ? ` (via ${cap.ai_model} on ${cap.ai_provider})` : ''}`,
          timestamp: new Date().toISOString(),
        }],
      };
      addProject(newProject);
      console.log('[promoteCapture] store.projects AFTER addProject:', useStore.getState().projects.length);
      try {
        await markCapturePromoted(cap.id);
        queryClient.invalidateQueries({ queryKey: ['db-captures'] });
      } catch (e) {
        console.error('Failed to mark capture promoted:', e);
      }
      toast.success('Capture promoted to project');
      navigate(`/projects/${newProject.id}`);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        {/* New Capture form hidden — page loads directly into Recent Captures */}

        {/* Recent DB Captures */}
        <div className="mt-10">
          <h2 className="text-lg font-semibold mb-3">Recent Captures</h2>
          {capturesLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : dbCaptures.length === 0 ? (
            <p className="text-sm text-muted-foreground">No captures yet. Use the browser extension to capture conversations.</p>
          ) : (
            <div className="space-y-3">
              {dbCaptures.map((cap) => (
                <CaptureCard key={cap.id} cap={cap} onPromote={promoteCapture} />
              ))}
            </div>
          )}
        </div>

        {/* Preview modal */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent>
            <DialogHeader><DialogTitle>Capture Preview</DialogTitle></DialogHeader>
            <div className="space-y-3 text-sm">
              <div><span className="font-medium">Chat ID:</span> {chatId}</div>
              {preview?.chosenDirection && <div><span className="font-medium">Chosen Direction:</span> {preview.chosenDirection}</div>}
              {preview?.strategicForks && preview.strategicForks.length > 0 && (
                <div>
                  <span className="font-medium">Strategic Forks:</span>
                  <ul className="list-disc list-inside mt-1">{preview.strategicForks.map((f, i) => <li key={i}>{f}</li>)}</ul>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setShowPreview(false)}>Cancel</Button>
              <Button onClick={() => { setShowPreview(false); applyAsNew(); }}>Create Project</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Conflict modal */}
        <Dialog open={conflictModal} onOpenChange={setConflictModal}>
          <DialogContent>
            <DialogHeader><DialogTitle>Existing project found</DialogTitle></DialogHeader>
            <p className="text-sm text-muted-foreground">A project similar to "{chatId}" already exists: <strong>{existingProject?.title}</strong></p>
            <DialogFooter>
              <Button variant="secondary" onClick={() => { setConflictModal(false); setShowPreview(true); }}>Create New</Button>
              <Button onClick={applyToExisting}>Update Existing</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}

function CaptureCard({ cap, onPromote }: { cap: DbCapture; onPromote: (cap: DbCapture) => void }) {
  const [reconstructionOpen, setReconstructionOpen] = useState(false);
  const hasSnapshot = cap.executive_snapshot && cap.executive_snapshot.trim().length > 0;
  const hasReconstruction = cap.chosen_direction && cap.chosen_direction.trim().length > 0;
  const isDraft = cap.capture_type === 'draft';

  return (
    <Card className="card-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            {isDraft ? (
              <Mail className="w-4 h-4 text-accent-foreground shrink-0" />
            ) : cap.source === 'chatgpt' ? (
              <Bot className="w-4 h-4 text-primary shrink-0" />
            ) : (
              <MessageSquare className="w-4 h-4 text-accent shrink-0" />
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium truncate">{cap.chat_title}</p>
                {isDraft && (
                  <Badge className="text-xs px-1.5 py-0 bg-accent/20 text-accent-foreground border-accent/20 flex-shrink-0">
                    Draft
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {cap.source} · {formatDistanceToNow(new Date(cap.created_at), { addSuffix: true })}
                {isDraft && cap.draft_recipient ? ` · To: ${cap.draft_recipient}` : ''}
              </p>
            </div>
          </div>
          <Button size="sm" variant="secondary" className="shrink-0 gap-1" onClick={() => onPromote(cap)}>
            <ArrowRight className="w-3.5 h-3.5" />
            {isDraft ? 'Create Draft' : 'Promote'}
          </Button>
        </div>

        {/* Snapshot or summary */}
        {hasSnapshot && !isDraft ? (
          <div className="mt-3">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Executive Snapshot</h4>
            <pre className="text-xs bg-background rounded-md p-2.5 whitespace-pre-wrap font-sans border">{cap.executive_snapshot}</pre>
          </div>
        ) : cap.summary ? (
          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{cap.summary}</p>
        ) : null}

        {/* Full content — collapsible */}
        {hasReconstruction && (
          <Collapsible open={reconstructionOpen} onOpenChange={setReconstructionOpen} className="mt-2">
            <CollapsibleTrigger className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
              {reconstructionOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              {isDraft ? 'Draft Content' : 'Full Memory Reconstruction'}
            </CollapsibleTrigger>
            <CollapsibleContent>
              <pre className="text-xs bg-background rounded-md p-2.5 whitespace-pre-wrap font-sans border mt-1.5 max-h-60 overflow-y-auto">{cap.chosen_direction}</pre>
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
}
