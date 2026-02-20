# Infrastructure Decisions

## Supabase PostgreSQL over self-hosted database

**Alternative considered:** SQLite local storage, Firebase, self-hosted Postgres.

**Why rejected:** SQLite does not persist across devices or browser resets. Firebase introduces vendor-specific query patterns and limited relational modeling. Self-hosted Postgres requires server management, deployment pipelines, and uptime monitoring disproportionate to the system's current scale.

**Why Supabase:** Managed Postgres with RESTful access, automatic migrations, row-level security, and a free tier that covers the use case. The anon key model provides read access without authentication overhead. Structured queries support future features (search, filtering, analytics) without replatforming.

**Operational impact:** Zero infrastructure to manage. Deploys via CLI. Database schema managed through migration files checked into source.

---

## Edge Functions over application server

**Alternative considered:** Express.js server, Next.js API routes, direct client-side AI calls.

**Why rejected:** An Express server requires hosting, scaling, and monitoring. Next.js API routes add framework coupling and deployment complexity. Client-side AI calls expose API keys in the browser.

**Why Edge Functions:** Supabase Edge Functions run on Deno Deploy infrastructure — stateless, auto-scaling, deployed with a single CLI command. AI API keys stay server-side. The function runs only when a capture is triggered, so there is no idle compute cost.

**Operational impact:** No servers to maintain. Cold start latency is acceptable because captures are user-initiated (not real-time). Logs available in Supabase dashboard.

---

## Browser extension over embedded scraping

**Alternative considered:** Bookmarklet, server-side scraping, ChatGPT API export, copy-paste flow.

**Why rejected:** ChatGPT and Claude do not expose conversation history via public API. Server-side scraping requires authentication tokens and breaks on UI changes. Bookmarklets have limited DOM access and cannot persist state. Copy-paste adds friction and loses metadata.

**Why extension:** Chrome Manifest V3 extensions have full DOM access on matched pages. The extension reads the conversation transcript directly, captures the chat title and source platform automatically, and triggers the capture flow with a single click. It also enables a configuration sync bridge between the web app and extension via `postMessage`.

**Operational impact:** Users must install the extension manually via Developer mode. This is acceptable for a developer-facing tool. The extension has no background process running continuously — it activates only when the popup is opened.

---

## Manual capture over automatic memory

**Alternative considered:** Auto-capture on every page load, periodic background capture, session-end trigger.

**Why rejected:** Automatic capture generates noise. Most AI chat sessions are exploratory — throwaway questions, debugging, casual lookups. Recording everything creates a low-signal archive that users stop reviewing. Periodic capture misses the user's judgment about which sessions matter. Session-end triggers are unreliable in browser environments.

**Why manual:** The user knows when a conversation contains real decisions. A deliberate click filters for signal. This produces a workspace of meaningful artifacts rather than an exhaustive log. It also avoids privacy concerns — nothing is captured without explicit user action.

**Operational impact:** Lower volume of captures means less storage and AI processing cost. Higher signal-to-noise makes the dashboard immediately useful.

---

## Multi-provider AI routing over single provider

**Alternative considered:** OpenAI-only, Anthropic-only, user-selected single provider.

**Why rejected:** No single provider has perfect uptime, rate limits, or consistent quality across all transcript types. User-selected single provider means captures fail when that provider is down.

**Why multi-provider:** The system maintains an ordered fallback chain (OpenAI → Anthropic → Google). If the primary provider fails, the next is attempted automatically. The second opinion feature uses this same routing to let users cross-validate extractions against a different model. Users configure which providers are available through the setup wizard.

**Operational impact:** Requires API keys for at least one provider. More keys means better reliability. AI cost scales linearly with captures, not with time.
