// Config store for Context Parking setup wizard
// Persists to localStorage under "cp_config_v1"

import { resolveModel } from '@/lib/ai/models';

export type AiProvider = 'openai' | 'anthropic' | 'google';

export interface ProviderConfig {
  apiKey: string;
  model?: string;
}

export interface CpConfig {
  supabase: {
    url: string;
    anonKey: string;
  };
  ai: {
    primaryProvider: AiProvider;
    providers: {
      openai?: ProviderConfig;
      anthropic?: ProviderConfig;
      google?: ProviderConfig;
    };
  };
}

export interface SyncAckResult {
  ok: boolean;
  provider?: string;
  model?: string;
  timestamp?: string;
  error?: string;
}

const STORAGE_KEY = 'cp_config_v1';

/** Strip any path after the base Supabase domain */
export function sanitizeSupabaseUrl(url: string): string {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.host}`;
  } catch {
    return url.replace(/\/+$/, '');
  }
}

export function getConfig(): CpConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CpConfig;
    if (parsed?.supabase?.url) {
      parsed.supabase.url = sanitizeSupabaseUrl(parsed.supabase.url);
    }
    if (!isValidConfig(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function setConfig(config: CpConfig): void {
  if (config.supabase?.url) {
    config.supabase.url = sanitizeSupabaseUrl(config.supabase.url);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

/**
 * Sync config to browser extension via chrome.runtime.sendMessage SYNC_CONFIG.
 * Extension background responds with SYNC_ACK containing stored values.
 * Returns a promise that resolves with the ACK result.
 */
export async function syncConfigToExtension(config?: CpConfig | null): Promise<SyncAckResult> {
  const cfg = config ?? getConfig();
  if (!cfg) return { ok: false, error: 'No config' };

  const provider = cfg.ai.primaryProvider;
  const providerConfig = cfg.ai.providers[provider];
  const apiKey = providerConfig?.apiKey;
  if (!cfg.supabase?.url || !provider || !apiKey) {
    return { ok: false, error: 'Incomplete config' };
  }

  const model = resolveModel(provider, providerConfig?.model);

  try {
    const ack = await new Promise<SyncAckResult>((resolve) => {
      const timeout = setTimeout(() => {
        resolve({ ok: false, error: 'Extension not responding (timeout)' });
      }, 3000);

      // Listen for ACK from content script bridge
      const handler = (event: MessageEvent) => {
        if (event.source !== window || event.data?.type !== 'SYNC_ACK') return;
        clearTimeout(timeout);
        window.removeEventListener('message', handler);
        if (event.data.ok) {
          resolve({
            ok: true,
            provider: event.data.provider,
            model: event.data.model,
            timestamp: event.data.timestamp,
          });
        } else {
          resolve({ ok: false, error: event.data.error || 'Bad ACK' });
        }
      };
      window.addEventListener('message', handler);

      // Send config via window.postMessage — picked up by config-sync.js content script
      window.postMessage(
        {
          type: 'SYNC_CONFIG',
          payload: {
            supabaseUrl: cfg.supabase.url,
            provider,
            apiKey,
            model,
          },
        },
        '*'
      );
    });

    if (ack.ok) {
      localStorage.setItem('cp_extension_last_sync', JSON.stringify(ack));
      if (process.env.NODE_ENV === 'development') {
        console.debug('[ConfigSync] ACK received:', ack);
      }
    }

    return ack;
  } catch {
    return { ok: false, error: 'Sync exception' };
  }
}

/** Get the last sync ACK result */
export function getExtensionLastSync(): SyncAckResult | null {
  try {
    const raw = localStorage.getItem('cp_extension_last_sync');
    if (!raw) return null;
    return JSON.parse(raw) as SyncAckResult;
  } catch {
    return null;
  }
}

export function clearConfig(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function isValidConfig(config: any): config is CpConfig {
  if (!config || typeof config !== 'object') return false;
  if (!config.supabase?.url || !config.supabase?.anonKey) return false;
  if (!config.supabase.url.startsWith('https://') || !config.supabase.url.includes('.supabase.co')) return false;
  if (!config.ai?.providers || typeof config.ai.providers !== 'object') return false;
  const providers = config.ai.providers;
  const enabledProviders = (['openai', 'anthropic', 'google'] as AiProvider[]).filter(
    (p) => providers[p]?.apiKey && providers[p]!.apiKey.length > 0
  );
  if (enabledProviders.length === 0) return false;
  if (!config.ai.primaryProvider || !enabledProviders.includes(config.ai.primaryProvider)) return false;
  return true;
}

export function getEnabledProviders(config: CpConfig): AiProvider[] {
  const providers = config.ai.providers;
  return (['openai', 'anthropic', 'google'] as AiProvider[]).filter(
    (p) => providers[p]?.apiKey && providers[p]!.apiKey.length > 0
  );
}

export function isSetupComplete(): boolean {
  return getConfig() !== null;
}

export function isSetupSkipped(): boolean {
  return localStorage.getItem('cp_setup_skipped') === 'true';
}

export function setSetupSkipped(skipped: boolean): void {
  if (skipped) {
    localStorage.setItem('cp_setup_skipped', 'true');
  } else {
    localStorage.removeItem('cp_setup_skipped');
  }
}

export const PROVIDER_LABELS: Record<AiProvider, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic (Claude)',
  google: 'Google (Gemini)',
};

export const PROVIDER_KEY_PREFIXES: Record<AiProvider, string> = {
  openai: 'sk-',
  anthropic: 'sk-ant-',
  google: 'AI',
};

export function maskKey(key: string): string {
  if (!key || key.length < 8) return '••••••••';
  return key.slice(0, 4) + '••••••••' + key.slice(-4);
}
