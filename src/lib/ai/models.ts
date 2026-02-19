// Available models per AI provider
import type { AiProvider } from '@/lib/configStore';

export interface AiModel {
  id: string;
  label: string;
  description?: string;
}

export const PROVIDER_MODELS: Record<AiProvider, AiModel[]> = {
  openai: [
    { id: 'gpt-4.1-mini', label: 'GPT-4.1 Mini', description: 'Fast, affordable' },
    { id: 'gpt-4.1', label: 'GPT-4.1', description: 'High quality' },
    { id: 'o4-mini', label: 'o4-mini', description: 'Fast reasoning' },
    { id: 'o3-mini', label: 'o3-mini', description: 'Small reasoning' },
    { id: 'o3', label: 'o3', description: 'Strong reasoning' },
  ],
  anthropic: [
    { id: 'claude-haiku-4-5-20250514', label: 'Claude Haiku 4.5', description: 'Fast & affordable' },
    { id: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4', description: 'Balanced' },
    { id: 'claude-opus-4-20250514', label: 'Claude Opus 4', description: 'Most capable' },
  ],
  google: [
    { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash', description: 'Fast' },
    { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro', description: 'High quality' },
    { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', description: 'Faster next gen' },
    { id: 'gemini-2.0-pro', label: 'Gemini 2.0 Pro', description: 'Higher quality' },
  ],
};

export const DEFAULT_MODELS: Record<AiProvider, string> = {
  openai: 'gpt-4.1-mini',
  anthropic: 'claude-sonnet-4-20250514',
  google: 'gemini-2.0-flash',
};

export function getModelLabel(provider: AiProvider, modelId: string): string {
  const model = PROVIDER_MODELS[provider].find((m) => m.id === modelId);
  return model?.label ?? modelId;
}

/** Returns the stored model if it exists in the current list, otherwise resets to default */
export function resolveModel(provider: AiProvider, storedModel?: string): string {
  if (storedModel && PROVIDER_MODELS[provider].some((m) => m.id === storedModel)) {
    return storedModel;
  }
  return DEFAULT_MODELS[provider];
}
