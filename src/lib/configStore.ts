// Config store for Context Parking setup wizard
// Persists to localStorage under "cp_config_v1"

/* eslint-disable @typescript-eslint/no-explicit-any */
declare const chrome: any;

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

const STORAGE_KEY = 'cp_config_v1';

/** Strip any path after the base Supabase domain (e.g. /functions/v1/...) */
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
    // Auto-migrate: sanitize stored URL
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
  // Auto-sync to extension
  syncConfigToExtension(config);
}

/**
 * Sync config to browser extension via chrome.storage.local and runtime message.
 * Stores a timestamp so the UI can show "Last synced".
 * Silently no-ops if chrome APIs are unavailable (e.g. no extension installed).
 */
export function syncConfigToExtension(config?: CpConfig | null): boolean {
  const cfg = config ?? getConfig();
  if (!cfg) return false;

  const provider = cfg.ai.primaryProvider;
  const providerConfig = cfg.ai.providers[provider];
  const apiKey = providerConfig?.apiKey;
  if (!cfg.supabase?.url || !provider || !apiKey) return false;

  const model = providerConfig?.model || '';

  try {
    // Attempt chrome.storage.local (only works if extension context is available)
    if (typeof chrome !== 'undefined' && chrome?.storage?.local) {
      chrome.storage.local.set({
        cpConfigSynced: true,
        cpSupabaseUrl: cfg.supabase.url,
        cpProvider: provider,
        cpApiKey: apiKey,
        cpModel: model,
        cpSyncTimestamp: new Date().toISOString(),
      });
    }

    // Also fire a custom DOM event that the content script can pick up
    window.dispatchEvent(new CustomEvent('cp-config-updated', {
      detail: { provider, model, apiKey, supabaseUrl: cfg.supabase.url },
    }));

    // Store sync timestamp locally so Settings UI can display it
    localStorage.setItem('cp_extension_last_sync', new Date().toISOString());

    if (process.env.NODE_ENV === 'development') {
      console.debug('[ConfigSync] Synced to extension:', { provider, model });
    }

    return true;
  } catch {
    return false;
  }
}

export function getExtensionLastSync(): string | null {
  return localStorage.getItem('cp_extension_last_sync');
}

export function clearConfig(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function isValidConfig(config: any): config is CpConfig {
  if (!config || typeof config !== 'object') return false;

  // Validate supabase
  if (!config.supabase?.url || !config.supabase?.anonKey) return false;
  if (!config.supabase.url.startsWith('https://') || !config.supabase.url.includes('.supabase.co')) return false;

  // Validate AI
  if (!config.ai?.providers || typeof config.ai.providers !== 'object') return false;
  const providers = config.ai.providers;
  const enabledProviders = (['openai', 'anthropic', 'google'] as AiProvider[]).filter(
    (p) => providers[p]?.apiKey && providers[p]!.apiKey.length > 0
  );
  if (enabledProviders.length === 0) return false;

  // Validate primary provider is among enabled
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
