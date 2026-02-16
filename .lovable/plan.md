

# Browser Extension + Supabase with Shared Secret -- Implementation Plan

## Overview

This plan implements the full capture pipeline: a Chrome browser extension that scrapes ChatGPT/Claude conversations, sends them to a Supabase Edge Function protected by a shared secret, which uses AI to summarize and store them. The web app reads captures directly from Supabase and lets users promote them to local projects.

---

## Step 1: Add the `EXTENSION_SHARED_KEY` Secret

Prompt you to set a new Supabase secret called `EXTENSION_SHARED_KEY`. You'll generate a random string (e.g., run `openssl rand -hex 32` in your terminal) and paste it in when prompted.

---

## Step 2: Create the `captures` Database Table

Run a migration to create the table with RLS enabled and a single SELECT policy for the anon role.

```text
Table: captures
-----------------------------------------------
id                      uuid PK (gen_random_uuid)
source                  text
chat_title              text
raw_transcript          text
summary                 text
objective               text
alternatives            jsonb
chosen_direction        text
next_action             text
resolved_to_project_id  text (nullable)
created_at              timestamptz (now())
-----------------------------------------------
RLS: enabled
Policy: "Allow public read" -- SELECT for anon role
No INSERT/UPDATE/DELETE policies (writes via service role only)
```

---

## Step 3: Create Edge Function `capture-extension`

File: `supabase/functions/capture-extension/index.ts`

Config addition to `supabase/config.toml`:
```text
[functions.capture-extension]
verify_jwt = false
```

Responsibilities (POST only):
1. CORS preflight handling (OPTIONS)
2. Reject non-POST methods with 405
3. Read `x-cp-key` header, compare to `Deno.env.get('EXTENSION_SHARED_KEY')` -- return 401 if invalid
4. Parse body: `{ source, chat_title, transcript }`
5. Validate transcript length -- return 400 if > 100,000 characters
6. Call the Lovable AI Gateway with a structured prompt to extract: `summary`, `objective`, `alternatives` (max 3 as JSON array), `chosen_direction`, `next_action`
7. Insert into `captures` table using a Supabase client initialized with `SUPABASE_SERVICE_ROLE_KEY`
8. Return the inserted row

---

## Step 4: Create Browser Extension

Directory: `browser-extension/` at the project root (not part of the web app bundle).

### Files:

**manifest.json** -- Chrome Manifest V3
- Permissions: `activeTab`, `scripting`, `storage`
- Content scripts matching `chat.openai.com/*` and `claude.ai/*`

**content.js** -- DOM scraper
- ChatGPT: selects `[data-message-author-role]` elements, builds `User: ... / Assistant: ...` transcript
- Claude: selects conversation turn elements similarly
- Extracts page title as `chat_title`
- Sends data back to popup via `chrome.runtime.sendMessage`

**popup.html + popup.js** -- Extension popup UI
- Settings inputs (persisted to `chrome.storage.local`):
  - Edge Function URL
  - Shared Key (`x-cp-key` value)
- "Capture This Chat" button
- Status indicator: idle / capturing / sending / success / error
- On capture: injects content script, receives transcript, sends POST to configured URL with `x-cp-key` header

**popup.css** -- Minimal styling matching the Context Parking visual theme

---

## Step 5: Web App -- API Layer + Capture Feed

### New file: `src/lib/api/captures.ts`
- `fetchCaptures()`: reads from the `captures` table using the Supabase anon client (direct DB read, no edge function call)
- Returns typed capture records

### New type addition in `src/types/index.ts`
- Add a `DbCapture` interface matching the database schema (with `alternatives` as `string[]` parsed from jsonb)

### Update `src/pages/Capture.tsx`
- Add a "Recent Captures" section below the existing manual capture form
- Use `@tanstack/react-query` to fetch captures from Supabase
- Each capture card shows: source icon (ChatGPT/Claude), title, summary snippet, relative time
- "Promote to Project" button: creates a local Project from the DB capture's extracted fields and marks `resolved_to_project_id`

### Update `src/pages/Settings.tsx`
- Add an "Extension Setup" card with:
  - Read-only display of the edge function URL for easy copying
  - Brief setup instructions (generate key, add to Supabase secrets, configure in extension)

---

## Step 6: Update README

Add a "Browser Extension Setup" section with steps:
1. Generate a random key
2. Add it as `EXTENSION_SHARED_KEY` in Supabase Edge Function secrets
3. Load the extension unpacked in Chrome
4. Configure the URL and key in the extension popup
5. Navigate to ChatGPT or Claude and click "Capture This Chat"

---

## Technical Notes

- The web app never uses the shared key -- it reads captures via the anon key (allowed by the SELECT RLS policy)
- The edge function is the only write path, using the service role key to bypass RLS for inserts
- The AI Gateway call uses `LOVABLE_API_KEY` (already configured) to extract structured JSON
- No authentication, no user accounts, no login -- just a single shared secret protecting writes

