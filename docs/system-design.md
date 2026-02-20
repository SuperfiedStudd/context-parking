# System Design

## System Overview

Context Parking operates as a capture-process-store-resume loop across three layers.

**Capture.** The Chrome extension (Manifest V3) runs a content script on ChatGPT and Claude pages. When the user triggers a capture, the extension extracts the full conversation transcript from the DOM, identifies the chat title and source platform, and sends the payload to a Supabase Edge Function via HTTP POST. Authentication uses a shared key passed in the `x-cp-key` header.

**Process.** The Edge Function (`capture-and-summarize`) receives the raw transcript and routes it to an AI provider. The provider is selected based on available API keys, with fallback ordering: OpenAI, Anthropic, Google. The AI extracts structured fields from the transcript using a deterministic prompt:

- Summary
- Objective
- Strategic alternatives (forks considered)
- Deferred decisions
- Chosen direction
- Next action
- Executive snapshot

The prompt distinguishes between project captures and draft captures, adjusting extraction behavior accordingly.

**Store.** The structured output and raw transcript are written to Supabase PostgreSQL in a single insert. The capture is immediately queryable by the web dashboard. If AI processing fails, the raw transcript is still persisted — no data is lost.

**Resume.** The React web dashboard reads captures from Supabase and presents them in a structured view. The user can promote a capture to a tracked project or a draft message. Projects maintain an activity log, and users can request a second opinion from a different AI provider to cross-validate the extracted context.

## Data Lifecycle

```
Raw transcript (DOM extraction)
  → Transmitted to Edge Function (POST + shared key)
    → AI structured extraction (OpenAI / Anthropic / Google)
      → Stored in PostgreSQL (captures table)
        → Read by web dashboard (anon key)
          → Promoted to project or draft (localStorage + Zustand)
            → Second opinion requested (optional, different AI provider)
              → Updated in PostgreSQL (second_opinions table)
```

Each stage is independent. A failure at any point after persistence does not lose the captured data.

## Why This Architecture

**Why Edge Functions.** AI API keys must not be exposed to the browser. Edge Functions run server-side on Supabase infrastructure, keeping keys secure while remaining stateless and easy to deploy. They also enable consistent prompt engineering — every capture goes through the same extraction logic regardless of the client.

**Why Supabase.** The system needs durable, queryable storage accessible from any machine. Supabase provides PostgreSQL with a REST API, row-level security capabilities, and a generous free tier. It eliminates the need for a custom backend server while supporting structured queries, migrations, and future multi-device access.

**Why a browser extension.** ChatGPT and Claude do not expose conversation history via public API. The only reliable way to extract a full transcript is DOM access, which requires a browser extension. The extension also captures metadata (source platform, chat title) automatically, removing friction from the capture flow.

**Why manual capture.** Automatic recording of all AI conversations creates noise and raises privacy concerns. The user decides which sessions are worth preserving. This produces a high-signal dataset of meaningful work rather than an exhaustive log.

**Why localStorage for projects.** Projects and drafts are local-first by design. The user's organizational structure (which captures become projects, how they are grouped) is personal and does not need to sync across devices in the current architecture. localStorage with Zustand provides instant reads with zero latency and no network dependency.

**Why multi-provider AI routing.** No single AI provider has perfect uptime or consistent quality across all transcript types. Supporting OpenAI, Anthropic, and Google with automatic fallback ensures captures are processed even when a provider is down. The second opinion feature leverages this same routing to let users validate extractions.
