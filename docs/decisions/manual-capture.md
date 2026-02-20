# Decision: Manual Capture

**Status:** Accepted
**Date:** 2026-02
**Context:** Context Parking captures AI chat sessions for later resume. The system must decide when to capture.

## Decision

Capture is triggered manually by the user clicking a button in the Chrome extension. The system does not automatically record, monitor, or scrape AI conversations.

## Alternatives Considered

**Automatic capture on every page load.** Rejected. Most AI chat sessions are throwaway — debugging, quick lookups, casual questions. Recording everything produces a low-signal archive. Users stop reviewing a feed that is mostly noise.

**Periodic background capture.** Rejected. Arbitrary timing misses the user's intent signal. A capture taken mid-conversation may lack conclusions. A capture taken too late may miss content if the user navigated away.

**Session-end trigger.** Rejected. Browser session boundaries are unreliable. There is no clean "conversation ended" signal from ChatGPT or Claude. Tab close events fire inconsistently across browsers.

## UX Reasoning

The user knows when a conversation contains decisions worth preserving. A deliberate click is a quality signal — it means "this session has value." This produces a workspace of curated, meaningful artifacts rather than an exhaustive log.

Manual capture also means zero surprise. The user is never wondering what was recorded, when, or why. They chose to capture. They know what is stored.

## Privacy Implications

No background monitoring. No persistent DOM observers. No data leaves the browser unless the user explicitly triggers it. This is a hard architectural constraint, not a policy choice — the extension only activates when the popup is opened and the button is clicked.

This makes Context Parking safe to use with sensitive or confidential AI conversations. The user remains in control of what is shared with the backend.

## Deterministic State Advantage

Because capture is manual, the state of the system is fully deterministic from the user's perspective:

- Every item in the dashboard corresponds to an explicit user action.
- There are no phantom captures, partial recordings, or background sync artifacts.
- The capture timestamp reflects when the user decided to preserve context, not when the system happened to run.

This makes the dashboard a reliable record of intentional decisions.

## Cognitive Load Tradeoff

The tradeoff is friction. The user must remember to capture. If they close a valuable conversation without capturing, it is lost.

This is acceptable for three reasons:

1. The cost of re-prompting an AI is low compared to the cost of reviewing a cluttered archive.
2. Users develop a habit quickly — the extension is one click away.
3. The alternative (automatic capture) creates a different cognitive load: reviewing and filtering noise, which is ongoing rather than one-time.

## Consequences

- Lower capture volume → lower storage and AI processing cost.
- Higher signal-to-noise → dashboard is immediately useful.
- User must build the habit of capturing → small onboarding friction.
- No privacy concerns from background recording → trust advantage.
