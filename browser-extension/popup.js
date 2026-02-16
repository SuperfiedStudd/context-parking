const urlInput = document.getElementById("url");
const keyInput = document.getElementById("key");
const saveBtn = document.getElementById("save");
const captureBtn = document.getElementById("capture");
const statusEl = document.getElementById("status");

// Load saved settings
chrome.storage.local.get(["cpUrl", "cpKey"], (data) => {
  if (data.cpUrl) urlInput.value = data.cpUrl;
  if (data.cpKey) keyInput.value = data.cpKey;
});

// Save settings
saveBtn.addEventListener("click", () => {
  chrome.storage.local.set(
    { cpUrl: urlInput.value.trim(), cpKey: keyInput.value.trim() },
    () => setStatus("Settings saved", "success")
  );
});

// Capture
captureBtn.addEventListener("click", async () => {
  const url = urlInput.value.trim();
  const key = keyInput.value.trim();

  if (!url || !key) {
    setStatus("Configure URL and key first", "error");
    return;
  }

  setStatus("Capturing…", "capturing");

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Inject content script if needed, then send scrape message
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"],
    });

    // Small delay to let the content script register its listener
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

      setStatus("Sending…", "sending");

      try {
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-cp-key": key,
          },
          body: JSON.stringify({
            source: response.source,
            chat_title: response.chatTitle,
            transcript: response.transcript,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `HTTP ${res.status}`);
        }

        setStatus("Captured ✓", "success");
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
