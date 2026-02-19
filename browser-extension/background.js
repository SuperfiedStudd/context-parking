// background.js — Service worker for Context Parking extension.
// Config is written directly to chrome.storage.local by the web app
// (when chrome.storage is available) or via SYNC_CONFIG messages from config-sync.js.
// No content script dependency for config sync.

// Default models — must match src/lib/ai/models.ts
const DEFAULT_MODELS = {
  openai: "gpt-4.1-mini",
  anthropic: "claude-4-sonnet",
  google: "gemini-2.0-flash",
};

// Handle SYNC_CONFIG messages from config-sync.js (legacy path, kept for compatibility)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "SYNC_CONFIG" && message.config) {
    const config = message.config;
    const provider = config.ai?.primaryProvider;
    const providerConfig = config.ai?.providers?.[provider];
    const apiKey = providerConfig?.apiKey;

    if (!config.supabase?.url || !provider || !apiKey) return;

    let baseUrl;
    try {
      const u = new URL(config.supabase.url);
      baseUrl = `${u.protocol}//${u.host}`;
    } catch {
      baseUrl = config.supabase.url.replace(/\/functions.*$/, "").replace(/\/+$/, "");
    }

    const resolvedModel = providerConfig?.model || DEFAULT_MODELS[provider] || "";

    chrome.storage.local.set({
      cpConfigSynced: true,
      cpSupabaseUrl: baseUrl,
      cpProvider: provider,
      cpApiKey: apiKey,
      cpModel: resolvedModel,
      cpSyncTimestamp: new Date().toISOString(),
    });
  }
});
