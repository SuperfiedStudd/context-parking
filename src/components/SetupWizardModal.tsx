import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  type CpConfig,
  type AiProvider,
  setConfig,
  setSetupSkipped,
  PROVIDER_LABELS,
  getEnabledProviders,
} from '@/lib/configStore';
import { createClient } from '@supabase/supabase-js';
import {
  Database,
  Server,
  Sparkles,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
} from 'lucide-react';

interface SetupWizardModalProps {
  open: boolean;
  onComplete: () => void;
  initialConfig?: CpConfig | null;
  startStep?: number;
}

const STEPS = ['Supabase', 'AI Providers', 'Review'];

export default function SetupWizardModal({ open, onComplete, initialConfig, startStep = 0 }: SetupWizardModalProps) {
  const [step, setStep] = useState(startStep);

  // Step A: Supabase
  const [supabaseUrl, setSupabaseUrl] = useState(initialConfig?.supabase.url ?? '');
  const [supabaseKey, setSupabaseKey] = useState(initialConfig?.supabase.anonKey ?? '');
  const [supabaseTest, setSupabaseTest] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [supabaseError, setSupabaseError] = useState('');

  // Step B: AI Providers
  const [providers, setProviders] = useState<Record<AiProvider, { enabled: boolean; apiKey: string }>>({
    openai: {
      enabled: !!initialConfig?.ai.providers.openai?.apiKey,
      apiKey: initialConfig?.ai.providers.openai?.apiKey ?? '',
    },
    anthropic: {
      enabled: !!initialConfig?.ai.providers.anthropic?.apiKey,
      apiKey: initialConfig?.ai.providers.anthropic?.apiKey ?? '',
    },
    google: {
      enabled: !!initialConfig?.ai.providers.google?.apiKey,
      apiKey: initialConfig?.ai.providers.google?.apiKey ?? '',
    },
  });
  const [primaryProvider, setPrimaryProvider] = useState<AiProvider>(
    initialConfig?.ai.primaryProvider ?? 'openai'
  );
  const [showKeys, setShowKeys] = useState<Record<AiProvider, boolean>>({
    openai: false, anthropic: false, google: false,
  });

  // Validation
  const isSupabaseValid = supabaseUrl.startsWith('https://') && supabaseUrl.includes('.supabase.co') && supabaseKey.length > 0;

  const enabledProvidersList = (['openai', 'anthropic', 'google'] as AiProvider[]).filter(
    (p) => providers[p].enabled && providers[p].apiKey.length > 0
  );
  const isAiValid = enabledProvidersList.length > 0;

  // Ensure primary is among enabled
  const effectivePrimary = enabledProvidersList.includes(primaryProvider)
    ? primaryProvider
    : enabledProvidersList[0] ?? 'openai';

  const testSupabaseConnection = useCallback(async () => {
    setSupabaseTest('loading');
    setSupabaseError('');
    try {
      const client = createClient(supabaseUrl, supabaseKey);
      const { error } = await client.auth.getSession();
      if (error) throw error;
      setSupabaseTest('success');
    } catch (e: any) {
      setSupabaseTest('error');
      setSupabaseError(e?.message ?? 'Connection failed. Check URL and anon key.');
    }
  }, [supabaseUrl, supabaseKey]);

  const buildConfig = (): CpConfig => {
    // Import is already at top; sanitize here for safety
    const cleanUrl = supabaseUrl.replace(/\/functions.*$/, '').replace(/\/+$/, '');
    return {
      supabase: { url: cleanUrl, anonKey: supabaseKey },
      ai: {
        primaryProvider: effectivePrimary,
        providers: {
          ...(providers.openai.enabled && providers.openai.apiKey ? { openai: { apiKey: providers.openai.apiKey } } : {}),
          ...(providers.anthropic.enabled && providers.anthropic.apiKey ? { anthropic: { apiKey: providers.anthropic.apiKey } } : {}),
          ...(providers.google.enabled && providers.google.apiKey ? { google: { apiKey: providers.google.apiKey } } : {}),
        },
      },
    };
  };

  const handleSave = () => {
    const config = buildConfig();
    setConfig(config);
    setSetupSkipped(false);
    onComplete();
  };

  const handleSkip = () => {
    setSetupSkipped(true);
    onComplete();
  };

  const toggleShowKey = (p: AiProvider) => {
    setShowKeys((prev) => ({ ...prev, [p]: !prev[p] }));
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-[560px] p-0 gap-0 overflow-hidden [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-center gap-2 mb-1">
            <Database className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Setup Context Parking</h2>
          </div>
          <p className="text-sm text-muted-foreground">Configure your connections to get started.</p>

          {/* Progress */}
          <div className="flex items-center gap-2 mt-4">
            {STEPS.map((label, i) => (
              <div key={label} className="flex items-center gap-2 flex-1">
                <div
                  className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-medium transition-smooth ${
                    i <= step
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-muted-foreground'
                  }`}
                >
                  {i < step ? '✓' : i + 1}
                </div>
                <span className={`text-xs font-medium hidden sm:inline ${i <= step ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {label}
                </span>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-px ${i < step ? 'bg-primary' : 'bg-border'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 min-h-[320px]">
          {step === 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Server className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Supabase Connection</span>
              </div>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Project URL</Label>
                  <Input
                    placeholder="https://yourproject.supabase.co"
                    value={supabaseUrl}
                    onChange={(e) => { setSupabaseUrl(e.target.value); setSupabaseTest('idle'); }}
                    className="mt-1"
                  />
                  {supabaseUrl && !supabaseUrl.startsWith('https://') && (
                    <p className="text-xs text-destructive mt-1">URL must start with https://</p>
                  )}
                  {supabaseUrl && supabaseUrl.startsWith('https://') && !supabaseUrl.includes('.supabase.co') && (
                    <p className="text-xs text-destructive mt-1">URL must include .supabase.co</p>
                  )}
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Anon Key</Label>
                  <Input
                    placeholder="eyJhbGciOiJI..."
                    value={supabaseKey}
                    onChange={(e) => { setSupabaseKey(e.target.value); setSupabaseTest('idle'); }}
                    className="mt-1 font-mono text-xs"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={testSupabaseConnection}
                    disabled={!isSupabaseValid || supabaseTest === 'loading'}
                  >
                    {supabaseTest === 'loading' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Test Connection
                  </Button>
                  {supabaseTest === 'success' && (
                    <span className="flex items-center gap-1 text-xs text-accent-foreground">
                      <CheckCircle2 className="w-3.5 h-3.5 text-accent" /> Connected
                    </span>
                  )}
                  {supabaseTest === 'error' && (
                    <span className="flex items-center gap-1 text-xs text-destructive">
                      <XCircle className="w-3.5 h-3.5" /> {supabaseError || 'Connection failed'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">AI Providers</span>
              </div>
              <p className="text-xs text-muted-foreground">Enable at least one provider for transcript summarization.</p>

              <div className="space-y-3">
                {(['openai', 'anthropic', 'google'] as AiProvider[]).map((p) => (
                  <div key={p} className="bg-card border rounded-lg p-3 card-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{PROVIDER_LABELS[p]}</span>
                      <Switch
                        checked={providers[p].enabled}
                        onCheckedChange={(checked) =>
                          setProviders((prev) => ({
                            ...prev,
                            [p]: { ...prev[p], enabled: checked },
                          }))
                        }
                      />
                    </div>
                    {providers[p].enabled && (
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Input
                            type={showKeys[p] ? 'text' : 'password'}
                            placeholder="API Key"
                            value={providers[p].apiKey}
                            onChange={(e) =>
                              setProviders((prev) => ({
                                ...prev,
                                [p]: { ...prev[p], apiKey: e.target.value },
                              }))
                            }
                            className="pr-9 text-xs font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => toggleShowKey(p)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showKeys[p] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {enabledProvidersList.length > 0 && (
                <div className="mt-4">
                  <Label className="text-xs text-muted-foreground mb-2 block">Primary Provider</Label>
                  <RadioGroup
                    value={effectivePrimary}
                    onValueChange={(v) => setPrimaryProvider(v as AiProvider)}
                  >
                    {enabledProvidersList.map((p) => (
                      <div key={p} className="flex items-center gap-2">
                        <RadioGroupItem value={p} id={`primary-${p}`} />
                        <Label htmlFor={`primary-${p}`} className="text-sm cursor-pointer">
                          {PROVIDER_LABELS[p]}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              )}

              {!isAiValid && (
                <p className="text-xs text-destructive">Add at least one AI provider key to enable summaries.</p>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-accent" />
                <span className="text-sm font-medium">Review Configuration</span>
              </div>

              <div className="bg-card border rounded-lg p-4 card-shadow space-y-3">
                <div>
                  <span className="text-xs text-muted-foreground">Supabase URL</span>
                  <p className="text-sm font-mono truncate">{supabaseUrl}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Anon Key</span>
                  <p className="text-sm font-mono">
                    {supabaseKey.slice(0, 8)}••••{supabaseKey.slice(-4)}
                  </p>
                </div>
              </div>

              <div className="bg-card border rounded-lg p-4 card-shadow space-y-3">
                <span className="text-xs text-muted-foreground">AI Providers</span>
                {enabledProvidersList.map((p) => (
                  <div key={p} className="flex items-center justify-between">
                    <span className="text-sm">{PROVIDER_LABELS[p]}</span>
                    {p === effectivePrimary && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                        Primary
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between">
          <div>
            {step === 0 && (
              <Button variant="ghost" size="sm" onClick={handleSkip} className="text-muted-foreground text-xs">
                Skip for now
              </Button>
            )}
            {step > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setStep(step - 1)}>
                <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back
              </Button>
            )}
          </div>
          <div>
            {step < 2 && (
              <Button
                size="sm"
                onClick={() => setStep(step + 1)}
                disabled={step === 0 ? !isSupabaseValid : !isAiValid}
              >
                Next <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            )}
            {step === 2 && (
              <Button size="sm" onClick={handleSave}>
                Save & Start
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
