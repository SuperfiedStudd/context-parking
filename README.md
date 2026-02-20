# Context Parking

A local-first tool for parking context from AI chat sessions — track decisions, manage follow-ups, and draft outbound messages.

## Quickstart (2 minutes)

```sh
git clone https://github.com/YOUR_USERNAME/context-keeper.git
cd context-keeper
cp .env.example .env          # then fill in your Supabase credentials
npm install
npm run dev
```

Open [http://localhost:8080](http://localhost:8080) in your browser.

## Environment Setup

Create a `.env` file in the project root (or copy `.env.example`):

```
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

You can find these values in your [Supabase Dashboard → Settings → API](https://supabase.com/dashboard).

## Supabase Edge Functions

Deploy the capture edge function:

```sh
npx supabase functions deploy capture-and-summarize
```

Set the shared key used by the browser extension:

```sh
npx supabase secrets set EXTENSION_SHARED_KEY=$(openssl rand -hex 32)
```

Save the key — you'll need it when configuring the browser extension.

## Browser Extension

1. Open `chrome://extensions/`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked** → select the `browser-extension/` directory
4. Click the extension icon and enter:
   - **Edge Function URL:** `https://YOUR_PROJECT.supabase.co/functions/v1/capture-extension`
   - **Shared Key:** the key from the step above
5. Navigate to [ChatGPT](https://chat.openai.com) or [Claude](https://claude.ai), open a conversation, and click **Capture This Chat**

## Tech Stack

- **Frontend:** React + Vite + TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **State:** Zustand (local) + Supabase (captures DB)
- **AI:** Supabase Edge Functions → OpenAI / Anthropic / Google

## Architecture

```
Browser Extension → POST /capture-extension → Edge Function → AI → Supabase DB
Web App → reads captures from DB via anon key
```

No authentication or user accounts — a single shared secret protects writes.

## Scripts

| Command           | Description              |
|-------------------|--------------------------|
| `npm run dev`     | Start dev server         |
| `npm run build`   | Production build         |
| `npm run lint`    | Lint with ESLint         |
| `npm run test`    | Run tests                |
| `npm run preview` | Preview production build |

## License

MIT
