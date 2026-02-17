// config-sync.js — Content script injected into the Context Parking web app.
// Reads cp_config_v1 from localStorage and syncs it to chrome.storage.local
// so the extension popup can access it without any user configuration.

function syncConfig() {
  try {
    const raw = localStorage.getItem("cp_config_v1");
    if (!raw) return;

    const config = JSON.parse(raw);
    if (!config || !config.supabase?.url || !config.ai?.primaryProvider) return;

    // Extract only what the extension needs — never log keys
    const provider = config.ai.primaryProvider;
    const apiKey = config.ai.providers?.[provider]?.apiKey;

    if (!apiKey) return;

    chrome.storage.local.set({
      cpConfigSynced: true,
      cpSupabaseUrl: config.supabase.url,
      cpProvider: provider,
      cpApiKey: apiKey,
    });
  } catch {
    // Silently fail — config not ready yet
  }
}

// Sync on load
syncConfig();

// Re-sync when localStorage changes (user updates config in Settings)
window.addEventListener("storage", (e) => {
  if (e.key === "cp_config_v1") {
    syncConfig();
  }
});
