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
  getConfig,
  setConfig,
  maskKey,
  getEnabledProviders,
  PROVIDER_LABELS,
  type AiProvider,
  type CpConfig,
} from '@/lib/configStore';
import { PROVIDER_MODELS, DEFAULT_MODELS, getModelLabel } from '@/lib/ai/models';
import { toast } from 'sonner';

interface Props {
  config: CpConfig;
  onEditKey: (provider: AiProvider) => void;
  onConfigChange?: () => void;
}

export function AiProviderSettings({ config, onEditKey, onConfigChange }: Props) {
  const enabledProviders = getEnabledProviders(config);

  const handlePrimaryChange = (value: string) => {
    const updated: CpConfig = { ...config, ai: { ...config.ai, primaryProvider: value as AiProvider } };
    setConfig(updated);
    onConfigChange?.();
    toast.success(`Primary provider set to ${PROVIDER_LABELS[value as AiProvider]}`);
  };

  const handleModelChange = (provider: AiProvider, modelId: string) => {
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
        const currentModel = config.ai.providers[p]?.model || DEFAULT_MODELS[p];
        const models = PROVIDER_MODELS[p];

        return (
          <div key={p} className="bg-secondary/30 rounded-md p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{PROVIDER_LABELS[p]}</span>
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
                  onClick={() => onEditKey(p)}
                >
                  <Eye className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {/* Model selector */}
            <div>
              <Label className="text-xs text-muted-foreground">Model</Label>
              <Select value={currentModel} onValueChange={(v) => handleModelChange(p, v)}>
                <SelectTrigger className="mt-1 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
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
  );
}
