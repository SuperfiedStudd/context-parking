// background.js — Service worker that listens for config sync messages
// from the content script and stores config in chrome.storage.local.

// Single source of truth for default models — must match src/lib/ai/models.ts
const DEFAULT_MODELS = {
  openai: "gpt-4.1-mini",
  anthropic: "claude-4-sonnet",
  google: "gemini-2.0-flash",
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "SYNC_CONFIG" && message.config) {
    const config = message.config;
    const provider = config.ai?.primaryProvider;
    const providerConfig = config.ai?.providers?.[provider];
    const apiKey = providerConfig?.apiKey;

    if (!config.supabase?.url || !provider || !apiKey) return;

    // Strip any path after domain (e.g. /functions/v1/...)
    let baseUrl;
    try {
      const u = new URL(config.supabase.url);
      baseUrl = `${u.protocol}//${u.host}`;
    } catch {
      baseUrl = config.supabase.url.replace(/\/functions.*$/, "").replace(/\/+$/, "");
    }

    // Resolve model: use stored model if present, otherwise apply default
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
