import { Layout } from '@/components/Layout';
import { useStore } from '@/store/useStore';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Shield, Trash2 } from 'lucide-react';

export default function SettingsPage() {
  const { storeRawTranscripts, setStoreRawTranscripts, clearAllData } = useStore();
  const [confirmClear, setConfirmClear] = useState(false);

  const handleClear = () => {
    clearAllData();
    localStorage.removeItem('context-parking-store');
    setConfirmClear(false);
    toast.success('All local data cleared');
  };

  return (
    <Layout>
      <div className="max-w-xl mx-auto">
        <h1 className="text-xl font-bold mb-6">Settings</h1>

        <div className="space-y-6">
          <div className="bg-card border rounded-lg p-4 card-shadow">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="transcripts" className="text-sm font-medium">Store Raw Transcripts</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Keep original chat transcripts with captures</p>
              </div>
              <Switch id="transcripts" checked={storeRawTranscripts} onCheckedChange={setStoreRawTranscripts} />
            </div>
          </div>

          <div className="bg-card border rounded-lg p-4 card-shadow">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Privacy</span>
            </div>
            <p className="text-xs text-muted-foreground">
              No data is sent to any AI service unless you explicitly click an AI action button. All data is stored locally in your browser.
            </p>
          </div>

          <div className="bg-card border rounded-lg p-4 card-shadow">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium">Clear All Data</span>
                <p className="text-xs text-muted-foreground mt-0.5">Reset to seed data. This cannot be undone.</p>
              </div>
              <Button variant="destructive" size="sm" className="gap-1.5" onClick={() => setConfirmClear(true)}>
                <Trash2 className="w-3.5 h-3.5" /> Clear
              </Button>
            </div>
          </div>
        </div>

        <Dialog open={confirmClear} onOpenChange={setConfirmClear}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Clear all data?</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">This will reset all projects and captures to the default seed data.</p>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setConfirmClear(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleClear}>Clear Everything</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
