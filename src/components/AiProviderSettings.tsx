import { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Eye } from 'lucide-react';
import {
  setConfig,
  maskKey,
  getEnabledProviders,
  syncConfigToExtension,
  getExtensionLastSync,
  PROVIDER_LABELS,
  type AiProvider,
  type CpConfig,
  type SyncAckResult,
} from '@/lib/configStore';
import { PROVIDER_MODELS, DEFAULT_MODELS, getModelLabel, resolveModel } from '@/lib/ai/models';
import { toast } from 'sonner';
import { RefreshCw, Check, X } from 'lucide-react';

interface Props {
  config: CpConfig;
  onEditKey: (provider: AiProvider) => void;
  onConfigChange?: () => void;
}

export function AiProviderSettings({ config, onEditKey, onConfigChange }: Props) {
  const enabledProviders = getEnabledProviders(config);

  const [selectedModels, setSelectedModels] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const p of enabledProviders) {
      initial[p] = resolveModel(p, config.ai.providers[p]?.model);
    }
    return initial;
  });

  const [primaryProvider, setPrimaryProvider] = useState(config.ai.primaryProvider);

  useEffect(() => {
    const updated: Record<string, string> = {};
    for (const p of enabledProviders) {
      updated[p] = resolveModel(p, config.ai.providers[p]?.model);
    }
    setSelectedModels(updated);
    setPrimaryProvider(config.ai.primaryProvider);
  }, [config]);

  const handlePrimaryChange = (value: string) => {
    setPrimaryProvider(value as AiProvider);
    const updated: CpConfig = { ...config, ai: { ...config.ai, primaryProvider: value as AiProvider } };
    setConfig(updated);
    onConfigChange?.();
    toast.success(`Primary provider set to ${PROVIDER_LABELS[value as AiProvider]}`);
  };

  const handleModelChange = (provider: AiProvider, modelId: string) => {
    setSelectedModels((prev) => ({ ...prev, [provider]: modelId }));
    const updated: CpConfig = {
      ...config,
      ai: {
        ...config.ai,
        providers: {
          ...config.ai.providers,
          [provider]: { ...config.ai.providers[provider], model: modelId },
        },
      },
    };
    setConfig(updated);
    onConfigChange?.();
    toast.success(`${PROVIDER_LABELS[provider]} model set to ${getModelLabel(provider, modelId)}`);
  };

  return (
    <div className="space-y-3">
      {enabledProviders.map((p) => {
        const currentModel = selectedModels[p] || DEFAULT_MODELS[p];
        const models = PROVIDER_MODELS[p];

        return (
          <div key={p} className="bg-secondary/30 rounded-md p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{PROVIDER_LABELS[p]}</span>
                {p === primaryProvider && (
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
                  onClick={() => onEditKey(p)}
                >
                  <Eye className="w-3 h-3" />
                </Button>
              </div>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Model</Label>
              <Select value={currentModel} onValueChange={(v) => handleModelChange(p, v)}>
                <SelectTrigger className="mt-1 h-8 text-xs bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {models.map((m) => (
                    <SelectItem key={m.id} value={m.id} className="text-xs">
                      <div className="flex items-center gap-2">
                        <span>{m.label}</span>
                        {m.description && (
                          <span className="text-muted-foreground">— {m.description}</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      })}

      {enabledProviders.length > 1 && (
        <div className="pt-2 border-t border-border">
          <Label className="text-xs text-muted-foreground">Primary Provider</Label>
          <Select value={primaryProvider} onValueChange={handlePrimaryChange}>
            <SelectTrigger className="mt-1 h-8 text-xs bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              {enabledProviders.map((p) => (
                <SelectItem key={p} value={p} className="text-xs">
                  {PROVIDER_LABELS[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <ExtensionSyncStatus config={config} key={primaryProvider + JSON.stringify(selectedModels)} />
    </div>
  );
}

function ExtensionSyncStatus({ config }: { config: CpConfig }) {
  const [syncResult, setSyncResult] = useState<SyncAckResult | null>(getExtensionLastSync());
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const ack = await syncConfigToExtension(config);
      setSyncResult(ack);
      if (ack.ok) {
        toast.success(`Synced: ${ack.provider} / ${ack.model}`);
      } else {
        toast.error(`Sync failed: ${ack.error}`);
      }
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="pt-2 border-t border-border space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {syncResult?.ok ? (
            <>
              <Check className="w-3 h-3 text-primary" />
              <span>
                Synced: <span className="font-medium text-foreground">{syncResult.provider}</span> / <span className="font-medium text-foreground">{syncResult.model}</span>
              </span>
            </>
          ) : syncResult ? (
            <>
              <X className="w-3 h-3 text-destructive" />
              <span>Sync failed: {syncResult.error}</span>
            </>
          ) : (
            <span>Not synced to extension yet</span>
          )}
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-7 gap-1 text-xs"
          onClick={handleSync}
          disabled={syncing}
        >
          <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing…' : 'Sync to Extension'}
        </Button>
      </div>
    </div>
  );
}
