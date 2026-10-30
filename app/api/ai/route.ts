import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { headers, cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { jwtVerify } from "jose";
import { rateLimit } from "@/lib/rate-limit";
import { TOOLS } from "@/lib/ai/prompts";
import { SYSTEM_PROMPT } from "@/lib/ai/system";
import { tierConfig, estimateCost, type Tier } from "@/lib/ai/models";
import { mockFallback } from "@/lib/ai/mockFallback";
import { tidy } from "@/lib/ai/style";

// Deep calls think before answering and can take 30 to 60 seconds.
export const maxDuration = 120;

const PORTAL_SECRET = new TextEncoder().encode(
  process.env.PORTAL_SESSION_SECRET || "storystudio-fallback-secret-change-me"
);

const apiKey = process.env.ANTHROPIC_API_KEY;
const client = apiKey ? new Anthropic({ apiKey }) : null;

/** An error whose message is safe and useful to show the participant. */
class FriendlyError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

// Who made the request, for the usage log. Passed per call rather than held in
// module variables, which concurrent requests on the same server would overwrite.
interface RequestContext {
  toolType: string;
  userEmail: string;
}

async function callClaude(prompt: string, tier: Tier, ctx: RequestContext): Promise<string> {
  if (!client) throw new Error("No API key");
  const cfg = tierConfig(tier);
  const msg = await client.messages.create({
    model: cfg.model,
    max_tokens: cfg.maxTokens,
    // The system prompt is identical on every call, so cache it.
    system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: prompt }],
    ...cfg.extra,
  } as Anthropic.MessageCreateParamsNonStreaming);

  // Log usage (fire-and-forget, don't block the response).
  const usage = msg.usage;
  const inputTokens =
    (usage?.input_tokens || 0) +
    (usage?.cache_creation_input_tokens || 0) +
    (usage?.cache_read_input_tokens || 0);
  const outputTokens = usage?.output_tokens || 0;
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    .from("usage_log")
    .insert({
      user_email: ctx.userEmail,
      tool_type: ctx.toolType,
      endpoint: `ai:${cfg.model}`,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      estimated_cost: estimateCost(cfg.model, inputTokens, outputTokens),
    })
    .then(({ error }) => {
      if (error) console.error("Usage log error:", error.message);
    });

  if (msg.stop_reason === "refusal") {
    throw new FriendlyError(
      "The AI declined to answer this one. That occasionally happens with medical or biological topics. Try rewording, or describe the work in more general terms.",
      422
    );
  }
  if (msg.stop_reason === "max_tokens") {
    throw new FriendlyError("The answer ran too long and was cut off. Try a shorter input.", 502);
  }
  // Deep calls return thinking blocks first; the answer is the text block.
  const text = msg.content.find((b): b is Anthropic.TextBlock => b.type === "text");
  if (!text) throw new Error("No text in model response");
  return text.text;
}

async function parseJSON<T>(text: string): Promise<T> {
  // Strip markdown code fences if present
  const cleaned = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // The model sometimes adds a line of commentary before or after the JSON.
    // Pull out the first balanced object or array instead of giving up.
    const extracted = extractFirstJSON(cleaned);
    if (extracted === null) throw new Error("No JSON found in model response");
    return JSON.parse(extracted) as T;
  }
}

/** First balanced {...} or [...] in a string, ignoring braces inside strings. */
function extractFirstJSON(text: string): string | null {
  const start = text.search(/[{[]/);
  if (start === -1) return null;
  const open = text[start];
  const close = open === "{" ? "}" : "]";
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === "\\" && inString) {
      escaped = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === open) depth++;
    else if (ch === close) {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

/** The signed-in participant's email, or undefined. */
async function currentUserEmail(): Promise<string | undefined> {
  try {
    // Signed portal-session cookie first, then the Supabase login (emailed code).
    const cookieStore = await cookies();
    const portalToken = cookieStore.get("portal-session")?.value;
    if (portalToken) {
      const { payload } = await jwtVerify(portalToken, PORTAL_SECRET);
      if (payload.email) return payload.email as string;
    }
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.email || undefined;
  } catch {
    return undefined;
  }
}

// ── Route handler ────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = rateLimit(ip, { maxRequests: 30, windowMs: 60_000 });
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests. Please wait a moment." }, { status: 429 });
  }

  const body = await req.json();
  const { type, ...params } = body as { type: string } & Record<string, unknown>;

  // Only signed-in participants may use the AI. The middleware lets every
  // /api/ path through, so this route has to check for itself.
  const userEmail = await currentUserEmail();
  if (!userEmail) {
    return NextResponse.json(
      { error: "Your session has ended. Please sign in again to keep using the tools." },
      { status: 401 }
    );
  }

  const tool = TOOLS[type];
  if (!tool) return NextResponse.json({ error: "Unknown tool." }, { status: 400 });

  // Local demo without an API key: canned answers where they exist.
  if (!client) return mockFallback(type, params);

  try {
    const raw = await callClaude(tool.build(params), tool.tier, { toolType: String(type), userEmail });
    const parsed = await parseJSON<Record<string, unknown>>(raw);
    const result = tidy(tool.pick ? tool.pick(parsed) : parsed);
    if (result == null) throw new Error("Model response missing expected field");
    return NextResponse.json({ result });
  } catch (err) {
    if (err instanceof FriendlyError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("AI API error for type:", type, "-", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "The AI service is temporarily unavailable. Please try again in a moment." },
      { status: 502 }
    );
  }
}
