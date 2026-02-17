import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cp-key",
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

  // Validate shared key
  const cpKey = req.headers.get("x-cp-key");
  const sharedKey = Deno.env.get("EXTENSION_SHARED_KEY");

  // Temporary debug logs
  console.log(`[DEBUG] x-cp-key header present: ${!!cpKey}`);
  console.log(`[DEBUG] EXTENSION_SHARED_KEY env var exists: ${!!sharedKey}`);

  if (!cpKey) {
    return new Response(JSON.stringify({ error: "Missing header: x-cp-key" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (!sharedKey) {
    return new Response(JSON.stringify({ error: "Missing secret: EXTENSION_SHARED_KEY" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (cpKey !== sharedKey) {
    return new Response(JSON.stringify({ error: "Key mismatch" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { source, chat_title, transcript } = await req.json();

    // Validate transcript length
    if (transcript && transcript.length > 100_000) {
      return new Response(
        JSON.stringify({ error: "Transcript too large" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Call AI Gateway for structured extraction
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
            {
              role: "system",
              content: `You are a structured data extractor. Given a chat transcript, extract EXACTLY these fields as JSON:
- "summary": 2-3 sentence overview of the conversation
- "objective": What the user was trying to accomplish (1 sentence)
- "alternatives": Array of up to 3 approaches/options discussed (strings). If none, empty array.
- "chosen_direction": Which approach was favored (1 sentence). If none, empty string.
- "next_action": Suggested next step (1 sentence). If none, empty string.

Return ONLY valid JSON, no markdown, no explanation.`,
            },
            {
              role: "user",
              content: `Chat title: ${chat_title || "Untitled"}\n\nTranscript:\n${transcript}`,
            },
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

    // Parse AI response - strip markdown fences if present
    let parsed;
    try {
      const cleaned = rawContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response:", rawContent);
      parsed = {
        summary: "",
        objective: "",
        alternatives: [],
        chosen_direction: "",
        next_action: "",
      };
    }

    // Ensure alternatives is an array of max 3
    const alternatives = Array.isArray(parsed.alternatives)
      ? parsed.alternatives.slice(0, 3)
      : [];

    // Insert into captures table using service role
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data, error } = await supabase
      .from("captures")
      .insert({
        source: source || "unknown",
        chat_title: chat_title || "Untitled",
        raw_transcript: transcript || "",
        summary: parsed.summary || "",
        objective: parsed.objective || "",
        alternatives: alternatives,
        chosen_direction: parsed.chosen_direction || "",
        next_action: parsed.next_action || "",
      })
      .select()
      .single();

    if (error) {
      console.error("DB insert error:", error);
      throw new Error(error.message);
    }

    return new Response(JSON.stringify(data), {
      status: 201,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("capture-extension error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
