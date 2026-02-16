// Content script — injected into ChatGPT / Claude pages
// Responds to messages from the popup to scrape the conversation

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action !== "scrape") return;

  const hostname = window.location.hostname;
  let transcript = "";
  let source = "unknown";
  const chatTitle = document.title || "Untitled";

  if (hostname.includes("chatgpt.com") || hostname.includes("chat.openai.com")) {
    source = "chatgpt";
    const messages = document.querySelectorAll("[data-message-author-role]");
    messages.forEach((el) => {
      const role = el.getAttribute("data-message-author-role");
      const label = role === "user" ? "User" : "Assistant";
      const text = el.innerText.trim();
      if (text) {
        transcript += `${label}: ${text}\n\n`;
      }
    });
  } else if (hostname.includes("claude.ai")) {
    source = "claude";
    const turns = document.querySelectorAll(
      "[data-testid='user-human-turn'], [data-testid='ai-turn']"
    );
    turns.forEach((el) => {
      const isUser = el.getAttribute("data-testid") === "user-human-turn";
      const label = isUser ? "User" : "Assistant";
      const text = el.innerText.trim();
      if (text) {
        transcript += `${label}: ${text}\n\n`;
      }
    });
  }

  sendResponse({ source, chatTitle, transcript: transcript.trim() });
});
