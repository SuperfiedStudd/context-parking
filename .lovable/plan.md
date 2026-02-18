
## Show AI Provider and Model in Activity Log on Capture Promotion

### What Changes

When a capture is promoted to a project, the initial activity log entry will include which AI provider and model processed it. For example, instead of:

> "Promoted from chatgpt capture"

It will say:

> "Promoted from chatgpt capture (via Claude 4 Sonnet on Anthropic)"

### Technical Details

**File: `src/pages/Capture.tsx`** (line ~131)

Update the `promoteCapture` function to include `ai_provider` and `ai_model` in the activity log description:

```typescript
// Build a descriptive suffix like "(via Claude 4 Sonnet on Anthropic)"
const aiInfo = cap.ai_provider && cap.ai_model
  ? ` (via ${cap.ai_model} on ${cap.ai_provider})`
  : '';

activityLog: [{
  id: generateId(),
  type: 'created',
  description: `Promoted from ${cap.source} capture${aiInfo}`,
  timestamp: new Date().toISOString(),
}],
```

This is a single-line change in one file. The `DbCapture` type already contains `ai_provider` and `ai_model` fields, so no type or schema changes are needed.
