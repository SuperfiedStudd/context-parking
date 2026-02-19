const captureBtn = document.getElementById("capture");
const statusEl = document.getElementById("status");
const configStatusEl = document.getElementById("config-status");
const modal = document.getElementById("capture-modal");
const modalCancel = document.getElementById("modal-cancel");
const modalConfirm = document.getElementById("modal-confirm");
const focusField = document.getElementById("focusField");
const charCount = document.getElementById("charCount");

// Check if config has been synced from the web app
chrome.storage.local.get(
  ["cpConfigSynced", "cpSupabaseUrl", "cpProvider", "cpApiKey", "cpModel"],
  (data) => {
    if (data.cpConfigSynced && data.cpSupabaseUrl && data.cpProvider && data.cpApiKey) {
      const modelInfo = data.cpModel ? ` · ${data.cpModel}` : "";
      configStatusEl.textContent = `✓ Connected · ${providerLabel(data.cpProvider)}${modelInfo}`;
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

// Character count for focus field
focusField.addEventListener("input", () => {
  charCount.textContent = focusField.value.length;
});

// Show modal on capture click
captureBtn.addEventListener("click", () => {
  // Reset modal state
  document.querySelector('input[name="captureType"][value="structured"]').checked = true;
  focusField.value = "";
  charCount.textContent = "0";
  modal.style.display = "flex";
});

modalCancel.addEventListener("click", () => {
  modal.style.display = "none";
});

// Confirm capture from modal
modalConfirm.addEventListener("click", async () => {
  const captureType = document.querySelector('input[name="captureType"]:checked').value;
  const userIntent = focusField.value.trim().substring(0, 300);
  modal.style.display = "none";

  // Always read fresh config at capture time
  chrome.storage.local.get(
    ["cpSupabaseUrl", "cpProvider", "cpApiKey", "cpModel"],
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
            const baseUrl = config.cpSupabaseUrl.replace(/\/+$/, "");
            const edgeUrl = `${baseUrl}/functions/v1/capture-and-summarize`;

            const res = await fetch(edgeUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                source: response.source,
                chat_title: response.chatTitle,
                transcript: response.transcript,
                provider: config.cpProvider,
                api_key: config.cpApiKey,
                capture_type: captureType,
                user_intent: userIntent || undefined,
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
