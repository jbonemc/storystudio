import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

// Import mock AI as fallback when no API key is set
import {
  generateDocumentSummary,
  suggestBehaviourChanges,
  generateShouldStatements,
  generatePIPSuggestions,
  generateStoryAdvice,
  generateStatisticAdvice,
  generateSoundbiteOptions,
  generateSoundbiteAdvice,
} from "@/lib/mockAI";

const apiKey = process.env.ANTHROPIC_API_KEY;
const client = apiKey ? new Anthropic({ apiKey }) : null;

// ── System prompt for Story Studio ──────────────────────────────────────────
const SYSTEM_PROMPT = `You are the Story Studio Content Tool — a warm, expert communications coach built on the Story Studio framework by Jonathan McCrea (storystudiocourse.com).

Your job is to help researchers and professionals build a complete communication plan using the PIP framework:
- Problem: What injustice or unresolved gap does this work address?
- Inspiration: What is unique and different about this approach?
- Payoff: How does the world look if this work succeeds?

You also work with:
- Should Statements: Short injustice claims (e.g. "No child should go to school hungry when solutions exist"). NOT about specific technology. Broad moral claims about what's wrong with the world.
- Stories: Personal, specific, sensory moments that make messages human
- Statistics: One powerful, well-framed number that anchors a claim
- Soundbites: Under 15 words, memorable, quotable — what someone repeats to a colleague

Your tone is warm, encouraging, direct and specific. You coach, you don't lecture. You always connect suggestions back to the user's actual work.

Always respond with valid JSON matching the format requested.`;

async function callClaude(prompt: string): Promise<string> {
  if (!client) throw new Error("No API key");
  const msg = await client.messages.create({
    model: "claude-opus-4-5-20251101",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: prompt }],
  });
  const content = msg.content[0];
  if (content.type !== "text") throw new Error("Unexpected response type");
  return content.text;
}

async function parseJSON<T>(text: string): Promise<T> {
  // Strip markdown code fences if present
  const cleaned = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
  return JSON.parse(cleaned) as T;
}

// ── Route handler ────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { type, ...params } = body;

  try {
    // If no API key, fall back to mock AI for all types
    if (!client) {
      return mockFallback(type, params);
    }

    switch (type) {
      case "summariseDocument": {
        const { documents } = params as { documents: string };
        const prompt = `Analyse this research project description and respond with JSON: {"summary": "2-3 sentence summary in second person, noting the domain, geography, and population the work focuses on. End with 'Let us use this as the foundation for building your communication plan.'"}

Document:
${documents.slice(0, 3000)}`;
        const raw = await callClaude(prompt);
        const { summary } = await parseJSON<{ summary: string }>(raw);
        return NextResponse.json({ result: summary });
      }

      case "suggestBehaviourChanges": {
        const { documents } = params as { documents: string };
        const prompt = `Read this research project carefully and suggest 5 behaviour change goals the researcher might want from their audience.

CRITICAL RULES:
- NEVER suggest "raise awareness" or "increase profile" — these are not behaviour changes. A behaviour change is something a specific person does, decides, funds, adopts, or joins.
- Each of the 5 suggestions must be a DIFFERENT TYPE of change. Cover all five of these categories, one each:
  1. A concrete DECISION or formal commitment (e.g. approve funding, sign off on a programme, include in a strategy)
  2. A PRACTICE CHANGE (e.g. adopt a new method, change how practitioners deliver this kind of work)
  3. A MINDSET SHIFT (e.g. move from scepticism to ownership, from "niche" to "urgent priority")
  4. PARTICIPATION or direct engagement (e.g. sign up as a volunteer, take part in a survey, join a citizen science project, visit a website, attend an event)
  5. CHAMPIONING or amplification (e.g. publicly endorse, cite, share with their network, teach it in schools)
- Be SPECIFIC to this research — name the actual topic, geography, population or domain from the document
- Start each suggestion with an active verb: "Commit to...", "Adopt...", "Shift from... to...", "Sign up to...", "Publicly endorse..."
- Each suggestion should be 1-2 sentences, concrete enough that the researcher could put it on a slide

Respond with JSON: {"suggestions": ["suggestion 1", "suggestion 2", "suggestion 3", "suggestion 4", "suggestion 5"]}

Document:
${documents.slice(0, 2500)}`;
        const raw = await callClaude(prompt);
        const { suggestions } = await parseJSON<{ suggestions: string[] }>(raw);
        return NextResponse.json({ result: suggestions });
      }

      case "generateShouldStatements": {
        const { documents, behaviourChange } = params as { documents: string; behaviourChange: string };
        const prompt = `Generate 5 "Should Statements" for this researcher.

A Should Statement is a SHORT INJUSTICE CLAIM — it names what is wrong with the world, not what the research does. It should be:
- Short enough to say right after your name
- A moral claim about what IS, not what should be done
- NO mention of specific technology, research methods, or products
- Pattern: "No [person] should [face this]" or "We should not accept..."
- Example of good: "No child should go to school hungry when solutions already exist."
- Example of bad: "We should fund solar threshing technology in Zimbabwe." (too specific)

Use the geography and population context from the documents, but keep statements broad and human.

Respond with JSON: {"statements": ["statement 1", "statement 2", "statement 3", "statement 4", "statement 5"]}

Research context: ${behaviourChange}
Documents: ${documents.slice(0, 1500)}`;
        const raw = await callClaude(prompt);
        const { statements } = await parseJSON<{ statements: string[] }>(raw);
        return NextResponse.json({ result: statements });
      }

      case "generatePIPSuggestions": {
        const { documents, shouldStatement } = params as { documents: string; shouldStatement: string };
        const prompt = `Generate PIP message suggestions for this researcher. The PIP framework has three roles:
- Problem: What is the injustice or unresolved gap? (1-2 sentences, creates tension)
- Inspiration: What is unique about this approach? (what makes it different from everything tried before)
- Payoff: How does the world look if this succeeds? (describe outcomes for people, not academic contributions)

Generate 3 options for each role, each 1-2 sentences. Make them specific to the research described.

Should Statement: "${shouldStatement}"
Research: ${documents.slice(0, 2000)}

Respond with JSON: {"problem": ["p1", "p2", "p3"], "inspiration": ["i1", "i2", "i3"], "payoff": ["pay1", "pay2", "pay3"]}`;
        const raw = await callClaude(prompt);
        const result = await parseJSON<{ problem: string[]; inspiration: string[]; payoff: string[] }>(raw);
        return NextResponse.json({ result });
      }

      case "generateStoryAdvice": {
        const { story, messageIndex } = params as { story: string; messageIndex: number };
        const prompt = `A researcher has shared this story to support their Message ${messageIndex + 1}. Give them coaching on how to use it effectively — how to open with a human moment, build tension, and connect it back to their key message. Be specific and warm.

Story: ${story}

Respond with JSON: {"advice": "coaching text here (3-4 short paragraphs, uses line breaks between them)"}`;
        const raw = await callClaude(prompt);
        const { advice } = await parseJSON<{ advice: string }>(raw);
        return NextResponse.json({ result: advice });
      }

      case "generateStatisticAdvice": {
        const { statistic, messageIndex } = params as { statistic: string; messageIndex: number };
        const prompt = `A researcher wants to use this statistic for their Message ${messageIndex + 1}. Coach them on how to frame it for maximum impact — how to anchor it, make it relatable, and pair it with emotion.

Statistic: ${statistic}

Respond with JSON: {"advice": "coaching text here (2-3 short paragraphs)"}`;
        const raw = await callClaude(prompt);
        const { advice } = await parseJSON<{ advice: string }>(raw);
        return NextResponse.json({ result: advice });
      }

      case "generateSoundbiteOptions": {
        const { message, messageIndex } = params as { message: string; messageIndex: number };
        const prompt = `Generate 3 soundbite options for this key message. A soundbite is:
- Under 15 words
- Memorable and emotionally resonant
- Something someone would repeat to a colleague without notes
- Not a summary — a provocation or insight

Key message: ${message}

Respond with JSON: {"options": ["soundbite 1", "soundbite 2", "soundbite 3"]}`;
        const raw = await callClaude(prompt);
        const { options } = await parseJSON<{ options: string[] }>(raw);
        return NextResponse.json({ result: options });
      }

      case "generateSoundbiteAdvice": {
        const { soundbite } = params as { soundbite: string };
        const prompt = `Analyse why this soundbite works (or doesn't), and give brief coaching on what makes a great soundbite.

Soundbite: "${soundbite}"

Respond with JSON: {"advice": "brief analysis and coaching (2 short paragraphs)"}`;
        const raw = await callClaude(prompt);
        const { advice } = await parseJSON<{ advice: string }>(raw);
        return NextResponse.json({ result: advice });
      }

      default:
        return NextResponse.json({ error: "Unknown type" }, { status: 400 });
    }
  } catch (err) {
    console.error("AI API error:", err);
    // Fall back to mock on any error
    return mockFallback(type, params);
  }
}

// ── Mock fallback ─────────────────────────────────────────────────────────────
function mockFallback(type: string, params: Record<string, unknown>) {
  switch (type) {
    case "summariseDocument":
      return NextResponse.json({ result: generateDocumentSummary(params.documents as string) });
    case "suggestBehaviourChanges":
      return NextResponse.json({ result: suggestBehaviourChanges(params.documents as string) });
    case "generateShouldStatements":
      return NextResponse.json({ result: generateShouldStatements(params.documents as string, params.behaviourChange as string) });
    case "generatePIPSuggestions":
      return NextResponse.json({ result: generatePIPSuggestions(params.documents as string, params.shouldStatement as string) });
    case "generateStoryAdvice":
      return NextResponse.json({ result: generateStoryAdvice(params.story as string, params.messageIndex as number) });
    case "generateStatisticAdvice":
      return NextResponse.json({ result: generateStatisticAdvice(params.statistic as string, params.messageIndex as number) });
    case "generateSoundbiteOptions":
      return NextResponse.json({ result: generateSoundbiteOptions(params.message as string, params.messageIndex as number) });
    case "generateSoundbiteAdvice":
      return NextResponse.json({ result: generateSoundbiteAdvice(params.soundbite as string) });
    default:
      return NextResponse.json({ error: "Unknown type" }, { status: 400 });
  }
}
