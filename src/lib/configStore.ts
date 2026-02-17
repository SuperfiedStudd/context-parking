// Config store for Context Parking setup wizard
// Persists to localStorage under "cp_config_v1"

export type AiProvider = 'openai' | 'anthropic' | 'google';

export interface ProviderConfig {
  apiKey: string;
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
