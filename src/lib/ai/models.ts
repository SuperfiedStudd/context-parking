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
    { id: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku', description: 'Fast & cheap' },
    { id: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet', description: 'Balanced' },
    { id: 'claude-3-opus-20240229', label: 'Claude 3 Opus', description: 'Most capable Claude 3' },
    { id: 'claude-3.5-sonnet-latest', label: 'Claude 3.5 Sonnet', description: 'Improved Sonnet' },
    { id: 'claude-4-sonnet', label: 'Claude 4 Sonnet', description: 'Next gen balanced' },
    { id: 'claude-4-opus', label: 'Claude 4 Opus', description: 'Next gen flagship' },
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
  anthropic: 'claude-4-sonnet',
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
