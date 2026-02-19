const captureBtn = document.getElementById("capture");
const statusEl = document.getElementById("status");
const configStatusEl = document.getElementById("config-status");
const modal = document.getElementById("capture-modal");
const modalCancel = document.getElementById("modal-cancel");
const modalConfirm = document.getElementById("modal-confirm");
const focusField = document.getElementById("focusField");
const charCount = document.getElementById("charCount");

const CONFIG_KEYS = ["cpConfigSynced", "cpSupabaseUrl", "cpProvider", "cpApiKey", "cpModel"];

// Read and display current config on popup open
function refreshConfigStatus() {
  chrome.storage.local.get(CONFIG_KEYS, (data) => {
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
  });
}

// Initial load
refreshConfigStatus();

// Re-check when storage changes (e.g. settings saved in web app)
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && CONFIG_KEYS.some((k) => k in changes)) {
    refreshConfigStatus();
  }
});

// Character count for focus field
focusField.addEventListener("input", () => {
  charCount.textContent = focusField.value.length;
});

// Show modal on capture click
captureBtn.addEventListener("click", () => {
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

  // Always read FRESH config from chrome.storage.local at moment of capture
  chrome.storage.local.get(CONFIG_KEYS, async (config) => {
    if (!config.cpSupabaseUrl || !config.cpProvider || !config.cpApiKey) {
      setStatus("Config not synced. Visit your Context Parking app first.", "error");
      return;
    }

    console.log("[Extension Capture] Fresh config at capture time:", {
      provider: config.cpProvider,
      model: config.cpModel || "(none)",
      supabaseUrl: config.cpSupabaseUrl,
    });

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

          const requestBody = {
            source: response.source,
            chat_title: response.chatTitle,
            transcript: response.transcript,
            provider: config.cpProvider,
            api_key: config.cpApiKey,
            model: config.cpModel || undefined,
            capture_type: captureType,
            user_intent: userIntent || undefined,
          };

          console.log("[Extension Capture] Sending to edge:", {
            provider: requestBody.provider,
            model: requestBody.model || "(will use default)",
            capture_type: requestBody.capture_type,
          });

          const res = await fetch(edgeUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
          });

          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || `HTTP ${res.status}`);
          }

          const data = await res.json();
          const latency = data.latency_ms
            ? ` (${(data.latency_ms / 1000).toFixed(1)}s)`
            : "";
          const usedProvider = data.provider || config.cpProvider;
          const usedModel = data.model || config.cpModel || "";
          setStatus(`Captured ✓ ${providerLabel(usedProvider)} · ${usedModel}${latency}`, "success");
        } catch (e) {
          setStatus(`Error: ${e.message}`, "error");
        }
      });
    } catch (e) {
      setStatus(`Error: ${e.message}`, "error");
    }
  });
});

function setStatus(text, state) {
  statusEl.textContent = text;
  statusEl.className = `status ${state}`;
}

function providerLabel(provider) {
  const labels = { openai: "OpenAI", anthropic: "Claude", google: "Gemini" };
  return labels[provider] || provider;
}
