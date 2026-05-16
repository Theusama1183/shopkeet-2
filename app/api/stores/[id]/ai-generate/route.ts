import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDatabase } from "@/lib/supabase/database";
import { z } from "zod";

// ── Cloudflare Workers AI models available for page generation ────────────────
export const CF_MODELS = {
  "llama-3.2-1b-instruct": {
    id: "@cf/meta/llama-3.2-1b-instruct",
    label: "Llama 3.2 1B (Fastest · Free)",
    description: "Best for testing. ~44 free generations/day.",
    maxTokens: 2048,
    tier: "free",
  },
  "llama-3.1-8b-fp8-fast": {
    id: "@cf/meta/llama-3.1-8b-instruct-fp8-fast",
    label: "Llama 3.1 8B FP8 (Fast · Cheap)",
    description: "Good balance of speed and quality.",
    maxTokens: 3000,
    tier: "paid",
  },
  "qwen3-30b-a3b-fp8": {
    id: "@cf/qwen/qwen3-30b-a3b-fp8",
    label: "Qwen3 30B A3B (Smart · Cheap)",
    description: "MoE model — high quality at low cost.",
    maxTokens: 4000,
    tier: "paid",
  },
  "llama-3.3-70b-fp8-fast": {
    id: "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
    label: "Llama 3.3 70B FP8 (Best Quality)",
    description: "Recommended for production. ~4 free/day.",
    maxTokens: 4096,
    tier: "paid",
  },
  "gemma-4-26b": {
    id: "@cf/google/gemma-4-26b-a4b-it",
    label: "Gemma 4 26B (Google · Balanced)",
    description: "Google's latest, great JSON adherence.",
    maxTokens: 3500,
    tier: "paid",
  },
} as const;

export type ModelKey = keyof typeof CF_MODELS;

// ── Validation ────────────────────────────────────────────────────────────────
const generateSchema = z.object({
  prompt: z.string().min(5).max(500),
  model: z.enum([
    "llama-3.2-1b-instruct",
    "llama-3.1-8b-fp8-fast",
    "qwen3-30b-a3b-fp8",
    "llama-3.3-70b-fp8-fast",
    "gemma-4-26b",
  ]),
  pageType: z.enum(["home", "about", "products", "contact", "custom"]).default("home"),
  storeName: z.string().optional(),
});

// ── Puck component schema — tells the LLM exactly what's available ────────────
const PUCK_SCHEMA = `
Available Puck components (use ONLY these exact names):

1. AnnouncementBar: { text, link, linkText, bgColor(hex), textColor(hex), dismissible(bool) }
2. HeroSection: { title, subtitle, backgroundType("gradient"|"image"|"color"), gradientFrom(hex), gradientTo(hex), bgColor(hex), overlayOpacity(0-100), textAlign("left"|"center"|"right"), minHeight("sm"|"md"|"lg"|"full"), ctaText, ctaLink, ctaVariant("default"|"outline"|"white"), secondaryCtaText, secondaryCtaLink, textColor(hex) }
3. SocialProofBar: { stats([{value,label}]), bgColor(hex), textColor(hex) }
4. HeadingBlock: { text, level("h1"|"h2"|"h3"), size("xl"|"2xl"|"3xl"|"4xl"|"5xl"), align("left"|"center"|"right"), color(hex) }
5. RichTextBlock: { content, align("left"|"center"|"right"), maxWidth("narrow"|"medium"|"wide"|"full") }
6. ButtonBlock: { text, href, variant("primary"|"outline"|"ghost"), size("sm"|"md"|"lg"), align("left"|"center"|"right"), icon("none"|"arrow"|"cart"), fullWidth(bool) }
7. ImageBlock: { src(""), alt, caption, rounded("none"|"sm"|"md"|"lg"), shadow(bool), aspectRatio("auto"|"square"|"video"), align("left"|"center"|"right") }
8. DividerBlock: { style("solid"|"dashed"|"dotted"), color(hex), thickness(1-4), spacing("sm"|"md"|"lg") }
9. SpacerBlock: { height("xs"|"sm"|"md"|"lg"|"xl") }
10. ProductGrid: { title, subtitle, columns(2-4), gap("sm"|"md"|"lg"), cardStyle("default"|"minimal"|"bordered"), showPrice(bool), showAddToCart(bool), perPage(4-12), sort("newest"|"price_asc"|"price_desc") }
11. ProductCarousel: { title, subtitle, slidesVisible(2-4), showPrice(bool), showAddToCart(bool), showArrows(bool), autoplay(bool), limit(4-12), sort("newest"|"price_asc") }
12. FeatureSection: { title, subtitle, columns(2|3|4), layout("icon-top"|"icon-left"|"card"), features([{icon("star"|"heart"|"shield"|"zap"|"truck"|"check"),title,description,color(hex)}]), bgColor(hex) }
13. TestimonialsBlock: { title, subtitle, layout("grid"|"carousel"), columns(2|3), testimonials([{name,role,text,rating(1-5),avatar("")}]), bgColor(hex) }
14. NewsletterBlock: { title, subtitle, placeholder, buttonText, bgColor(hex), layout("inline"|"stacked"|"card") }
15. BannerBlock: { title, subtitle, ctaText, ctaLink, bgColor(hex), textColor(hex), image(""), layout("left"|"center"|"right") }
16. FAQBlock: { title, subtitle, items([{question,answer}]), layout("accordion"|"grid") }
17. TrustBadges: { badges([{icon("shield"|"truck"|"refresh"|"star"|"lock"),title,subtitle}]), layout("horizontal"|"grid"), bgColor(hex) }
18. SocialLinks: { instagram, twitter, facebook, youtube, align("left"|"center"|"right"), size("sm"|"md"|"lg"), style("filled"|"outline"|"ghost"), color(hex) }
19. CountdownBlock: { title, targetDate("YYYY-MM-DD HH:MM"), bgColor(hex), textColor(hex), showDays(bool), showHours(bool), showMinutes(bool), showSeconds(bool) }
20. ContactSection: { title, subtitle, email, phone, address, showForm(bool), bgColor(hex) }
21. TwoColumnSection: { leftContent, rightContent, leftImage(""), rightImage(""), gap("sm"|"md"|"lg"), verticalAlign("top"|"center"|"bottom"), reverseOnMobile(bool), leftWidth("1/3"|"1/2"|"2/3") }
22. CategoryGrid: { title, subtitle, categories([{name,image(""),link,count(0)}]), columns(2|3|4), style("card"|"overlay"|"minimal") }
`;

// ── Page type templates — guide the LLM on what components to use ─────────────
const PAGE_TEMPLATES: Record<string, string> = {
  home: "AnnouncementBar, HeroSection, SocialProofBar, ProductGrid or ProductCarousel, FeatureSection, TestimonialsBlock, BannerBlock, NewsletterBlock, TrustBadges",
  about: "HeroSection, TwoColumnSection, FeatureSection, TestimonialsBlock, TrustBadges, ContactSection",
  products: "HeadingBlock, RichTextBlock, ProductGrid, BannerBlock",
  contact: "HeadingBlock, RichTextBlock, ContactSection, TwoColumnSection, SocialLinks",
  custom: "any relevant components",
};

// ── Build the system prompt ───────────────────────────────────────────────────
function buildSystemPrompt(storeName: string, pageType: string): string {
  return `You are a JSON-only API. You output ONLY a single raw JSON object. No prose, no explanation, no markdown, no code fences.

The JSON must follow this exact structure for a Puck page builder:
{"content":[{"type":"ComponentName","props":{...},"readOnly":false}],"root":{"props":{}}}

CRITICAL JSON RULES — violating any of these will break the parser:
- ALL property keys MUST be in double quotes: "type" not type
- ALL string values MUST be in double quotes: "hello" not hello
- NO trailing commas
- NO comments
- NO JavaScript syntax — pure RFC 8259 JSON only
- Start your response with { and end with } — nothing before or after

Store name: "${storeName}"
Page type: ${pageType}
Preferred components for this page type: ${PAGE_TEMPLATES[pageType] || PAGE_TEMPLATES.custom}

Rules for props:
- image/src fields: always use empty string ""
- hex colors: use format "#rrggbb" e.g. "#7c3aed"
- boolean values: true or false (no quotes)
- Generate 5 to 8 components total

${PUCK_SCHEMA}`;
}

// ── JSON extractor — handles prose wrapping, code fences, and truncation ──────
// Strategy: find the outermost { ... } block by tracking brace depth.
// This is more reliable than regex for nested JSON.
function extractJson(raw: string): { content: unknown[]; root: unknown } {
  // 1. Strip markdown code fences anywhere in the string
  const stripped = raw
    .replace(/```(?:json)?\s*/gi, "")
    .replace(/```/g, "")
    .trim();

  // 2. Find the first '{' — everything before it is prose
  const start = stripped.indexOf("{");
  if (start === -1) throw new Error("No JSON object found in response");

  // 3. Walk forward tracking brace depth to find the matching closing '}'
  let depth = 0;
  let end = -1;
  let inString = false;
  let escape = false;

  for (let i = start; i < stripped.length; i++) {
    const ch = stripped[i];

    if (escape) { escape = false; continue; }
    if (ch === "\\" && inString) { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;

    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) { end = i; break; }
    }
  }

  if (end === -1) throw new Error("JSON object is incomplete (truncated response)");

  const jsonStr = stripped.slice(start, end + 1);

  // 4. Parse — if it fails, throw with a useful message
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    throw new Error(`JSON.parse failed: ${String(e).slice(0, 100)}`);
  }
}

// ── POST /api/stores/[id]/ai-generate ─────────────────────────────────────────
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: storeId } = await params;

    // 1. Auth
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Authorization — user must own this store
    const db = await getDatabase();
    const { data: store, error: storeError } = await db
      .from("stores")
      .select("id, name")
      .eq("id", storeId)
      .eq("user_id", user.id)
      .single();
    if (storeError || !store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    // 3. Validate input
    const body = await req.json();
    const parsed = generateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { prompt, model, pageType, storeName } = parsed.data;
    const modelConfig = CF_MODELS[model];

    // 4. Check Cloudflare credentials
    const cfAccountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const cfApiToken = process.env.CLOUDFLARE_AI_API_TOKEN;
    if (!cfAccountId || !cfApiToken) {
      return NextResponse.json(
        { error: "Cloudflare Workers AI is not configured. Add CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_AI_API_TOKEN to your environment." },
        { status: 503 }
      );
    }

    // 5. Call Cloudflare Workers AI
    const systemPrompt = buildSystemPrompt(storeName || store.name, pageType);
    const userPrompt = `Generate a ${pageType} page for "${storeName || store.name}". ${prompt}`;

    const cfResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/ai/run/${modelConfig.id}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${cfApiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          max_tokens: modelConfig.maxTokens,
          temperature: 0.4, // lower = more deterministic JSON output
        }),
      }
    );

    if (!cfResponse.ok) {
      const errText = await cfResponse.text();
      console.error("[ai-generate] Cloudflare API error:", cfResponse.status, errText);

      if (cfResponse.status === 429) {
        return NextResponse.json(
          { error: "Daily neuron limit reached. Upgrade to Workers Paid or try again tomorrow." },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { error: "AI service error. Please try again." },
        { status: 502 }
      );
    }

    const cfData = await cfResponse.json();

    // Cloudflare Workers AI response shape varies by model:
    // - Chat models: { result: { response: "..." }, success: true }
    // - Some models: { result: { response: "..." } }
    // Safely extract as string regardless
    const resultRaw: unknown = cfData?.result?.response ?? cfData?.result ?? "";
    const rawText: string =
      typeof resultRaw === "string"
        ? resultRaw
        : typeof resultRaw === "object" && resultRaw !== null
        ? JSON.stringify(resultRaw)
        : "";

    if (!rawText.trim()) {
      console.error("[ai-generate] Empty response from CF. Full cfData:", JSON.stringify(cfData).slice(0, 400));
      return NextResponse.json(
        { error: "AI returned an empty response. Try a different model or prompt." },
        { status: 502 }
      );
    }

    // 6. Extract and parse JSON — robust against prose, code fences, and partial wrapping
    let puckData: { content: unknown[]; root: unknown };
    try {
      puckData = extractJson(rawText);
    } catch (parseErr) {
      console.error("[ai-generate] Failed to parse LLM output:", String(rawText).slice(0, 600));
      return NextResponse.json(
        {
          error: "AI output was not valid JSON. Try again or use a larger model (70B recommended).",
          hint: String(parseErr).slice(0, 120),
        },
        { status: 422 }
      );
    }

    // 7. Basic structure validation
    if (!Array.isArray(puckData?.content)) {
      return NextResponse.json(
        { error: "AI output missing 'content' array. Try again." },
        { status: 422 }
      );
    }

    // Sanitize: ensure every item has required Puck fields
    const sanitized = puckData.content
      .filter(
        (item): item is { type: string; props: Record<string, unknown> } =>
          typeof item === "object" &&
          item !== null &&
          typeof (item as Record<string, unknown>).type === "string"
      )
      .map((item) => ({
        type: item.type,
        props: item.props ?? {},
        readOnly: false,
      }));

    return NextResponse.json({
      data: {
        content: sanitized,
        root: puckData.root ?? { props: {} },
      },
      model: modelConfig.label,
      componentCount: sanitized.length,
    });
  } catch (error) {
    console.error("[ai-generate] Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ── GET — return available models (used by the UI dropdown) ───────────────────
export async function GET() {
  return NextResponse.json({ models: CF_MODELS });
}
