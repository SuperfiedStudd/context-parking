// config-sync.js — Content script injected on all pages.
// Detects Context Parking web app via a DOM marker and syncs config
// to chrome.storage.local via chrome.runtime messaging.

function trySync() {
  // Only activate if this page is the Context Parking web app
  const marker = document.querySelector('meta[name="context-parking-app"]');
  if (!marker) return;

  try {
    const raw = localStorage.getItem("cp_config_v1");
    if (!raw) return;

    const config = JSON.parse(raw);
    if (!config || !config.supabase?.url || !config.ai?.primaryProvider) return;

    // Send config to background/popup via runtime message
    chrome.runtime.sendMessage({
      type: "SYNC_CONFIG",
      config: config,
    });
  } catch {
    // Silently fail — config not ready yet
  }
}

// Sync on load (after DOM is ready)
trySync();

// Re-sync when localStorage changes (user updates config in Settings)
window.addEventListener("storage", (e) => {
  if (e.key === "cp_config_v1") {
    trySync();
  }
});

// Listen for custom event fired by configStore.setConfig()
window.addEventListener("cp-config-updated", () => {
  trySync();
});
