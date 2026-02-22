chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action !== "scrape") return;

  (async () => {
    try {
      const adapterSrc = chrome.runtime.getURL("adapters/index.js");
      const { getAdapter } = await import(adapterSrc);
      const adapter = getAdapter(window.location.hostname);

      if (!adapter) {
        throw new Error("Unsupported platform");
      }

      const { source, transcript, messages, error } = adapter.extractTranscript();
      const chatTitle = document.title || "Untitled";

      if (error) {
        console.warn("[Context Parking]", error);
        // Transmit semantic error structure back
        sendResponse({ source, chatTitle, transcript, messages, error });
      } else {
        sendResponse({ source, chatTitle, transcript, messages });
      }

    } catch (err) {
      console.error("[Context Parking] Extraction failed:", err);
      sendResponse({
        source: "unknown",
        chatTitle: document.title || "Untitled",
        transcript: "",
        error: err.message
      });
    }
  })();

  // Return true to indicate we wish to send a response asynchronously
  return true;
});
