import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CaptureEvent, Project, Draft } from '@/types';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Upload, Eye } from 'lucide-react';

const generateId = () => Math.random().toString(36).substring(2, 10);

function parseCapture(instruction: string, transcript: string) {
  const result: Partial<Project> = {};

  // "plan X" → chosenDirection
  const planMatch = instruction.match(/plan\s+(.+)/i);
  if (planMatch) result.chosenDirection = planMatch[1].trim();

  // "remind me tomorrow" or "in 3 days"
  const now = Date.now();
  if (/remind me tomorrow/i.test(instruction)) {
    result.reminderAt = new Date(now + 86400000).toISOString();
  }
  const daysMatch = instruction.match(/in\s+(\d+)\s+days?/i);
  if (daysMatch) {
    result.reminderAt = new Date(now + parseInt(daysMatch[1]) * 86400000).toISOString();
  }

  // Lines starting with 1. 2. 3. → alternatives
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

  const handleCapture = () => {
    if (!chatId || !transcript || !instruction) {
      toast.error('All fields are required');
      return;
    }

    const parsed = parseCapture(instruction, transcript);
    setPreview(parsed);

    // Check for existing capture with same chatId
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
      activityLog: [
        {
          id: generateId(),
          type: 'created',
          description: 'Project created from capture',
          timestamp: new Date().toISOString(),
        },
      ],
    };

    addProject(newProject);
    addCapture({
      chatId,
      transcript,
      instruction,
      createdAt: new Date().toISOString(),
      resolvedToProjectId: newProject.id,
    });

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

        {/* Preview modal */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Capture Preview</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium">Chat ID:</span> {chatId}
              </div>
              {preview?.chosenDirection && (
                <div>
                  <span className="font-medium">Chosen Direction:</span> {preview.chosenDirection}
                </div>
              )}
              {preview?.alternatives && preview.alternatives.length > 0 && (
                <div>
                  <span className="font-medium">Alternatives:</span>
                  <ul className="list-disc list-inside mt-1">
                    {preview.alternatives.map((a, i) => <li key={i}>{a}</li>)}
                  </ul>
                </div>
              )}
              {preview?.reminderAt && (
                <div>
                  <span className="font-medium">Reminder:</span> {new Date(preview.reminderAt).toLocaleDateString()}
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
            <DialogHeader>
              <DialogTitle>Existing project found</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              A project similar to "{chatId}" already exists: <strong>{existingProject?.title}</strong>
            </p>
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
