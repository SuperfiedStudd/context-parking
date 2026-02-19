// background.js — Service worker for Context Parking extension.
// Handles SYNC_CONFIG messages: writes config to storage, responds with SYNC_ACK.

const DEFAULT_MODELS = {
  openai: "gpt-4.1-mini",
  anthropic: "claude-sonnet-4-20250514",
  google: "gemini-2.0-flash",
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "SYNC_CONFIG" && message.payload) {
    const { supabaseUrl, provider, apiKey, model } = message.payload;

    if (!supabaseUrl || !provider || !apiKey) {
      sendResponse({ type: "SYNC_ACK", ok: false, error: "Missing fields" });
      return true;
    }

    // Resolve base URL
    let baseUrl;
    try {
      const u = new URL(supabaseUrl);
      baseUrl = `${u.protocol}//${u.host}`;
    } catch {
      baseUrl = supabaseUrl.replace(/\/functions.*$/, "").replace(/\/+$/, "");
    }

    const resolvedModel = model || DEFAULT_MODELS[provider] || "";
    const timestamp = new Date().toISOString();

    const stored = {
      cpConfigSynced: true,
      cpSupabaseUrl: baseUrl,
      cpProvider: provider,
      cpApiKey: apiKey,
      cpModel: resolvedModel,
      cpSyncTimestamp: timestamp,
    };

    chrome.storage.local.set(stored, () => {
      // Respond with ACK containing the stored values
      sendResponse({
        type: "SYNC_ACK",
        ok: true,
        provider: stored.cpProvider,
        model: stored.cpModel,
        timestamp: stored.cpSyncTimestamp,
      });
    });

    // Return true to indicate async sendResponse
    return true;
  }
});
