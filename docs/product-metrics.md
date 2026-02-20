# Product Metrics

## Activation

**Metric:** First successful capture.

A user is activated when they install the extension, configure it, and complete their first capture that is stored in Supabase. This is the minimum proof that the system works end-to-end for that user.

**Measurement:** Count of users (by browser instance) with at least one row in the `captures` table.

## Retention

**Metric:** Returning users who resume saved context.

A user is retained when they return to the dashboard and interact with a previously captured session — promoting it to a project, editing a draft, or requesting a second opinion. Passive dashboard views do not count.

**Measurement:** Count of users who perform a promote, edit, or second opinion action on a capture older than 24 hours.

## Success

**Metric:** Sessions resumed without re-asking AI.

The system succeeds when a user resumes work from captured context without needing to re-prompt the original AI chat. This means the extracted structure (summary, objective, next action) was sufficient to continue.

**Measurement:** Projects with activity log entries beyond the initial promotion, indicating the user continued working from the captured context.

## Failure

**Metric:** Capture stored but never resumed.

A capture that sits in the database without being promoted or interacted with represents wasted effort — the system captured context that the user did not find valuable enough to use.

**Measurement:** Captures older than 7 days with no associated project, draft, or second opinion.

## Instrumentation Notes

The current system does not include analytics tracking. These metrics would be measured via Supabase queries against the `captures`, `second_opinions`, and localStorage state. No telemetry is sent to external services.

| Metric | Signal | Data Source |
|--------|--------|-------------|
| Activation | First capture stored | `captures` table |
| Retention | Action on old capture | `captures` + localStorage |
| Success | Continued project work | localStorage activity log |
| Failure | Orphaned capture | `captures` table (no join) |
