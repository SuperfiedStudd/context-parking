// background.js — Service worker for Context Parking extension.
// Handles SYNC_CONFIG messages: writes config to storage, responds with SYNC_ACK.

const DEFAULT_MODELS = {
  openai: "gpt-4.1-mini",
  anthropic: "claude-sonnet-4-20250514",
  google: "gemini-2.0-flash",
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "SYNC_CONFIG") {
    console.log("[Extension BG] SYNC_CONFIG received:", JSON.stringify(message.payload));

    const payload = message.payload;
    if (!payload || !payload.supabaseUrl || !payload.provider || !payload.apiKey) {
      console.warn("[Extension BG] SYNC_CONFIG missing fields");
      sendResponse({ type: "SYNC_ACK", ok: false, error: "Missing fields" });
      return true;
    }

    let baseUrl;
    try {
      const u = new URL(payload.supabaseUrl);
      baseUrl = `${u.protocol}//${u.host}`;
    } catch {
      baseUrl = payload.supabaseUrl.replace(/\/functions.*$/, "").replace(/\/+$/, "");
    }

    const resolvedModel = payload.model || DEFAULT_MODELS[payload.provider] || "";
    const timestamp = new Date().toISOString();

    const stored = {
      cpConfigSynced: true,
      cpSupabaseUrl: baseUrl,
      cpProvider: payload.provider,
      cpApiKey: payload.apiKey,
      cpModel: resolvedModel,
      cpSyncTimestamp: timestamp,
    };

    try {
      chrome.storage.local.set(stored, () => {
        console.log("[Extension BG] Config stored, sending SYNC_ACK");
        sendResponse({
          type: "SYNC_ACK",
          ok: true,
          provider: stored.cpProvider,
          model: stored.cpModel,
          timestamp: stored.cpSyncTimestamp,
        });
      });
    } catch (err) {
      console.error("[Extension BG] storage.set failed:", err);
      sendResponse({ type: "SYNC_ACK", ok: false, error: err.message });
    }

    return true; // REQUIRED for async sendResponse
  }
});
