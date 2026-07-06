import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ChatMsg = { role: "user" | "assistant"; content: string };

const MODE_PROMPTS: Record<string, string> = {
  analyst:
    "You are in ANALYST MODE. Focus on business analysis: sales trends, profit analysis, inventory health, best/slow sellers, weak points and forecasts. Back every claim with the numbers from the business context.",
  operator:
    "You are in OPERATOR MODE. Focus on getting things done: drafting purchase orders, summarising data for exports/reports, writing supplier/customer messages and outlining automations. Be concrete and action-oriented.",
  knowledge:
    "You are in KNOWLEDGE MODE. Focus on teaching the owner how to use GeFlow features (Inventory, POS, Purchases, Reports, Businesses, Subscription). Give clear step-by-step guidance.",
  advisor:
    "You are in ADVISOR MODE. Focus on strategic recommendations: cost & inventory optimisation, growth opportunities, risk alerts and smart suggestions. Be proactive and specific.",
};

const num = (n: unknown) => Number(n ?? 0) || 0;

async function buildContext(supabase: any, businessId: string) {
  if (!businessId) return "No business selected. Ask the user to select a business first.";

  const { data: biz } = await supabase
    .from("businesses")
    .select("business_name, currency, default_tax, status")
    .eq("id", businessId)
    .maybeSingle();
  if (!biz) return "Business not found or not accessible.";

  const since = new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString();
  const [{ data: products }, { data: sales }] = await Promise.all([
    supabase
      .from("products")
      .select("name, stock_units, min_stock_alert, retail_price, discount_price, purchase_cost, status")
      .eq("business_id", businessId),
    supabase
      .from("sales")
      .select("total, profit, created_at, status")
      .eq("business_id", businessId)
      .gte("created_at", since),
  ]);

  const prods = products ?? [];
  const active = prods.filter((p: any) => p.status === "active");
  const outOfStock = active.filter((p: any) => num(p.stock_units) <= 0);
  const lowStock = active.filter((p: any) => num(p.stock_units) > 0 && num(p.stock_units) <= num(p.min_stock_alert));
  const stockValue = active.reduce((s: number, p: any) => s + num(p.stock_units) * num(p.purchase_cost), 0);
  const retailValue = active.reduce((s: number, p: any) => s + num(p.stock_units) * num(p.discount_price ?? p.retail_price), 0);

  const now = Date.now();
  const dayAgo = now - 24 * 3600 * 1000;
  const weekAgo = now - 7 * 24 * 3600 * 1000;
  const monthAgo = now - 30 * 24 * 3600 * 1000;
  const salesList = (sales ?? []).filter((s: any) => s.status !== "voided");
  const sum = (arr: any[], k: string) => arr.reduce((a: number, x: any) => a + num(x[k]), 0);
  const inRange = (from: number) => salesList.filter((s: any) => new Date(s.created_at).getTime() >= from);

  const ctx = {
    business: { name: biz.business_name, currency: biz.currency, tax_percent: biz.default_tax, status: biz.status },
    inventory: {
      active_products: active.length,
      out_of_stock_count: outOfStock.length,
      low_stock_count: lowStock.length,
      inventory_cost_value: +stockValue.toFixed(2),
      inventory_retail_value: +retailValue.toFixed(2),
      out_of_stock_items: outOfStock.slice(0, 15).map((p: any) => p.name),
      low_stock_items: lowStock.slice(0, 15).map((p: any) => ({ name: p.name, units: num(p.stock_units), alert_at: num(p.min_stock_alert) })),
    },
    sales_last_60_days: {
      transactions: salesList.length,
      revenue_today: +sum(inRange(dayAgo), "total").toFixed(2),
      revenue_7_days: +sum(inRange(weekAgo), "total").toFixed(2),
      revenue_30_days: +sum(inRange(monthAgo), "total").toFixed(2),
      profit_30_days: +sum(inRange(monthAgo), "profit").toFixed(2),
      revenue_60_days: +sum(salesList, "total").toFixed(2),
    },
  };
  return JSON.stringify(ctx, null, 2);
}

async function callGemini(system: string, messages: ChatMsg[]): Promise<string> {
  const key = Deno.env.get("Gemini");
  if (!key) throw new Error("no-gemini-key");
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents: messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
        generationConfig: { temperature: 0.6, maxOutputTokens: 1400 },
      }),
    },
  );
  if (!res.ok) throw new Error(`gemini-${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("") ?? "";
  if (!text) throw new Error("gemini-empty");
  return text;
}

async function callOpenAI(system: string, messages: ChatMsg[]): Promise<string> {
  const key = Deno.env.get("ChatGPT");
  if (!key) throw new Error("no-openai-key");
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.6,
      max_tokens: 1400,
      messages: [{ role: "system", content: system }, ...messages],
    }),
  });
  if (!res.ok) throw new Error(`openai-${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content ?? "";
  if (!text) throw new Error("openai-empty");
  return text;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // User-scoped client — RLS keeps every query limited to this user's data.
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const body = await req.json();
    const messages: ChatMsg[] = Array.isArray(body?.messages) ? body.messages.slice(-12) : [];
    const mode: string = MODE_PROMPTS[body?.mode] ? body.mode : "analyst";
    const businessId: string = body?.businessId ?? "";
    if (messages.length === 0) return new Response(JSON.stringify({ error: "No messages" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const context = await buildContext(supabase, businessId);

    const system = [
      "You are GeFlow AI Assistant — an AI-powered Business Intelligence & Operations Assistant for the GeFlow inventory/POS platform.",
      "You act like a virtual business manager: you understand the business, analyse real operational data, detect problems, suggest solutions and help the owner decide faster.",
      "You are NOT a general chatbot. Only discuss the owner's business, GeFlow features, and related commerce/operations topics.",
      MODE_PROMPTS[mode],
      "Formatting: reply in clean Markdown with short headings, bullet points and bold key numbers. Be concise and professional.",
      "Language: reply in the same language the user writes in (English, Urdu, Hindi, Arabic, etc.).",
      "If a requested action (email, PDF, export, automation) cannot be executed directly yet, produce the ready-to-use draft/content and clearly say it is a draft.",
      "",
      "=== LIVE BUSINESS CONTEXT (JSON) ===",
      context,
    ].join("\n");

    let reply = "";
    let usedModel = "gemini";
    try {
      reply = await callGemini(system, messages);
    } catch (geminiErr) {
      console.error("Gemini failed, falling back to OpenAI:", String(geminiErr));
      try {
        reply = await callOpenAI(system, messages);
        usedModel = "chatgpt";
      } catch (openaiErr) {
        console.error("OpenAI failed:", String(openaiErr));
        return new Response(
          JSON.stringify({ error: "AI engines are unavailable right now. Please try again shortly." }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    return new Response(JSON.stringify({ reply, model: usedModel }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("geflow-ai-assistant error:", String(err));
    return new Response(JSON.stringify({ error: "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
