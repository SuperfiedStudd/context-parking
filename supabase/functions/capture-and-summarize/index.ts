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
    const { source, chat_title, transcript } = await req.json();

    if (!transcript) {
      return new Response(JSON.stringify({ error: "Missing field: transcript" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (transcript.length > 500_000) {
      return new Response(JSON.stringify({ error: "Transcript too large (max 500k chars)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const start = Date.now();

    // Call AI Gateway (server-side, uses LOVABLE_API_KEY)
    const aiRes = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: `Chat title: ${chat_title || "Untitled"}\n\nTranscript:\n${transcript}` },
          ],
          temperature: 0.2,
        }),
      }
    );

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("AI Gateway error:", errText);
      throw new Error(`AI Gateway returned ${aiRes.status}`);
    }

    const aiData = await aiRes.json();
    const rawContent = aiData.choices?.[0]?.message?.content || "{}";
    const latency_ms = Date.now() - start;

    let parsed;
    try {
      const cleaned = rawContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response");
      parsed = { summary: "", objective: "", alternatives: [], chosen_direction: "", next_action: "" };
    }

    const alternatives = Array.isArray(parsed.alternatives) ? parsed.alternatives.slice(0, 3) : [];

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
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
      JSON.stringify({ ...data, latency_ms }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("capture-and-summarize error:", (err as Error).message);
    return new Response(
      JSON.stringify({ error: (err as Error).message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
