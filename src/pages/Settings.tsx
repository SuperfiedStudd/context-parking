import { Layout } from '@/components/Layout';
import { useStore } from '@/store/useStore';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Shield, Trash2, Puzzle, Copy } from 'lucide-react';

const EDGE_FUNCTION_URL = `https://sdjdzvcwfcdtngknrasp.supabase.co/functions/v1/capture-extension`;

export default function SettingsPage() {
  const { storeRawTranscripts, setStoreRawTranscripts, clearAllData } = useStore();
  const [confirmClear, setConfirmClear] = useState(false);

  const handleClear = () => {
    clearAllData();
    localStorage.removeItem('context-parking-store');
    setConfirmClear(false);
    toast.success('All local data cleared');
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(EDGE_FUNCTION_URL);
    toast.success('URL copied');
  };

  return (
    <Layout>
      <div className="max-w-xl mx-auto">
        <h1 className="text-xl font-bold mb-6">Settings</h1>

        <div className="space-y-6">
          {/* Extension Setup */}
          <div className="bg-card border rounded-lg p-4 card-shadow">
            <div className="flex items-center gap-2 mb-3">
              <Puzzle className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Browser Extension Setup</span>
            </div>
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Edge Function URL</Label>
                <div className="flex gap-2 mt-1">
                  <Input readOnly value={EDGE_FUNCTION_URL} className="text-xs font-mono" />
                  <Button size="sm" variant="secondary" onClick={copyUrl}>
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">Quick start:</p>
                <ol className="list-decimal list-inside space-y-0.5">
                  <li>Generate a key: <code className="bg-muted px-1 rounded">openssl rand -hex 32</code></li>
                  <li>Add it as <code className="bg-muted px-1 rounded">EXTENSION_SHARED_KEY</code> in Supabase Edge Function secrets</li>
                  <li>Load <code className="bg-muted px-1 rounded">browser-extension/</code> as an unpacked extension in Chrome</li>
                  <li>Enter the URL and key in the extension popup</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Store Raw Transcripts */}
          <div className="bg-card border rounded-lg p-4 card-shadow">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="transcripts" className="text-sm font-medium">Store Raw Transcripts</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Keep original chat transcripts with captures</p>
              </div>
              <Switch id="transcripts" checked={storeRawTranscripts} onCheckedChange={setStoreRawTranscripts} />
            </div>
          </div>

          {/* Privacy */}
          <div className="bg-card border rounded-lg p-4 card-shadow">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Privacy</span>
            </div>
            <p className="text-xs text-muted-foreground">
              No data is sent to any AI service unless you explicitly click an AI action button. All data is stored locally in your browser.
            </p>
          </div>

          {/* Clear Data */}
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
            <DialogHeader><DialogTitle>Clear all data?</DialogTitle></DialogHeader>
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
