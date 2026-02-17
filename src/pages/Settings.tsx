import { Layout } from '@/components/Layout';
import { SystemStatusPanel } from '@/components/SystemStatusPanel';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Shield, Trash2, Puzzle, Copy, Settings, Database, Sparkles, Eye, EyeOff, RotateCcw } from 'lucide-react';
import {
  getConfig,
  setConfig,
  clearConfig,
  maskKey,
  getEnabledProviders,
  PROVIDER_LABELS,
  type AiProvider,
  type CpConfig,
} from '@/lib/configStore';

const EDGE_FUNCTION_URL = `https://sdjdzvcwfcdtngknrasp.supabase.co/functions/v1/capture-extension`;

interface SettingsPageProps {
  onOpenWizard?: () => void;
}

export default function SettingsPage({ onOpenWizard }: SettingsPageProps) {
  const { storeRawTranscripts, setStoreRawTranscripts, clearAllData } = useStore();
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const config = getConfig();

  // Editable AI keys
  const [editingKey, setEditingKey] = useState<AiProvider | null>(null);
  const [editKeyValue, setEditKeyValue] = useState('');
  const [showEditKey, setShowEditKey] = useState(false);

  const handleClear = () => {
    clearAllData();
    localStorage.removeItem('context-parking-store');
    setConfirmClear(false);
    toast.success('All local data cleared');
  };

  const handleResetConfig = () => {
    clearConfig();
    setConfirmReset(false);
    toast.success('Configuration cleared. Reloading…');
    setTimeout(() => window.location.reload(), 500);
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(EDGE_FUNCTION_URL);
    toast.success('URL copied');
  };

  const handlePrimaryChange = (value: string) => {
    if (!config) return;
    const updated: CpConfig = { ...config, ai: { ...config.ai, primaryProvider: value as AiProvider } };
    setConfig(updated);
    toast.success(`Primary provider set to ${PROVIDER_LABELS[value as AiProvider]}`);
  };

  const handleSaveKey = () => {
    if (!config || !editingKey || !editKeyValue) return;
    const updated: CpConfig = {
      ...config,
      ai: {
        ...config.ai,
        providers: {
          ...config.ai.providers,
          [editingKey]: { apiKey: editKeyValue },
        },
      },
    };
    setConfig(updated);
    setEditingKey(null);
    setEditKeyValue('');
    setShowEditKey(false);
    toast.success(`${PROVIDER_LABELS[editingKey]} key updated`);
  };

  const enabledProviders = config ? getEnabledProviders(config) : [];

  return (
    <Layout>
      <div className="max-w-xl mx-auto">
        <h1 className="text-xl font-bold mb-6">Settings</h1>

        <div className="space-y-6">
          {/* Configuration */}
          <div className="bg-card border rounded-lg p-4 card-shadow">
            <div className="flex items-center gap-2 mb-3">
              <Settings className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Configuration</span>
            </div>

            {config ? (
              <div className="space-y-4">
                {/* Supabase info */}
                <div className="bg-secondary/50 rounded-md p-3 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Supabase</span>
                  </div>
                  <p className="text-xs font-mono truncate">{config.supabase.url}</p>
                </div>

                {/* AI Providers */}
                <div className="bg-secondary/50 rounded-md p-3 space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">AI Providers</span>
                  </div>
                  {enabledProviders.map((p) => (
                    <div key={p} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{PROVIDER_LABELS[p]}</span>
                        {p === config.ai.primaryProvider && (
                          <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">Primary</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-mono text-muted-foreground">
                          {maskKey(config.ai.providers[p]?.apiKey ?? '')}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={() => {
                            setEditingKey(p);
                            setEditKeyValue('');
                            setShowEditKey(false);
                          }}
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {enabledProviders.length > 1 && (
                    <div className="pt-2 border-t border-border">
                      <Label className="text-xs text-muted-foreground">Primary Provider</Label>
                      <Select value={config.ai.primaryProvider} onValueChange={handlePrimaryChange}>
                        <SelectTrigger className="mt-1 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {enabledProviders.map((p) => (
                            <SelectItem key={p} value={p} className="text-xs">
                              {PROVIDER_LABELS[p]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  {onOpenWizard && (
                    <Button size="sm" variant="secondary" onClick={onOpenWizard} className="gap-1.5">
                      <Settings className="w-3.5 h-3.5" /> Edit Configuration
                    </Button>
                  )}
                  <Button size="sm" variant="destructive" onClick={() => setConfirmReset(true)} className="gap-1.5">
                    <RotateCcw className="w-3.5 h-3.5" /> Reset
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-3">No configuration set.</p>
                {onOpenWizard && (
                  <Button size="sm" onClick={onOpenWizard}>Run Setup Wizard</Button>
                )}
              </div>
            )}
          </div>

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
          {/* System Status Debug */}
          <SystemStatusPanel />
        </div>

        {/* Clear data dialog */}
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

        {/* Reset config dialog */}
        <Dialog open={confirmReset} onOpenChange={setConfirmReset}>
          <DialogContent>
            <DialogHeader><DialogTitle>Reset configuration?</DialogTitle></DialogHeader>
            <p className="text-sm text-muted-foreground">This will clear all Supabase and AI provider settings. The setup wizard will reappear on reload.</p>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setConfirmReset(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleResetConfig}>Reset & Reload</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit key dialog */}
        <Dialog open={!!editingKey} onOpenChange={() => { setEditingKey(null); setShowEditKey(false); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update {editingKey ? PROVIDER_LABELS[editingKey] : ''} Key</DialogTitle>
            </DialogHeader>
            <div className="relative">
              <Input
                type={showEditKey ? 'text' : 'password'}
                placeholder="Paste new API key"
                value={editKeyValue}
                onChange={(e) => setEditKeyValue(e.target.value)}
                className="pr-9 font-mono text-xs"
              />
              <button
                type="button"
                onClick={() => setShowEditKey(!showEditKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showEditKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <DialogFooter>
              <Button variant="secondary" onClick={() => { setEditingKey(null); setShowEditKey(false); }}>Cancel</Button>
              <Button onClick={handleSaveKey} disabled={!editKeyValue}>Save Key</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
