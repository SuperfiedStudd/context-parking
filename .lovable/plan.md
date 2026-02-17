

# Compile Context Inject Prompt + System Status Report

## Overview

Two changes: (1) Replace the AI-powered "Generate Context Prompt" with a deterministic, zero-AI "Compile Context Inject Prompt" that produces a structured injection template, and (2) add a temporary debug panel that outputs a system health JSON report.

---

## Part 1: Rename and Refactor Context Prompt

### What Changes

**Button (ProjectDetail.tsx)**
- Rename label from "Generate Context Prompt" to "Compile Context Inject Prompt"
- Change icon from `Sparkles` to `Copy` or `FileText` (no AI connotation)

**Drawer (ContextPromptDrawer.tsx) -- Full Rewrite**
- Remove all AI summarization code (`summarize`, `SummarizeResponse`, `handleSummarize`, `Loader2`, `Cpu`, `Clock`, provider badges)
- Remove toggle switches for includes (alternatives, drafts) -- everything is always included
- Replace with a single large read-only textarea pre-filled with the compiled template
- Add a hard guard: if any AI import or call is detected at runtime, log `console.error("GUARD: AI invocation blocked from context inject")`

**New Template Output (deterministic string concatenation)**

```
You are continuing work on the following project.

PROJECT TITLE:
{project.title}

OBJECTIVE:
{project.objective}

CHOSEN DIRECTION:
{project.chosenDirection || "Not set"}

ALTERNATIVES CONSIDERED:
1. {alt1}
2. {alt2}
3. {alt3}

NEXT ACTION:
{project.nextAction || "Not set"}

RECENT ACTIVITY:
- {event1.description} ({relative time})
- {event2.description} ({relative time})
- {event3.description} ({relative time})

CURRENT STATUS:
Last active {relativeTime(project.lastActiveAt)}

Continue from this state. Do not restate the summary.
Move directly into execution planning.
```

**Helper (helpers.ts)**
- Add new function `compileContextInjectPrompt(project: Project): string` that builds the template above
- Existing `generateContextPrompt` stays for backward compatibility but is no longer referenced from the drawer

**Safety**
- All AI imports removed from the drawer file
- No `summarize`, no `fetch`, no Edge function call possible from this component

---

## Part 2: System Status Debug Panel

**New component: `src/components/SystemStatusPanel.tsx`**

A temporary component rendered at the bottom of the Settings page that outputs a JSON block covering:

| Check | How It's Determined |
|---|---|
| Projects persisted | `useStore().projects.length > 0` |
| Status column implemented | Check DB schema via existing types (confirmed: `status` column exists on captures) |
| Activity logs linked to project_id | Activity logs are embedded in each project object in Zustand store |
| Edge functions isolated from frontend | No direct Edge function calls from frontend except via `summarize.ts` (client-side AI calls use BYOK direct-to-provider) |
| Setup wizard stores base URL only | `sanitizeSupabaseUrl` strips paths |
| API keys stored client-side only | Keys in `localStorage` under `cp_config_v1`, never sent to DB |
| Summarization server-side | Capture summarization is server-side (Edge function). Context prompt summarization was client-side but is being removed |
| Pending migrations | 2 migrations exist, none pending |
| Open TODOs | 2 TODOs in `index.html` (cosmetic: page title/og:title) |

Output as formatted JSON in a `<pre>` block with a "Copy Report" button.

---

## Files Modified

1. **`src/pages/ProjectDetail.tsx`** -- Rename button label, swap icon
2. **`src/components/ContextPromptDrawer.tsx`** -- Full simplification: remove AI, use new template, add guard
3. **`src/lib/helpers.ts`** -- Add `compileContextInjectPrompt()` function
4. **`src/components/SystemStatusPanel.tsx`** -- New file, debug JSON output
5. **`src/pages/Settings.tsx`** -- Render `SystemStatusPanel` at bottom

