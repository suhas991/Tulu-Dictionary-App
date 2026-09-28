import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const systemPrompt = `You are an Everyday English Vocabulary Assistant.

Generate exactly one practical everyday English word or natural phrase for beginner to intermediate learners. Prefer vocabulary used at home, with family and friends, while shopping or travelling, at school or work, and in daily conversations. Favor common topics such as food, household items, clothes, family, body parts, actions, feelings, transport, health, weather, nature, animals, technology, time, and daily conversation.

Avoid advanced, academic, literary, rare, or overly formal vocabulary. Do not provide translations. Return a simple one-sentence English meaning that explains real-world use. Do not add markdown or commentary.

Return only valid JSON in this exact shape:
{"english":"...","meaning":"..."}`;

const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders });
}

function normalizeWord(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9\s']/g, "").replace(/\s+/g, " ");
}

function validSuggestion(value: unknown, excluded: Set<string>) {
  if (!value || typeof value !== "object") return false;
  const suggestion = value as { english?: unknown; meaning?: unknown };
  if (typeof suggestion.english !== "string" || typeof suggestion.meaning !== "string") return false;
  const english = suggestion.english.trim();
  const meaning = suggestion.meaning.trim();
  return english.length >= 2 && english.length <= 80 && meaning.length >= 5 && meaning.length <= 240 && !excluded.has(normalizeWord(english));
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return response({ error: "Only POST is supported." }, 405);

  const authorization = request.headers.get("Authorization");
  if (!authorization) return response({ error: "Authentication is required." }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
  const groqKey = Deno.env.get("GROQ_API_KEY");
  if (!supabaseUrl || !supabaseAnonKey || !groqKey) return response({ error: "AI service is not configured." }, 500);

  const userClient = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: authorization } } });
  const { data: { user }, error: userError } = await userClient.auth.getUser();
  if (userError || !user) return response({ error: "Your session is invalid or expired." }, 401);

  const { data: admin, error: adminError } = await userClient.from("admin_users").select("user_id").eq("user_id", user.id).maybeSingle();
  if (adminError || !admin) return response({ error: "Only admins can generate draft suggestions." }, 403);

  let body: { existingEnglish?: unknown };
  try {
    body = await request.json();
  } catch {
    return response({ error: "Invalid request JSON." }, 400);
  }

  const existingEnglish = Array.isArray(body.existingEnglish) ? body.existingEnglish.filter((word): word is string => typeof word === "string").slice(0, 500) : [];
  const excluded = new Set(existingEnglish.map(normalizeWord));
  const exclusionText = existingEnglish.length ? `Never return any of these existing English words or phrases: ${existingEnglish.join(", ")}.` : "There are no existing words to exclude.";

  const models = ["openai/gpt-oss-120b"];
  let providerMessage = "The AI returned a duplicate or invalid suggestion.";

  for (const model of models) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      let groqResponse: Response;
      try {
        groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${groqKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model,
            temperature: 0.8,
            max_tokens: 120,
            response_format: { type: "json_object" },
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: `${exclusionText}\nGenerate one different everyday English word now.` },
            ],
          }),
        });
      } catch {
        providerMessage = "Could not reach the AI provider.";
        continue;
      }

      if (!groqResponse.ok) {
        const providerBody = await groqResponse.text();
        try {
          providerMessage = JSON.parse(providerBody).error?.message || providerMessage;
        } catch {
          providerMessage = `The AI model ${model} could not generate a suggestion.`;
        }
        break;
      }

      const payload = await groqResponse.json();
      const content = payload.choices?.[0]?.message?.content;
      try {
        const suggestion = JSON.parse(content);
        if (validSuggestion(suggestion, excluded)) return response({ english: suggestion.english.trim(), meaning: suggestion.meaning.trim() });
      } catch {
        providerMessage = `The AI model ${model} returned invalid JSON.`;
      }
    }
  }

  return response({ error: providerMessage }, 502);
});
