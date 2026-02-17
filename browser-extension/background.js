// background.js — Service worker that listens for config sync messages
// from the content script and stores config in chrome.storage.local.

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "SYNC_CONFIG" && message.config) {
    const config = message.config;
    const provider = config.ai?.primaryProvider;
    const apiKey = config.ai?.providers?.[provider]?.apiKey;

    if (!config.supabase?.url || !provider || !apiKey) return;

    // Strip any path after domain (e.g. /functions/v1/...)
    let baseUrl;
    try {
      const u = new URL(config.supabase.url);
      baseUrl = `${u.protocol}//${u.host}`;
    } catch {
      baseUrl = config.supabase.url.replace(/\/functions.*$/, "").replace(/\/+$/, "");
    }

    chrome.storage.local.set({
      cpConfigSynced: true,
      cpSupabaseUrl: baseUrl,
      cpProvider: provider,
      cpApiKey: apiKey,
    });
  }
});
