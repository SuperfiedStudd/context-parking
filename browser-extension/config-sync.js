// Content script bridge: web app → extension background
// Injected into localhost and lovable.app pages via manifest content_scripts.

window.addEventListener("message", (event) => {
  if (event.source !== window || event.data?.type !== "SYNC_CONFIG") return;

  chrome.runtime.sendMessage(
    {
      type: "SYNC_CONFIG",
      payload: event.data.payload,
    },
    (response) => {
      // Forward ACK back to the web app via window.postMessage
      window.postMessage(
        {
          type: "SYNC_ACK",
          ...(response || { ok: false, error: "No response from extension" }),
        },
        "*"
      );
    }
  );
});
