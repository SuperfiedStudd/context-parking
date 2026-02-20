# Failure Modes

This document catalogs realistic failure scenarios, system behavior under each, and whether the user loses data.

## Transcript extraction incomplete

**What happens:** The Chrome extension reads the DOM but the chat UI has not fully rendered, or the page structure has changed due to a ChatGPT/Claude update.

**System behavior:** The extension sends whatever transcript it extracted. The Edge Function processes it normally. The AI summary will be based on partial data.

**Data loss:** No. The raw (partial) transcript is stored. The user can identify gaps by reviewing the raw transcript in the dashboard.

**Mitigation:** The extension captures the full scrollable conversation container. Users can scroll to the bottom of a conversation before capturing to ensure full rendering. A future improvement could add a content-length validation warning.

---

## AI provider timeout

**What happens:** The primary AI provider does not respond within the Edge Function timeout window.

**System behavior:** The Edge Function catches the error and attempts the next provider in the fallback chain (OpenAI → Anthropic → Google). If all providers fail, the raw transcript is still written to the database with empty structured fields.

**Data loss:** No. The raw transcript is always persisted. AI-extracted fields may be empty, but the source material is preserved.

**Mitigation:** Multi-provider fallback. The Edge Function attempts each configured provider before giving up on AI processing. Users can re-trigger AI processing via the second opinion feature after the provider recovers.

---

## Supabase write fails

**What happens:** The database insert returns an error (network issue, schema mismatch, Supabase outage).

**System behavior:** The Edge Function returns an error response to the extension. The extension shows an error notification to the user.

**Data loss:** Yes, for this capture. The transcript exists only in the browser DOM at this point. If the user navigates away from the chat, the transcript is lost.

**Mitigation:** The extension could cache the last attempted payload in `chrome.storage.local` for manual retry. This is not currently implemented. In practice, Supabase uptime is high enough that this failure is rare.

---

## Corrupted stored context

**What happens:** The AI provider returns malformed JSON or hallucinates fields that don't match the expected schema.

**System behavior:** The Edge Function parses the AI response with fallback defaults. Missing fields are set to empty strings. The capture is stored with whatever the AI returned.

**Data loss:** No. The raw transcript is stored alongside the AI output. If the structured fields are wrong, the user can read the raw transcript or request a second opinion from a different provider.

**Mitigation:** The structured prompt enforces a JSON schema. Parsing failures fall back to empty fields rather than crashing. The second opinion feature serves as a built-in validation mechanism.

---

## Extension capture interrupted

**What happens:** The user closes the extension popup or navigates away while the capture is in progress (after clicking "Capture This Chat" but before the Edge Function responds).

**System behavior:** The HTTP request to the Edge Function may still complete server-side. The extension popup is destroyed, so the user does not see the success/error notification.

**Data loss:** Depends on timing. If the Edge Function received the full payload, the capture is stored successfully — the user just does not see confirmation. If the request was aborted before reaching the server, no data is stored.

**Mitigation:** The capture flow is fast (typically under 5 seconds). Users can check the dashboard to verify whether the capture was stored. A future improvement could add a "pending captures" indicator.

---

## Shared key compromised

**What happens:** The `EXTENSION_SHARED_KEY` is exposed, allowing unauthorized writes to the captures table.

**System behavior:** Anyone with the key can POST arbitrary transcripts to the Edge Function. The data would be stored in the database alongside legitimate captures.

**Data loss:** No data is lost, but the database is polluted with unauthorized entries.

**Mitigation:** The key can be rotated instantly via Supabase Edge Function Secrets. There is no user-to-key mapping, so rotation affects all extension installations. Users must update the key in the extension popup after rotation.

---

## localStorage cleared

**What happens:** The user clears browser data or switches browsers. All projects and drafts stored in localStorage are lost.

**System behavior:** The Zustand store rehydrates from empty state. Captures in Supabase are unaffected and still appear on the capture page. But promoted projects, drafts, and activity logs are gone.

**Data loss:** Yes, for locally-stored project/draft state. Supabase captures are preserved.

**Mitigation:** This is a known limitation of the local-first architecture. The raw captured context in Supabase serves as a recovery baseline — users can re-promote captures to rebuild their project list. A future improvement could sync project state to Supabase.
