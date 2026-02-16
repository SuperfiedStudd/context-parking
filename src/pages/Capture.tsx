import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Project, DbCapture } from '@/types';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { fetchCaptures } from '@/lib/api/captures';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, MessageSquare, Bot, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const generateId = () => Math.random().toString(36).substring(2, 10);

function parseCapture(instruction: string, transcript: string) {
  const result: Partial<Project> = {};
  const planMatch = instruction.match(/plan\s+(.+)/i);
  if (planMatch) result.chosenDirection = planMatch[1].trim();
  const now = Date.now();
  if (/remind me tomorrow/i.test(instruction)) {
    result.reminderAt = new Date(now + 86400000).toISOString();
  }
  const daysMatch = instruction.match(/in\s+(\d+)\s+days?/i);
  if (daysMatch) {
    result.reminderAt = new Date(now + parseInt(daysMatch[1]) * 86400000).toISOString();
  }
  const altLines = transcript.match(/^\d+\.\s+.+$/gm);
  if (altLines) {
    result.alternatives = altLines.slice(0, 3).map((l) => l.replace(/^\d+\.\s+/, '').trim());
  }
  return result;
}

export default function Capture() {
  const navigate = useNavigate();
  const { projects, addProject, updateProject, addCapture, addActivityEvent } = useStore();
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
      alternatives: parsed.alternatives || [],
      drafts: [],
      nextAction: '',
      lastActiveAt: new Date().toISOString(),
      reminderAt: parsed.reminderAt,
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
    if (preview.alternatives) updates.alternatives = preview.alternatives;
    if (preview.reminderAt) updates.reminderAt = preview.reminderAt;
    updateProject(existingProject.id, updates);
    addActivityEvent(existingProject.id, { type: 'updated', description: 'Updated from capture' });
    toast.success('Capture applied to existing project');
    setConflictModal(false);
    navigate(`/projects/${existingProject.id}`);
  };

  const promoteCapture = (cap: DbCapture) => {
    const newProject: Project = {
      id: generateId(),
      title: cap.chat_title || 'Untitled Capture',
      objective: cap.objective || '',
      chosenDirection: cap.chosen_direction || '',
      alternatives: cap.alternatives || [],
      drafts: [],
      nextAction: cap.next_action || '',
      lastActiveAt: new Date().toISOString(),
      activityLog: [{ id: generateId(), type: 'created', description: `Promoted from ${cap.source} capture`, timestamp: new Date().toISOString() }],
    };
    addProject(newProject);
    toast.success('Capture promoted to project');
    navigate(`/projects/${newProject.id}`);
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-xl font-bold mb-1">New Capture</h1>
        <p className="text-sm text-muted-foreground mb-6">Paste a chat transcript and instruction to extract context.</p>

        <div className="space-y-4">
          <div>
            <Label htmlFor="chatId" className="text-sm font-medium">Chat / Session ID</Label>
            <Input id="chatId" value={chatId} onChange={(e) => setChatId(e.target.value)} placeholder="e.g., square-apm-research" className="mt-1" />
          </div>
          <div>
            <Label htmlFor="transcript" className="text-sm font-medium">Transcript</Label>
            <Textarea id="transcript" value={transcript} onChange={(e) => setTranscript(e.target.value)} placeholder="Paste chat transcript here..." className="mt-1 min-h-[160px] font-mono text-xs" />
          </div>
          <div>
            <Label htmlFor="instruction" className="text-sm font-medium">Instruction</Label>
            <Input id="instruction" value={instruction} onChange={(e) => setInstruction(e.target.value)} placeholder='e.g., "plan observability-first approach, remind me in 3 days"' className="mt-1" />
          </div>
          <Button className="w-full gap-2" onClick={handleCapture}>
            <Upload className="w-4 h-4" /> Capture
          </Button>
        </div>

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
                <Card key={cap.id} className="card-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        {cap.source === 'chatgpt' ? (
                          <Bot className="w-4 h-4 text-primary shrink-0" />
                        ) : (
                          <MessageSquare className="w-4 h-4 text-accent shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{cap.chat_title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {cap.source} · {formatDistanceToNow(new Date(cap.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      <Button size="sm" variant="secondary" className="shrink-0 gap-1" onClick={() => promoteCapture(cap)}>
                        <ArrowRight className="w-3.5 h-3.5" /> Promote
                      </Button>
                    </div>
                    {cap.summary && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{cap.summary}</p>
                    )}
                  </CardContent>
                </Card>
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
              {preview?.alternatives && preview.alternatives.length > 0 && (
                <div>
                  <span className="font-medium">Alternatives:</span>
                  <ul className="list-disc list-inside mt-1">{preview.alternatives.map((a, i) => <li key={i}>{a}</li>)}</ul>
                </div>
              )}
              {preview?.reminderAt && <div><span className="font-medium">Reminder:</span> {new Date(preview.reminderAt).toLocaleDateString()}</div>}
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
