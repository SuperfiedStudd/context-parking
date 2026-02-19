// Content script bridge: web app → extension background
// Injected into localhost and lovable.app pages via manifest content_scripts.

console.log("[Extension CS] config-sync.js loaded");

window.addEventListener("message", (event) => {
  if (event.source !== window || event.data?.type !== "SYNC_CONFIG") return;

  console.log("[Extension CS] SYNC_CONFIG intercepted, forwarding to background");

  chrome.runtime.sendMessage(
    {
      type: "SYNC_CONFIG",
      payload: event.data.payload,
    },
    (response) => {
      if (chrome.runtime.lastError) {
        console.error("[Extension CS] runtime.sendMessage error:", chrome.runtime.lastError.message);
        window.postMessage(
          { type: "SYNC_ACK", ok: false, error: chrome.runtime.lastError.message },
          "*"
        );
        return;
      }
      console.log("[Extension CS] ACK from background:", JSON.stringify(response));
      window.postMessage(
        {
          type: "SYNC_ACK",
          ...(response || { ok: false, error: "No response from background" }),
        },
        "*"
      );
    }
  );
});
