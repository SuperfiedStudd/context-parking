// BYOK AI provider implementations — client-side only
// NEVER log API keys

export interface SummarizeResult {
  summary: string;
  model: string;
  usage?: { input_tokens?: number; output_tokens?: number };
}

const SYSTEM_PROMPT =
  'You are a structured summarizer for AI chat transcripts. Extract: objective, chosen direction, alternatives considered, key decisions, and next action. Output clean markdown sections.';

/** Returns true for OpenAI o-series reasoning models that don't support temperature */
function isReasoningModel(model: string): boolean {
  return /^o\d/.test(model);
}

export async function summarizeWithOpenAI(
  text: string,
  apiKey: string,
  model = 'gpt-4.1-mini',
): Promise<SummarizeResult> {
  console.log('[Providers] OpenAI using model:', model);

  const body: Record<string, unknown> = {
    model,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: text },
    ],
  };

  // o-series models do not support temperature
  if (!isReasoningModel(model)) {
    body.temperature = 0.3;
  }

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `OpenAI error ${res.status}`);
  }

  const data = await res.json();
  return {
    summary: data.choices?.[0]?.message?.content?.trim() ?? '',
    model,
    usage: {
      input_tokens: data.usage?.prompt_tokens,
      output_tokens: data.usage?.completion_tokens,
    },
  };
}

/** Error class for Anthropic model-access / 403 errors */
export class ProviderUnavailableError extends Error {
  provider: string;
  constructor(provider: string, message: string) {
    super(message);
    this.name = 'ProviderUnavailableError';
    this.provider = provider;
  }
}

export async function summarizeWithAnthropic(
  text: string,
  apiKey: string,
  model = 'claude-4-sonnet',
): Promise<SummarizeResult> {
  console.log('[Providers] Anthropic using model:', model);
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: text }],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = err?.error?.message || `Anthropic error ${res.status}`;
    // 403 or model-not-found → treat as provider unavailable
    if (res.status === 403 || /not.*found|not.*available|access|permission/i.test(msg)) {
      throw new ProviderUnavailableError('anthropic', `Anthropic unavailable: ${msg}`);
    }
    throw new Error(msg);
  }

  const data = await res.json();
  const content = data.content?.find((b: any) => b.type === 'text');
  return {
    summary: content?.text?.trim() ?? '',
    model,
    usage: {
      input_tokens: data.usage?.input_tokens,
      output_tokens: data.usage?.output_tokens,
    },
  };
}

export async function summarizeWithGoogle(
  text: string,
  apiKey: string,
  model = 'gemini-2.0-flash',
): Promise<SummarizeResult> {
  console.log('[Providers] Google using model:', model);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ parts: [{ text }] }],
      generationConfig: { temperature: 0.3 },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err?.error?.message || `Google AI error ${res.status}`,
    );
  }

  const data = await res.json();
  const part = data.candidates?.[0]?.content?.parts?.[0];
  const meta = data.usageMetadata;
  return {
    summary: part?.text?.trim() ?? '',
    model,
    usage: {
      input_tokens: meta?.promptTokenCount,
      output_tokens: meta?.candidatesTokenCount,
    },
  };
}
