import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT =
  "You are a structured data extractor. Given a chat transcript, extract EXACTLY these fields as JSON:\n" +
  '- "summary": 2-3 sentence overview of the conversation\n' +
  '- "objective": What the user was trying to accomplish (1 sentence)\n' +
  '- "alternatives": Array of up to 3 approaches/options discussed (strings). If none, empty array.\n' +
  '- "chosen_direction": Which approach was favored (1 sentence). If none, empty string.\n' +
  '- "next_action": Suggested next step (1 sentence). If none, empty string.\n\n' +
  "Return ONLY valid JSON, no markdown, no explanation.";

const VALID_PROVIDERS = ["openai", "anthropic", "google"] as const;
type Provider = typeof VALID_PROVIDERS[number];

const DEFAULT_MODELS: Record<Provider, string> = {
  openai: "gpt-4o-mini",
  anthropic: "claude-3-5-sonnet-latest",
  google: "gemini-2.0-flash",
};

async function callOpenAI(text: string, apiKey: string, model: string) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: text },
      ],
      temperature: 0.2,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `OpenAI error ${res.status}`);
  }
  const data = await res.json();
  return {
    raw: data.choices?.[0]?.message?.content ?? "{}",
    usage: {
      input_tokens: data.usage?.prompt_tokens,
      output_tokens: data.usage?.completion_tokens,
    },
  };
}

async function callAnthropic(text: string, apiKey: string, model: string) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: text }],
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Anthropic error ${res.status}`);
  }
  const data = await res.json();
  const content = data.content?.find((b: any) => b.type === "text");
  return {
    raw: content?.text ?? "{}",
    usage: {
      input_tokens: data.usage?.input_tokens,
      output_tokens: data.usage?.output_tokens,
    },
  };
}

async function callGoogle(text: string, apiKey: string, model: string) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ parts: [{ text }] }],
      generationConfig: { temperature: 0.2 },
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Google AI error ${res.status}`);
  }
  const data = await res.json();
  const part = data.candidates?.[0]?.content?.parts?.[0];
  const meta = data.usageMetadata;
  return {
    raw: part?.text ?? "{}",
    usage: {
      input_tokens: meta?.promptTokenCount,
      output_tokens: meta?.candidatesTokenCount,
    },
  };
}

const PROVIDER_FN: Record<Provider, typeof callOpenAI> = {
  openai: callOpenAI,
  anthropic: callAnthropic,
  google: callGoogle,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { source, chat_title, transcript, provider, api_key, model } = body;

    // Validate required fields
    if (!transcript) {
      return new Response(JSON.stringify({ error: "Missing field: transcript" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!provider || !VALID_PROVIDERS.includes(provider)) {
      return new Response(
        JSON.stringify({ error: `Invalid provider. Must be one of: ${VALID_PROVIDERS.join(", ")}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (!api_key) {
      return new Response(JSON.stringify({ error: "Missing field: api_key" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (transcript.length > 500_000) {
      return new Response(JSON.stringify({ error: "Transcript too large (max 500k chars)" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const usedModel = model || DEFAULT_MODELS[provider as Provider];
    const start = Date.now();

    // Call AI provider directly with user's BYOK key
    const aiResult = await PROVIDER_FN[provider as Provider](
      `Chat title: ${chat_title || "Untitled"}\n\nTranscript:\n${transcript}`,
      api_key,
      usedModel,
    );

    const latency_ms = Date.now() - start;

    // Parse structured JSON from AI response
    let parsed;
    try {
      const cleaned = aiResult.raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response");
      parsed = { summary: "", objective: "", alternatives: [], chosen_direction: "", next_action: "" };
    }

    const alternatives = Array.isArray(parsed.alternatives) ? parsed.alternatives.slice(0, 3) : [];

    // Atomic DB insert via service role
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data, error } = await supabase
      .from("captures")
      .insert({
        source: source || "unknown",
        chat_title: chat_title || "Untitled",
        raw_transcript: transcript,
        summary: parsed.summary || "",
        objective: parsed.objective || "",
        alternatives,
        chosen_direction: parsed.chosen_direction || "",
        next_action: parsed.next_action || "",
      })
      .select()
      .single();

    if (error) {
      console.error("DB insert error:", error);
      throw new Error(error.message);
    }

    return new Response(
      JSON.stringify({ ...data, provider, model: usedModel, usage: aiResult.usage, latency_ms }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("capture-and-summarize error:", (err as Error).message);
    return new Response(
      JSON.stringify({ error: (err as Error).message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
