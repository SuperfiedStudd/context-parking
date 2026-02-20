import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { ArrowLeft, Archive, RotateCcw, Copy, Check, Trash2, X } from 'lucide-react';
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
          <Button variant="ghost" className="mt-4" onClick={() => navigate('/projects?tab=drafts')}>
            Back to Drafts
          </Button>
        </div>
      </Layout>
    );
  }

  const isArchived = !!draft.archivedAt;
  const charCount = content.length;

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

  const handleDiscard = () => {
    setTitle(draft.title);
    setRecipient(draft.recipient);
    setContent(draft.content);
    setDirty(false);
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
    navigate('/projects?tab=drafts');
  };

  const fieldChanged = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setter(e.target.value);
    setDirty(true);
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6 text-sm">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground hover:text-foreground -ml-2 px-2"
            onClick={() => navigate('/projects?tab=drafts')}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <button
            className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            onClick={() => navigate('/projects?tab=drafts')}
          >
            Drafts
          </button>
          <span className="text-muted-foreground">›</span>
          <span className="font-semibold text-foreground">Draft Detail</span>
        </div>

        {/* Card */}
        <div className="bg-card border rounded-xl shadow-sm">
          {/* Header: Title + Actions */}
          <div className="px-6 pt-6 pb-4 border-b">
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-xl font-bold text-foreground leading-tight pt-1">
                {title || 'Untitled Draft'}
              </h1>
              <div className="flex items-center gap-2 flex-shrink-0">
                {isArchived ? (
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={handleUnarchive}>
                    <RotateCcw className="w-3.5 h-3.5" /> Restore
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => setConfirmArchive(true)}
                  >
                    <Archive className="w-3.5 h-3.5" /> Archive
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </Button>
              </div>
            </div>
          </div>

          {isArchived && (
            <div className="bg-muted/60 flex items-center justify-center py-2 border-b">
              <span className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
                <Archive className="w-3 h-3" /> Archived — Restore to edit
              </span>
            </div>
          )}

          {/* Form Fields */}
          <div className="px-6 py-5 space-y-5">
            {/* Title Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-foreground">Title</label>
                <span className="text-xs text-muted-foreground">Updated {relativeTime(draft.updatedAt)}</span>
              </div>
              <input
                value={title}
                onChange={fieldChanged(setTitle)}
                disabled={isArchived}
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 disabled:opacity-60 transition-shadow"
                placeholder="Draft title"
              />
            </div>

            {/* Recipient Field */}
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Recipient</label>
              <input
                value={recipient}
                onChange={fieldChanged(setRecipient)}
                disabled={isArchived}
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 disabled:opacity-60 transition-shadow"
                placeholder="e.g. Sarah Davis, the team, hiring manager…"
              />
            </div>

            {/* Message Field */}
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Message</label>
              <textarea
                value={content}
                onChange={fieldChanged(setContent)}
                disabled={isArchived}
                rows={12}
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring/50 disabled:opacity-60 leading-relaxed transition-shadow"
                placeholder="Write your message here…"
              />
              <div className="flex justify-end mt-1">
                <span className="text-xs text-muted-foreground">{charCount} chars</span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t bg-muted/20 rounded-b-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={handleCopy}>
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={handleDiscard}
                disabled={!dirty}
              >
                <Trash2 className="w-3.5 h-3.5" /> Discard
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-muted-foreground"
                onClick={handleDiscard}
                disabled={!dirty}
              >
                <X className="w-3.5 h-3.5" /> Discard
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!dirty || isArchived}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Archive confirm */}
      <Dialog open={confirmArchive} onOpenChange={setConfirmArchive}>
        <DialogContent>
          <DialogHeader><DialogTitle>Archive this draft?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Archived drafts are hidden from the main view but can be restored later.</p>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setConfirmArchive(false)}>Cancel</Button>
            <Button variant="outline" onClick={handleArchive}>Archive</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete this draft?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This action cannot be undone. The draft will be permanently removed.</p>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setConfirmDelete(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete Draft</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
