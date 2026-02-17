const captureBtn = document.getElementById("capture");
const statusEl = document.getElementById("status");
const configStatusEl = document.getElementById("config-status");

// Check if config has been synced from the web app
chrome.storage.local.get(
  ["cpConfigSynced", "cpSupabaseUrl", "cpProvider", "cpApiKey"],
  (data) => {
    if (data.cpConfigSynced && data.cpSupabaseUrl && data.cpProvider && data.cpApiKey) {
      configStatusEl.textContent = `✓ Connected · ${providerLabel(data.cpProvider)}`;
      configStatusEl.className = "config-status connected";
      captureBtn.disabled = false;
    } else {
      configStatusEl.innerHTML =
        "⚠ Open your Context Parking app and complete the Setup Wizard to connect.";
      configStatusEl.className = "config-status disconnected";
      captureBtn.disabled = true;
    }
  }
);

captureBtn.addEventListener("click", async () => {
  // Read config from chrome.storage.local (synced from web app)
  chrome.storage.local.get(
    ["cpSupabaseUrl", "cpProvider", "cpApiKey"],
    async (config) => {
      if (!config.cpSupabaseUrl || !config.cpProvider || !config.cpApiKey) {
        setStatus("Config not synced. Visit your Context Parking app first.", "error");
        return;
      }

      setStatus("Capturing…", "capturing");

      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["content.js"],
        });

        await new Promise((r) => setTimeout(r, 200));

        chrome.tabs.sendMessage(tab.id, { action: "scrape" }, async (response) => {
          if (chrome.runtime.lastError || !response) {
            setStatus("Could not scrape — is this ChatGPT or Claude?", "error");
            return;
          }

          if (!response.transcript) {
            setStatus("No conversation found on this page", "error");
            return;
          }

          setStatus("Summarizing & saving…", "sending");

          try {
            const edgeUrl = `${config.cpSupabaseUrl}/functions/v1/capture-and-summarize`;

            const res = await fetch(edgeUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                source: response.source,
                chat_title: response.chatTitle,
                transcript: response.transcript,
                provider: config.cpProvider,
                api_key: config.cpApiKey,
              }),
            });

            if (!res.ok) {
              const err = await res.json().catch(() => ({}));
              throw new Error(err.error || `HTTP ${res.status}`);
            }

            const data = await res.json();
            const latency = data.latency_ms
              ? ` (${(data.latency_ms / 1000).toFixed(1)}s)`
              : "";
            setStatus(`Captured ✓${latency}`, "success");
          } catch (e) {
            setStatus(`Error: ${e.message}`, "error");
          }
        });
      } catch (e) {
        setStatus(`Error: ${e.message}`, "error");
      }
    }
  );
});

function setStatus(text, state) {
  statusEl.textContent = text;
  statusEl.className = `status ${state}`;
}

function providerLabel(provider) {
  const labels = { openai: "OpenAI", anthropic: "Claude", google: "Gemini" };
  return labels[provider] || provider;
}
