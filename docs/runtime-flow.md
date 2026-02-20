# Runtime Flow

## Capture Sequence

The following diagram shows the complete runtime flow from user action through AI processing to context resume, including failure paths.

```mermaid
sequenceDiagram
    actor User
    participant Ext as Chrome Extension
    participant Edge as Edge Function
    participant AI1 as Primary AI Provider
    participant AI2 as Fallback AI Provider
    participant DB as Supabase
    participant Dash as Web Dashboard

    User->>Ext: Click "Capture This Chat"
    Ext->>Ext: Extract transcript from DOM
    Ext->>Edge: POST /capture-extension (transcript + shared key)

    Edge->>Edge: Validate shared key
    Edge->>Edge: Parse request body

    Edge->>AI1: Send transcript + structured prompt
    alt AI1 responds
        AI1-->>Edge: Structured JSON (summary, objective, next action...)
    else AI1 timeout or error
        Edge->>AI2: Retry with fallback provider
        alt AI2 responds
            AI2-->>Edge: Structured JSON
        else AI2 also fails
            Note over Edge: Raw transcript preserved even if AI fails
        end
    end

    Edge->>DB: INSERT into captures table
    DB-->>Edge: Row ID confirmation
    Edge-->>Ext: 200 OK + capture metadata
    Ext-->>User: Success notification

    Note over User,Dash: Later...

    User->>Dash: Open dashboard
    Dash->>DB: SELECT captures
    DB-->>Dash: Capture rows
    Dash-->>User: Display structured context
    User->>Dash: Promote to project or draft
    Dash->>Dash: Write to localStorage

    opt Second Opinion
        User->>Dash: Request second opinion
        Dash->>AI1: Send context for re-analysis
        AI1-->>Dash: Alternative analysis
        Dash->>DB: INSERT into second_opinions
    end
```

## Key Behaviors

**Timeout handling.** AI provider calls have implicit timeouts at the Edge Function level. If the primary provider does not respond, the system moves to the next available provider in the fallback chain.

**Retry path.** The fallback order is determined by available API keys: OpenAI → Anthropic → Google. Each provider is attempted once. If all fail, the raw transcript is still written to the database — no data is lost.

**Persistence confirmation.** The Edge Function does not return 200 to the extension until the database write completes. If the database write fails, the extension receives an error and the user is notified.

**Data durability.** The raw transcript is always persisted regardless of AI processing outcome. Structured fields may be empty if AI extraction fails, but the source material is never lost.
