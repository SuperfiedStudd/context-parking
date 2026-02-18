// Second Opinion: reuses BYOK provider orchestration from summarize
import { getConfig, getEnabledProviders, type AiProvider } from '@/lib/configStore';
import { resolveModel } from './models';

export interface SecondOpinionRequest {
  compiledContext: string;
  instruction?: string;
}

export interface SecondOpinionResult {
  response: string;
  provider: AiProvider;
  model: string;
  latency_ms: number;
}

const SYSTEM_PROMPT =
  'You are a senior strategic advisor. The user will provide structured project context and an optional instruction. Analyze the context critically. Identify blind spots, risks, contradictions, and missed opportunities. Provide a clear, actionable second opinion. Be direct and specific — no filler. Use markdown formatting.';

async function callOpenAI(text: string, key: string, model: string): Promise<{ response: string; model: string }> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: text },
      ],
      temperature: 0.4,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `OpenAI error ${res.status}`);
  }
  const data = await res.json();
  return { response: data.choices?.[0]?.message?.content?.trim() ?? '', model };
}

async function callAnthropic(text: string, key: string, model: string): Promise<{ response: string; model: string }> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model,
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: text }],
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Anthropic error ${res.status}`);
  }
  const data = await res.json();
  const content = data.content?.find((b: any) => b.type === 'text');
  return { response: content?.text?.trim() ?? '', model };
}

async function callGoogle(text: string, key: string, model: string): Promise<{ response: string; model: string }> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ parts: [{ text }] }],
      generationConfig: { temperature: 0.4 },
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Google AI error ${res.status}`);
  }
  const data = await res.json();
  const part = data.candidates?.[0]?.content?.parts?.[0];
  return { response: part?.text?.trim() ?? '', model };
}

const PROVIDER_FN: Record<AiProvider, (text: string, key: string, model: string) => Promise<{ response: string; model: string }>> = {
  openai: callOpenAI,
  anthropic: callAnthropic,
  google: callGoogle,
};

export async function getSecondOpinion(req: SecondOpinionRequest): Promise<SecondOpinionResult> {
  const config = getConfig();
  if (!config) throw new Error('Setup not complete. Configure AI providers in Settings.');

  const enabled = getEnabledProviders(config);
  if (enabled.length === 0) throw new Error('No AI providers configured.');

  // Build the prompt
  let prompt = req.compiledContext;
  if (req.instruction?.trim()) {
    prompt += `\n\n---\n\n**Focus Instruction:** ${req.instruction.trim()}`;
  }

  const ordered = [config.ai.primaryProvider, ...enabled.filter((p) => p !== config.ai.primaryProvider)];
  let lastError: Error | null = null;

  for (const provider of ordered) {
    const providerConfig = config.ai.providers[provider];
    const key = providerConfig?.apiKey;
    if (!key) continue;

    const model = resolveModel(provider, providerConfig?.model);
    const fn = PROVIDER_FN[provider];
    const start = Date.now();

    try {
      const result = await fn(prompt, key, model);
      return {
        response: result.response,
        provider,
        model: result.model,
        latency_ms: Date.now() - start,
      };
    } catch (err: any) {
      lastError = err;
    }
  }

  throw lastError ?? new Error('All providers failed.');
}
