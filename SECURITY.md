# Security

## Data Storage

| Data | Location | Persistence |
|------|----------|-------------|
| Raw chat transcripts | Supabase PostgreSQL | Permanent until deleted |
| AI-extracted context | Supabase PostgreSQL | Permanent until deleted |
| Projects and drafts | Browser localStorage | Until browser data cleared |
| AI provider API keys | Browser localStorage | Until browser data cleared |
| Extension shared key | Chrome extension storage | Until extension removed |

## API Keys

AI provider API keys (OpenAI, Anthropic, Google) are entered through the in-app setup wizard and stored in browser `localStorage`. They are sent directly from the browser to the respective AI provider for second opinion requests. For capture processing, the Edge Function uses its own server-side keys.

API keys are never:
- Committed to source code
- Logged by the Edge Function
- Transmitted to any third-party service
- Stored in Supabase

## Extension Authentication

The browser extension authenticates with the Edge Function using a shared key (`EXTENSION_SHARED_KEY`) passed in the `x-cp-key` HTTP header. This key is stored as a Supabase Edge Function Secret and in the extension's Chrome storage.

There are no user accounts, sessions, or tokens. Write access is controlled solely by the shared key. Read access uses the Supabase anon key (public, read-only by RLS policy).

## Repository

This repository contains no secrets, API keys, or credentials. Environment variables are loaded from a local `.env` file which is excluded from version control via `.gitignore`.

## Transcript Privacy

Transcripts are stored as-is in Supabase. There is no redaction, anonymization, or PII filtering. Users should be aware that any sensitive content in their AI conversations will be stored in their Supabase database.

No telemetry, analytics, or usage data is collected or transmitted.

## Reporting Vulnerabilities

If you discover a security issue, please open a GitHub issue or contact the maintainer directly.
