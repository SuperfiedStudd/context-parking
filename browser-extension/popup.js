const EDGE_URL = "https://sdjdzvcwfcdtngknrasp.supabase.co/functions/v1/capture-and-summarize";

const captureBtn = document.getElementById("capture");
const statusEl = document.getElementById("status");

captureBtn.addEventListener("click", async () => {
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
        const res = await fetch(EDGE_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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
