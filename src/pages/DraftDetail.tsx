import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Archive, RotateCcw, Copy, Check, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { relativeTime } from '@/lib/helpers';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

export default function DraftDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { drafts, updateDraft, archiveDraft, unarchiveDraft, deleteDraft } = useStore();
  const draft = drafts.find((d) => d.id === id);

  const [title, setTitle] = useState(draft?.title ?? '');
  const [recipient, setRecipient] = useState(draft?.recipient ?? '');
  const [content, setContent] = useState(draft?.content ?? '');
  const [dirty, setDirty] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Sync local state when draft changes externally
  useEffect(() => {
    if (draft) {
      setTitle(draft.title);
      setRecipient(draft.recipient);
      setContent(draft.content);
      setDirty(false);
    }
  }, [draft?.id]);

  if (!draft) {
    return (
      <Layout>
        <div className="text-center py-16">
          <p className="text-muted-foreground">Draft not found.</p>
          <Button variant="ghost" className="mt-4" onClick={() => navigate('/projects')}>
            Back
          </Button>
        </div>
      </Layout>
    );
  }

  const isArchived = !!draft.archivedAt;

  const handleSave = () => {
    updateDraft(draft.id, { title, recipient, content });
    setDirty(false);
    toast.success('Draft saved');
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleArchive = () => {
    archiveDraft(draft.id);
    setConfirmArchive(false);
    toast.success('Draft archived');
    navigate('/projects?tab=drafts');
  };

  const handleUnarchive = () => {
    unarchiveDraft(draft.id);
    toast.success('Draft restored');
  };

  const handleDelete = () => {
    deleteDraft(draft.id);
    setConfirmDelete(false);
    toast.success('Draft deleted');
    navigate('/projects');
  };

  const fieldChanged = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setter(e.target.value);
    setDirty(true);
  };

  return (
    <Layout>
      <div className="mb-4 flex items-center justify-between">
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={() => navigate('/projects')}>
          <ArrowLeft className="w-3.5 h-3.5" /> Drafts
        </Button>
        <div className="flex items-center gap-2">
          {isArchived ? (
            <Button variant="secondary" size="sm" className="gap-1.5" onClick={handleUnarchive}>
              <RotateCcw className="w-3.5 h-3.5" /> Restore
            </Button>
          ) : (
            <Button variant="secondary" size="sm" className="gap-1.5" onClick={() => setConfirmArchive(true)}>
              <Archive className="w-3.5 h-3.5" /> Archive
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-destructive hover:text-destructive"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header info */}
        <div className="flex items-center gap-2">
          <Badge className="bg-accent/20 text-accent-foreground border-accent/20 text-xs">Draft</Badge>
          {isArchived && <Badge variant="secondary" className="gap-1 text-xs"><Archive className="w-3 h-3" /> Archived</Badge>}
          <span className="text-xs text-muted-foreground ml-auto">Updated {relativeTime(draft.updatedAt)}</span>
        </div>

        {/* Title */}
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">Title</label>
          <input
            value={title}
            onChange={fieldChanged(setTitle)}
            disabled={isArchived}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-60"
            placeholder="Draft title"
          />
        </div>

        {/* Recipient */}
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">Recipient</label>
          <input
            value={recipient}
            onChange={fieldChanged(setRecipient)}
            disabled={isArchived}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-60"
            placeholder="e.g. John, the team, hiring manager…"
          />
        </div>

        {/* Content */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Content</label>
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={handleCopy}>
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>
          <textarea
            value={content}
            onChange={fieldChanged(setContent)}
            disabled={isArchived}
            rows={16}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm font-mono resize-y focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-60 leading-relaxed"
            placeholder="Draft message content…"
          />
        </div>

        {/* Save */}
        {dirty && !isArchived && (
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setTitle(draft.title);
                setRecipient(draft.recipient);
                setContent(draft.content);
                setDirty(false);
              }}
            >
              Discard
            </Button>
            <Button size="sm" onClick={handleSave}>Save Changes</Button>
          </div>
        )}
      </div>

      {/* Archive confirm */}
      <Dialog open={confirmArchive} onOpenChange={setConfirmArchive}>
        <DialogContent>
          <DialogHeader><DialogTitle>Archive this draft?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Archived drafts can be restored from the Archived tab.</p>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setConfirmArchive(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleArchive}>Archive</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete this draft?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This cannot be undone.</p>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setConfirmDelete(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
