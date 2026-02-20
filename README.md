<div align="center">

# 🅿️ Context Parking

**AI conversations are full of decisions, trade-offs, and next steps — but they vanish when you close the tab.**

Context Parking captures your ChatGPT and Claude sessions, uses AI to extract what matters,<br>and gives you a dashboard to track projects, park drafts, and never lose context again.

[![Built with React](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=white)](https://react.dev)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3fcf8e?logo=supabase&logoColor=white)](https://supabase.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>

---

## ⚡ 2-Minute Demo

```
1. npm install && npm run dev        → Dashboard opens at localhost:8080
2. Load browser-extension/ in Chrome → Extension ready
3. Open a ChatGPT or Claude chat     → Click "Capture This Chat"
4. Return to dashboard               → Project appears with AI summary
```

---

## 🏗️ Architecture

```mermaid
graph TB
  subgraph Client ["🖥️ Client Layer"]
    EXT["Chrome Extension<br/><i>popup.js + content script</i>"]
    WEB["Web Dashboard<br/><i>React + Vite + Zustand</i>"]
  end

  subgraph Backend ["⚙️ Backend Layer"]
    EDGE["Supabase Edge Function<br/><i>capture-and-summarize</i>"]
    AI_ROUTER{"AI Router"}
    OPENAI["OpenAI<br/><i>GPT-4.1</i>"]
    ANTHROPIC["Anthropic<br/><i>Claude 4 Sonnet</i>"]
    GOOGLE["Google<br/><i>Gemini 2.0 Flash</i>"]
  end

  subgraph Storage ["💾 Storage Layer"]
    DB[("Supabase PostgreSQL<br/><i>captures table</i>")]
    LOCAL["Browser localStorage<br/><i>projects + drafts</i>"]
  end

  EXT -- "POST /capture-extension<br/>x-cp-key auth" --> EDGE
  EDGE --> AI_ROUTER
  AI_ROUTER --> OPENAI
  AI_ROUTER --> ANTHROPIC
  AI_ROUTER --> GOOGLE
  OPENAI & ANTHROPIC & GOOGLE -- "structured JSON" --> EDGE
  EDGE -- "insert" --> DB
  DB -- "read (anon key)" --> WEB
  WEB -- "promote to project/draft" --> LOCAL

  style Client fill:#1e293b,stroke:#334155,color:#e2e8f0
  style Backend fill:#0f172a,stroke:#1e3a5f,color:#e2e8f0
  style Storage fill:#1a1a2e,stroke:#16213e,color:#e2e8f0
  style EXT fill:#2563eb,stroke:#1d4ed8,color:#fff
  style WEB fill:#0ea5e9,stroke:#0284c7,color:#fff
  style EDGE fill:#3b82f6,stroke:#2563eb,color:#fff
  style AI_ROUTER fill:#6366f1,stroke:#4f46e5,color:#fff
  style OPENAI fill:#10a37f,stroke:#0d8c6d,color:#fff
  style ANTHROPIC fill:#d97706,stroke:#b45309,color:#fff
  style GOOGLE fill:#4285f4,stroke:#3367d6,color:#fff
  style DB fill:#3fcf8e,stroke:#22c55e,color:#000
  style LOCAL fill:#64748b,stroke:#475569,color:#fff
```

---

## 📸 Screenshots

<!-- Replace with actual screenshots -->
> _Coming soon — run locally and explore the dashboard._

| Dashboard | Capture Flow | Draft Editor |
|-----------|--------------|--------------|
| _screenshot_ | _screenshot_ | _screenshot_ |

---

## 🚀 Quickstart

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier works)
- An API key for at least one AI provider (OpenAI, Anthropic, or Google)

### 1. Clone & Install

```sh
git clone https://github.com/YOUR_USERNAME/context-keeper.git
cd context-keeper
npm install
```

### 2. Configure Environment

```sh
cp .env.example .env
```

Edit `.env` with your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

> Find these in [Supabase Dashboard → Settings → API](https://supabase.com/dashboard)

### 3. Deploy Edge Function

```sh
npx supabase functions deploy capture-and-summarize
```

### 4. Start the App

```sh
npm run dev
```

Open [http://localhost:8080](http://localhost:8080) — the **Setup Wizard** will guide you through AI provider configuration on first launch.

---

## 🧩 Browser Extension

1. Open `chrome://extensions/`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked** → select `browser-extension/`
4. Click the extension icon and configure:
   - **Edge Function URL** — `https://your-project.supabase.co/functions/v1/capture-extension`
   - **Shared Key** — generate one:
     ```sh
     openssl rand -hex 32
     ```
     Then add it as `EXTENSION_SHARED_KEY` in [Supabase Edge Function Secrets](https://supabase.com/dashboard)
5. Navigate to ChatGPT or Claude → open a conversation → **Capture This Chat**

---

## 🔐 Environment Variables

| Variable | Description | Where to Find |
|----------|-------------|---------------|
| `VITE_SUPABASE_URL` | Supabase project URL | Dashboard → Settings → API |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/public key | Dashboard → Settings → API |

AI provider keys (OpenAI, Anthropic, Google) are configured through the **Setup Wizard** in the web app and stored in browser `localStorage` — never committed to code.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 · Vite · TypeScript |
| Styling | Tailwind CSS · shadcn/ui |
| State | Zustand (local) · Supabase (captures) |
| AI | OpenAI · Anthropic · Google (via Edge Function) |
| Backend | Supabase Edge Functions (Deno) |
| Database | Supabase PostgreSQL |
| Extension | Chrome Manifest V3 |

---

## 📁 Project Structure

```
context-keeper/
├── src/                    # React web application
│   ├── components/         # UI components
│   ├── pages/              # Route pages
│   ├── store/              # Zustand state
│   ├── lib/                # Utilities and API
│   └── integrations/       # Supabase client
├── browser-extension/      # Chrome extension (MV3)
├── supabase/
│   ├── functions/          # Edge functions
│   └── migrations/         # Database migrations
└── public/                 # Static assets
```

---

## 📋 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run lint` | Lint with ESLint |
| `npm run test` | Run tests |
| `npm run preview` | Preview production build |

---

## 📄 License

MIT
