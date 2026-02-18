// Orchestrator: reads cp_config_v1, routes through primary then fallback providers
import { getConfig, getEnabledProviders, type AiProvider } from '@/lib/configStore';
import {
  summarizeWithOpenAI,
  summarizeWithAnthropic,
  summarizeWithGoogle,
  type SummarizeResult,
} from './providers';

export interface SummarizeResponse extends SummarizeResult {
  provider: AiProvider;
  latency_ms: number;
}

import { resolveModel } from './models';

const PROVIDER_FN: Record<
  AiProvider,
  (text: string, key: string, model?: string) => Promise<SummarizeResult>
> = {
  openai: summarizeWithOpenAI,
  anthropic: summarizeWithAnthropic,
  google: summarizeWithGoogle,
};

export async function summarize(text: string): Promise<SummarizeResponse> {
  const config = getConfig();
  if (!config) throw new Error('Setup not complete. Configure AI providers in Settings.');

  const enabled = getEnabledProviders(config);
  if (enabled.length === 0) throw new Error('No AI providers configured. Add a provider key in Settings.');

  // Order: primary first, then remaining enabled
  const ordered = [config.ai.primaryProvider, ...enabled.filter((p) => p !== config.ai.primaryProvider)];

  let lastError: Error | null = null;

  for (const provider of ordered) {
    const providerConfig = config.ai.providers[provider];
    const key = providerConfig?.apiKey;
    if (!key) continue;

    const model = resolveModel(provider, providerConfig?.model);
    const fn = PROVIDER_FN[provider];
    const start = Date.now();

    try {
      const result = await fn(text, key, model);
      return {
        ...result,
        provider,
        latency_ms: Date.now() - start,
      };
    } catch (err: any) {
      lastError = err;
      // Continue to next provider
    }
  }

  throw lastError ?? new Error('All providers failed.');
}
