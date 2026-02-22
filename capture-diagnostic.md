# Context Parking Diagnostic Report

## A. Current domain coverage
**File:** `browser-extension/manifest.json` & `browser-extension/popup.js`

**Issue:** Domain permissions are granted dynamically via `activeTab` rather than explicit `host_permissions` string arrays, meaning the popup script can dynamically inject `content.js` onto any tab where the user activates the extension.

**Evidence (code snippet):**
From `manifest.json`:
```json
  "permissions": [
    "storage",
    "tabs",
    "activeTab",
    "scripting"
  ]
```
From `popup.js`:
```javascript
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content.js"],
      });
```

**Impact:** The extension technically "covers" all domains as it injects `content.js` anywhere the popup is opened. However, the exact extraction logic within `content.js` strictly limits functionality to specifically matched hostnames.

---

## B. Exact DOM selectors used for GPT
**File:** `browser-extension/content.js`

**Issue:** Transcript extraction explicitly targets an internal data attribute set by the ChatGPT DOM.

**Evidence (code snippet):**
```javascript
    const messages = document.querySelectorAll("[data-message-author-role]");
```

**Impact:** The capture works flawlessly for ChatGPT as long as OpenAI continues adding the `data-message-author-role` attribute to their chat turns.

---

## C. Whether Claude/Gemini are explicitly unsupported
**File:** `browser-extension/content.js`

**Issue:** Claude is explicitly supported (has a dedicated conditional branch), while Gemini is completely explicitly unsupported (lacking any conditional logic).

**Evidence (code snippet):**
```javascript
  } else if (hostname.includes("claude.ai")) {
    source = "claude";
    const turns = document.querySelectorAll(
      "[data-testid='user-human-turn'], [data-testid='ai-turn']"
    );
```

**Impact:** Gemini fails implicitly due to falling out of the conditional checks, whereas Claude has established support logic that is presumably broken or outdated instead of being unsupported.

---

## D. Why capture fails on those platforms

### Claude
**File:** `browser-extension/content.js`

**Issue:** The hardcoded `data-testid` attributes no longer match Claude's live DOM structure, causing the selector to return an empty NodeList.

**Evidence (code snippet):**
```javascript
    const turns = document.querySelectorAll(
      "[data-testid='user-human-turn'], [data-testid='ai-turn']"
    );
```

**Impact:** `transcript` remains an empty string, triggering the "No conversation found on this page" error in `popup.js`.

### Gemini
**File:** `browser-extension/content.js`

**Issue:** Gemini domains are completely unhandled. The missing `else if` block leaves `transcript` as a default empty string.

**Evidence (code snippet):**
```javascript
  // Gemini is entirely missing from the if/else chain:
  if (hostname.includes("chatgpt.com") || hostname.includes("chat.openai.com")) {
      //...
  } else if (hostname.includes("claude.ai")) {
      //...
  }
  // transcript remains "" for Gemini
```

**Impact:** Capturing on Gemini instantly bails out, throwing the "Could not scrape — is this ChatGPT or Claude?" or "No conversation found on this page" errors.

---

## E. What architectural pattern is currently used (hardcoded vs adapter)
**File:** `browser-extension/content.js`

**Issue:** The script relies on a hardcoded conditional branching pattern (`if/else if`) natively embedded in the content script, rather than a modular adapter design.

**Evidence (code snippet):**
```javascript
  if (hostname.includes("chatgpt.com") || hostname.includes("chat.openai.com")) {
    source = "chatgpt";
    // ...
  } else if (hostname.includes("claude.ai")) {
    source = "claude";
    // ...
  }
```

**Impact:** Any changes to underlying selectors or the addition of new sources require direct modification of the core `content.js` logic, leading to tightly coupled code and harder maintainability moving forward.
