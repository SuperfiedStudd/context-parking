import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// --- Instruction templates by capture type ---

const INSTRUCTION_STRUCTURED =
  "You are reconstructing structured memory from a working session.\n" +
  "Your goal is high-fidelity memory reconstruction, not compression.\n\n" +
  "Extract EXACTLY these fields as JSON:\n" +
  '- "summary": 2-4 sentence overview covering objective, core reasoning, and key constraints\n' +
  '- "objective": What the user was trying to accomplish (1-2 sentences)\n' +
  '- "alternatives": Array of up to 5 strategic forks — competing paths discussed (strings). Preserve important nuance and tradeoffs. If a tradeoff was discussed (e.g. "create new vs update"), explicitly list both sides. Do NOT abstract or generalize specific design forks. If none, empty array.\n' +
  '- "chosen_direction": Core reasoning for the chosen path plus key constraints (technical, cost, scope, token, UX limits). Include deferred decisions verbatim — if the user says to "prioritize revisiting X later", preserve that phrasing exactly. Include open questions. If none, empty string.\n' +
  '- "next_action": Immediate next action ONLY if clearly actionable and agreed. If no clear immediate action exists, state: "No immediate execution step defined."\n\n' +
  "Rules:\n" +
  "- Preserve explicit prioritization statements verbatim.\n" +
  "- Do NOT overly compress reasoning.\n" +
  "- Preserve important nuance and tradeoffs.\n" +
  "- Do NOT abstract or generalize specific design forks.\n" +
  "- Do NOT convert deferred exploration or postponed revisiting into execution steps.\n" +
  "- If revisiting was intentionally postponed, it must appear as a deferred decision, not a next action.\n" +
  "- Do NOT invent new ideas.\n" +
  "- Keep output under ~700 words.\n" +
  "- Clarity over brevity.\n";

const INSTRUCTION_DRAFT =
  "Extract EXACTLY these fields as JSON:\n" +
  '- "summary": 1-2 sentence description of the draft purpose and audience\n' +
  '- "objective": What the draft is intended to communicate (1 sentence)\n' +
  '- "alternatives": Empty array (not applicable for drafts)\n' +
  '- "chosen_direction": The latest draft version text, preserving tone and structure. Remove meta discussion about the draft.\n' +
  '- "next_action": Any remaining edits or send instructions mentioned (1 sentence). If none, empty string.\n';

const CAPTURE_TYPE_INSTRUCTIONS: Record<string, string> = {
  structured: INSTRUCTION_STRUCTURED,
  planning: INSTRUCTION_STRUCTURED,
  draft: INSTRUCTION_DRAFT,
};

function buildSystemPrompt(captureType?: string, userIntent?: string): string {
  const instruction = CAPTURE_TYPE_INSTRUCTIONS[captureType || ""] || INSTRUCTION_PLANNING;

  let prompt =
    "You are a structured data extractor. Given a chat transcript, " +
    instruction +
    "\nReturn ONLY valid JSON, no markdown, no explanation.";

  // Append user intent block if provided (do not modify system prompt structure)
  if (userIntent && userIntent.trim().length > 0) {
    prompt += `\n\nUser Capture Intent:\n${userIntent.trim().substring(0, 300)}`;
  }

  return prompt;
}

// --- Provider calls ---

const VALID_PROVIDERS = ["openai", "anthropic", "google"] as const;
type Provider = typeof VALID_PROVIDERS[number];

const DEFAULT_MODELS: Record<Provider, string> = {
  openai: "gpt-4o-mini",
  anthropic: "claude-3-5-sonnet-latest",
  google: "gemini-2.0-flash",
};

async function callOpenAI(text: string, apiKey: string, model: string, systemPrompt: string) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
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

async function callAnthropic(text: string, apiKey: string, model: string, systemPrompt: string) {
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
      system: systemPrompt,
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

async function callGoogle(text: string, apiKey: string, model: string, systemPrompt: string) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
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

type ProviderFn = (text: string, apiKey: string, model: string, systemPrompt: string) => Promise<{ raw: string; usage: { input_tokens?: number; output_tokens?: number } }>;

const PROVIDER_FN: Record<Provider, ProviderFn> = {
  openai: callOpenAI,
  anthropic: callAnthropic,
  google: callGoogle,
};

// --- Handler ---

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
    const { source, chat_title, transcript, provider, api_key, model, capture_type, user_intent } = body;

    // Logging (no sensitive data)
    console.log("Provider:", provider);
    console.log("Capture type:", capture_type || "planning");
    console.log("User intent provided:", !!user_intent);

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
    const systemPrompt = buildSystemPrompt(capture_type, user_intent);
    const start = Date.now();

    // Call AI provider with type-specific system prompt
    const aiResult = await PROVIDER_FN[provider as Provider](
      `Chat title: ${chat_title || "Untitled"}\n\nTranscript:\n${transcript}`,
      api_key,
      usedModel,
      systemPrompt,
    );

    const latency_ms = Date.now() - start;
    console.log("AI call succeeded in", latency_ms, "ms");

    // Parse structured JSON from AI response
    let parsed;
    try {
      const cleaned = aiResult.raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response:", aiResult.raw.substring(0, 200));
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
        status: "active",
      })
      .select()
      .single();

    if (error) {
      console.error("DB insert error:", error);
      throw new Error(error.message);
    }

    console.log("Capture saved:", data.id);

    return new Response(
      JSON.stringify({
        ...data,
        provider,
        model: usedModel,
        capture_type: capture_type || "planning",
        has_user_intent: !!user_intent,
        usage: aiResult.usage,
        latency_ms,
      }),
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
