const urlInput = document.getElementById("url");
const providerSelect = document.getElementById("provider");
const apikeyInput = document.getElementById("apikey");
const saveBtn = document.getElementById("save");
const captureBtn = document.getElementById("capture");
const statusEl = document.getElementById("status");

// Load saved settings
chrome.storage.local.get(["cpSupabaseUrl", "cpProvider", "cpApiKey"], (data) => {
  if (data.cpSupabaseUrl) urlInput.value = data.cpSupabaseUrl;
  if (data.cpProvider) providerSelect.value = data.cpProvider;
  if (data.cpApiKey) apikeyInput.value = data.cpApiKey;
});

// Save settings
saveBtn.addEventListener("click", () => {
  chrome.storage.local.set(
    {
      cpSupabaseUrl: urlInput.value.trim(),
      cpProvider: providerSelect.value,
      cpApiKey: apikeyInput.value.trim(),
    },
    () => setStatus("Settings saved", "success")
  );
});

// Capture
captureBtn.addEventListener("click", async () => {
  const supabaseUrl = urlInput.value.trim();
  const provider = providerSelect.value;
  const apiKey = apikeyInput.value.trim();

  if (!supabaseUrl || !apiKey) {
    setStatus("Configure Supabase URL and API key first", "error");
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
        const edgeUrl = `${supabaseUrl}/functions/v1/capture-and-summarize`;

        const res = await fetch(edgeUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            source: response.source,
            chat_title: response.chatTitle,
            transcript: response.transcript,
            provider: provider,
            api_key: apiKey,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `HTTP ${res.status}`);
        }

        const data = await res.json();
        const latency = data.latency_ms ? ` (${(data.latency_ms / 1000).toFixed(1)}s)` : "";
        setStatus(`Captured ✓${latency}`, "success");
      } catch (e) {
        setStatus(`Error: ${e.message}`, "error");
      }
    });
  } catch (e) {
    setStatus(`Error: ${e.message}`, "error");
  }
});

function setStatus(text, state) {
  statusEl.textContent = text;
  statusEl.className = `status ${state}`;
}
