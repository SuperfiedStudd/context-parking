// background.js — Service worker that listens for config sync messages
// from the content script and stores config in chrome.storage.local.

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "SYNC_CONFIG" && message.config) {
    const config = message.config;
    const provider = config.ai?.primaryProvider;
    const apiKey = config.ai?.providers?.[provider]?.apiKey;

    if (!config.supabase?.url || !provider || !apiKey) return;

    chrome.storage.local.set({
      cpConfigSynced: true,
      cpSupabaseUrl: config.supabase.url,
      cpProvider: provider,
      cpApiKey: apiKey,
    });
  }
});
