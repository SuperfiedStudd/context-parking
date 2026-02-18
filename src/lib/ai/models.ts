// Available models per AI provider
import type { AiProvider } from '@/lib/configStore';

export interface AiModel {
  id: string;
  label: string;
  description?: string;
}

export const PROVIDER_MODELS: Record<AiProvider, AiModel[]> = {
  openai: [
    { id: 'gpt-4o-mini', label: 'GPT-4o Mini', description: 'Fast & affordable' },
    { id: 'gpt-4o', label: 'GPT-4o', description: 'High quality multimodal' },
    { id: 'gpt-4-turbo', label: 'GPT-4 Turbo', description: 'Previous generation' },
    { id: 'o1-mini', label: 'o1 Mini', description: 'Reasoning model' },
    { id: 'o1', label: 'o1', description: 'Advanced reasoning' },
  ],
  anthropic: [
    { id: 'claude-3-5-sonnet-latest', label: 'Claude 3.5 Sonnet', description: 'Best balance' },
    { id: 'claude-3-5-haiku-latest', label: 'Claude 3.5 Haiku', description: 'Fast & efficient' },
    { id: 'claude-3-opus-latest', label: 'Claude 3 Opus', description: 'Most capable' },
  ],
  google: [
    { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', description: 'Fast & capable' },
    { id: 'gemini-2.0-flash-lite', label: 'Gemini 2.0 Flash Lite', description: 'Lightweight' },
    { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro', description: 'Previous generation pro' },
    { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash', description: 'Previous generation fast' },
  ],
};

export const DEFAULT_MODELS: Record<AiProvider, string> = {
  openai: 'gpt-4o-mini',
  anthropic: 'claude-3-5-sonnet-latest',
  google: 'gemini-2.0-flash',
};

export function getModelLabel(provider: AiProvider, modelId: string): string {
  const model = PROVIDER_MODELS[provider].find((m) => m.id === modelId);
  return model?.label ?? modelId;
}
