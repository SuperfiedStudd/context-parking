# Context Parking

A local-first tool for parking context from AI chat sessions, tracking decisions, and managing follow-ups.

## Tech Stack

- React + Vite + TypeScript
- Tailwind CSS + shadcn/ui
- Zustand (local state)
- Supabase (captures database + edge functions)

## Getting Started

```sh
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
npm i
npm run dev
```

---

## Browser Extension Setup

The browser extension captures ChatGPT and Claude conversations, sends them to a Supabase Edge Function for AI summarization, and stores them in the database.

### 1. Generate a Shared Key

```sh
openssl rand -hex 32
```

Copy the output — you'll use it in the next two steps.

### 2. Add the Key to Supabase

Go to your [Supabase Edge Function Secrets](https://supabase.com/dashboard/project/sdjdzvcwfcdtngknrasp/settings/functions) and add:

- **Name:** `EXTENSION_SHARED_KEY`
- **Value:** the key you generated above

### 3. Load the Extension in Chrome

1. Open `chrome://extensions/`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the `browser-extension/` directory from this repo

### 4. Configure the Extension

Click the extension icon in Chrome and enter:

- **Edge Function URL:** `https://sdjdzvcwfcdtngknrasp.supabase.co/functions/v1/capture-extension`
- **Shared Key:** the key from step 1

Click **Save Settings**.

### 5. Capture a Conversation

1. Navigate to [ChatGPT](https://chat.openai.com) or [Claude](https://claude.ai)
2. Open a conversation
3. Click the extension icon
4. Click **Capture This Chat**

The conversation will be summarized by AI and stored in your Supabase database. View captured sessions on the **Capture** page in the web app.

---

## Architecture

- **Browser Extension** → POST with `x-cp-key` header → **Edge Function** → AI summarize → **Supabase DB**
- **Web App** → reads captures from DB via anon key (no shared key needed)
- No authentication, no user accounts — just a single shared secret protecting writes
