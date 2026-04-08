import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

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
const CLAUDE_MODEL = process.env.CLAUDE_MODEL || "claude-sonnet-4-5-20250929";

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

// Sonnet 4.5 pricing per million tokens
const COST_PER_INPUT_MTOK = 3;
const COST_PER_OUTPUT_MTOK = 15;

// These are set per-request in the POST handler
let _reqToolType: string | undefined;
let _reqUserEmail: string | undefined;

async function callClaude(prompt: string): Promise<string> {
  if (!client) throw new Error("No API key");
  const msg = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: prompt }],
  });
  const content = msg.content[0];
  if (content.type !== "text") throw new Error("Unexpected response type");

  // Log usage (fire-and-forget, don't block response)
  if (_reqUserEmail && _reqToolType) {
    const inputTokens = msg.usage?.input_tokens || 0;
    const outputTokens = msg.usage?.output_tokens || 0;
    const estimatedCost =
      (inputTokens / 1_000_000) * COST_PER_INPUT_MTOK +
      (outputTokens / 1_000_000) * COST_PER_OUTPUT_MTOK;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    supabase
      .from("usage_log")
      .insert({
        user_email: _reqUserEmail,
        tool_type: _reqToolType,
        endpoint: "ai",
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        estimated_cost: estimatedCost,
      })
      .then(({ error }) => {
        if (error) console.error("Usage log error:", error.message);
      });
  }

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

  // Set request context for logging
  _reqToolType = type;
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    _reqUserEmail = user?.email || undefined;
  } catch {
    _reqUserEmail = undefined;
  }

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

      // ── New portal tools ──────────────────────────────────────────────────

      case "generateMetaphors": {
        const { description, conceptType, zeitgeist } = params as {
          description: string;
          conceptType?: string;
          zeitgeist?: string;
        };

        const conceptHint = conceptType
          ? `\nThe user has identified this as: "${conceptType.replace(/_/g, " ")}". Prioritise metaphors whose internal mechanism mirrors this type of concept.`
          : "";

        const zeitgeistHint = zeitgeist
          ? `\nTOPICAL MOMENT: The user says "${zeitgeist}" is in the zeitgeist right now. One of your 5 metaphors (the "topical" one) MUST use this reference — but ONLY if the mechanical mapping genuinely works. If the mapping is weak, say so in the "whyItWorks" field and offer the best topical metaphor you can. Topical metaphors are especially effective for live radio, television, and public talks.`
          : "\nNo topical moment provided. Replace the 'topical' slot with a second strong structural metaphor.";

        const prompt = `You are a world-class communications coach specialising in metaphor design. A user has described the part of their work that is hardest to explain. Generate exactly 5 metaphors, each chosen for a different reason.

PRINCIPLES FOR EVALUATING METAPHORS (apply these strictly):
1. IMMEDIATE COMPREHENSIBILITY — The metaphor must be understandable the moment someone hears it, with no additional explanation needed.
2. VISUALISATION IS CENTRAL — The listener must be able to picture it in their mind. Concrete, physical imagery beats abstract description every time.
3. SHARED HUMAN EXPERIENCE — Draw from everyday objects, common experiences, universal physical processes. Avoid specialist knowledge, niche cultural references, or geographically specific experiences.
4. SIMPLICITY OVER COMPLEXITY — The metaphor must simplify the idea. If it needs multiple layers of explanation, it fails. Use plain language, short sentences, common words, concrete nouns.
5. METAPHORS ARE BRIDGES — A metaphor does not need to explain the entire system. Its job is to give the listener an intuitive foothold so they can follow the next part of the story.
6. STRUCTURAL MAPPING — This is critical. The best metaphors resemble the real concept in HOW THE MECHANISM WORKS, not just how it looks. There must be a logical correspondence between the metaphor system and the real system.
7. DO NOT OVER-ENGINEER — Use the metaphor to illustrate the key idea, then move on. Do not try to map every detail.
8. AVOID CLICHÉS — No "well-oiled machine", "tip of the iceberg", "as thin as a human hair", "the size of several buses". Favour unexpected but fitting comparisons.
9. EVERYDAY LANGUAGE — If a 10-year-old cannot picture it, the metaphor is too complicated. No abstract terms, no technical vocabulary, no systems language (parameters, variables, optimisation, frameworks).
10. CLARITY OVER EMOTION — The primary function is clarity. Emotional resonance is a bonus, not a requirement.

INTERNAL PROCESS (do not show this to the user):
- Generate 8-10 candidate metaphors internally
- Score each against the 10 principles above
- Select the best 5, one for each slot below

THE 5 SLOTS:
1. "structural" — The metaphor where the mechanism maps most cleanly onto the real concept
2. "visual" — The one that creates the strongest, most vivid mental image
3. "topical" — A metaphor using a current cultural moment (see below)
4. "brute" — A DELIBERATELY UNEXPECTED domain. Pick something surprising (a dishwasher, a trampoline, a vending machine, a school lunch queue) and force a connection. This mirrors the Story Studio "Brute Creativity" exercise. These unexpected connections often produce the most memorable metaphors.
5. "simplest" — The one a 10-year-old could explain back to you. Maximum clarity, minimum complexity.
${conceptHint}${zeitgeistHint}

WHAT THE USER FINDS HARD TO EXPLAIN:
${description.slice(0, 2500)}

For each metaphor, provide:
- "metaphor": The metaphor itself, 1-2 sentences, plain everyday language
- "whyItWorks": One sentence explaining the structural mapping (what in the metaphor corresponds to what in the real concept)
- "expandable": true/false — whether this metaphor can be safely extended with more detail
- "expandNote": If expandable, suggest one extension. If not, explain why it should be kept tight.
- "type": One of "structural", "visual", "topical", "brute", "simplest"

Respond with JSON: {"metaphors": [{...}, {...}, {...}, {...}, {...}]}`;

        const raw = await callClaude(prompt);
        const parsed = await parseJSON<{ metaphors: object[] }>(raw);
        return NextResponse.json({ result: parsed.metaphors });
      }

      case "analyseLanguage": {
        const { text } = params as { text: string };
        const prompt = `Analyse the following text for three types of language used in Story Studio training:
- VISUAL language: metaphors, imagery, sensory detail, scenarios that paint pictures
- EMOTIONAL language: words that evoke feelings, urgency, empathy, personal connection
- LOGICAL language: facts, statistics, evidence, reasoning, credibility markers

For each type, give:
1. A score from 0-100 representing how much of that type is present
2. Up to 3 specific phrases from the text that exemplify that type
3. Up to 2 concrete suggestions for adding more of that type

Also provide an overall 2-sentence assessment of the language balance.

Text to analyse: "${text.slice(0, 2000)}"

Respond with JSON: {
  "visual": {"score": N, "examples": [...], "suggestions": [...]},
  "emotional": {"score": N, "examples": [...], "suggestions": [...]},
  "logical": {"score": N, "examples": [...], "suggestions": [...]},
  "overall": "assessment text"
}`;
        const raw = await callClaude(prompt);
        const result = await parseJSON<object>(raw);
        return NextResponse.json({ result });
      }

      case "structureStory": {
        const { story } = params as { story: string };
        const prompt = `You are a storytelling coach. A user has shared a rough story or anecdote. Restructure it into three different narrative frameworks, and provide coaching for each.

1. PIP (Problem-Inspiration-Payoff): Identify the problem/tension, the unique insight or approach, and the positive outcome.
2. SCR (Setup-Conflict-Resolution): Set the scene, introduce the conflict/tension, then resolve it.
3. PEP (Past-Event-Present): How things were before, what changed, and where things stand now.

For each framework, write 2-3 sentences per section and a short coaching note (1-2 sentences) about how to deliver it effectively.

Story: ${story.slice(0, 2500)}

Respond with JSON: {
  "pip": {"problem": "...", "inspiration": "...", "payoff": "...", "coaching": "..."},
  "scr": {"setup": "...", "conflict": "...", "resolution": "...", "coaching": "..."},
  "pep": {"past": "...", "event": "...", "present": "...", "coaching": "..."}
}`;
        const raw = await callClaude(prompt);
        const result = await parseJSON<object>(raw);
        return NextResponse.json({ result });
      }

      case "generatePrisms": {
        const { description } = params as { description: string };
        const prompt = `You are a communications coach teaching "prisming" — the technique of retelling a story from multiple stakeholder perspectives.

Given this description of someone's work, identify 5-6 different stakeholders who are affected by or connected to this work. For each stakeholder, provide:
1. Who they are (stakeholder name)
2. A one-line angle description (what makes their perspective interesting)
3. A 2-3 sentence retelling of the work from THEIR perspective, in first person or close third person

Description: ${description.slice(0, 2000)}

Respond with JSON: {"prisms": [{"stakeholder": "...", "angle": "...", "perspective": "..."}, ...]}`;
        const raw = await callClaude(prompt);
        const { prisms } = await parseJSON<{ prisms: object[] }>(raw);
        return NextResponse.json({ result: prisms });
      }

      case "prepInterview": {
        const { topic, format } = params as { topic: string; format: string };
        const prompt = `You are a media training coach preparing someone for an interview. Based on the topic and format below, generate:

1. 4 likely questions a journalist or presenter would ask, with suggested answers (2-3 sentences each, using visual and emotional language)
2. 3 blocking & bridging scenarios — difficult or off-topic questions with a "block" response and a "bridge" back to key messages
3. 4 practical delivery tips specific to this interview context

Topic: ${topic.slice(0, 2000)}
Format: ${format || "General media interview"}

Respond with JSON: {
  "likelyQuestions": [{"question": "...", "suggestedAnswer": "..."}, ...],
  "blockingBridging": [{"scenario": "...", "block": "...", "bridge": "..."}, ...],
  "deliveryTips": ["tip 1", "tip 2", "tip 3", "tip 4"]
}`;
        const raw = await callClaude(prompt);
        const result = await parseJSON<object>(raw);
        return NextResponse.json({ result });
      }

      default:
        return NextResponse.json({ error: "Unknown type" }, { status: 400 });
    }
  } catch (err) {
    console.error("AI API error for type:", type, "—", err instanceof Error ? err.message : err);
    // In production, return the error so users know something failed.
    // In dev (no API key), fall back to mocks for testing.
    if (client) {
      return NextResponse.json(
        { error: "The AI service is temporarily unavailable. Please try again in a moment." },
        { status: 502 }
      );
    }
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

    // ── New portal tool mocks ──
    case "generateMetaphors":
      return NextResponse.json({
        result: [
          {
            metaphor: "It is like a combination lock — three separate dials have to line up at the exact same time before anything opens. Turn one without the others and nothing happens.",
            whyItWorks: "This works because your concept also involves multiple independent factors that must align simultaneously before a result is achieved — the lock mechanism mirrors that dependency.",
            expandable: true,
            expandNote: "You could extend this: each dial represents one of the factors, and you can name them. 'The funding dial, the policy dial, and the community readiness dial all have to click into place.'",
            type: "structural",
          },
          {
            metaphor: "Picture a river that has been dammed for years. Your work is not building a new river — it is removing the dam and letting what was always there flow again.",
            whyItWorks: "This creates a vivid image of release and natural flow, and maps onto the idea that the solution already exists within the system — you are unblocking, not inventing.",
            expandable: false,
            expandNote: "Keep this one tight. Extending it into irrigation channels or downstream effects risks overcomplicating a beautifully simple image.",
            type: "visual",
          },
          {
            metaphor: "Think of a vending machine. You put in the right coins, press the right button, and a specific product drops out. But if someone has jammed the mechanism with the wrong coin, every selection fails — even though the machine looks fine from the outside.",
            whyItWorks: "The vending machine is deliberately unexpected but maps well: inputs must be correct, the failure is hidden inside the mechanism, and the outside appearance gives no clue something is wrong.",
            expandable: true,
            expandNote: "You could extend: 'Our job is to open up the machine and find the jammed coin — not to build a new machine.'",
            type: "brute",
          },
          {
            metaphor: "It is like teaching someone to ride a bike. You cannot do it by reading a manual. You have to get on, wobble, fall, and eventually your body learns something your brain cannot explain.",
            whyItWorks: "This maps onto concepts where understanding comes through practice rather than instruction — the learning is embodied, not theoretical.",
            expandable: false,
            expandNote: "This metaphor is strongest as a single image. Extending it into gear changes or training wheels dilutes the simplicity.",
            type: "simplest",
          },
          {
            metaphor: "Your work is essentially doing what a good subtitle does on a foreign film — the story was always brilliant, but most people could not access it until someone translated it into language they already understand.",
            whyItWorks: "This maps onto translation and accessibility work: the value already exists, the barrier is language and framing, and your role is to make it legible without changing the substance.",
            expandable: true,
            expandNote: "You could extend: 'And like subtitles, the best version is one you barely notice — the audience just follows the story.'",
            type: "structural",
          },
        ],
      });
    case "analyseLanguage":
      return NextResponse.json({
        result: {
          visual: { score: 25, examples: [], suggestions: ["Try adding a metaphor or scenario that helps the reader picture your idea.", "Use sensory language — what does your work look, sound, or feel like?"] },
          emotional: { score: 20, examples: [], suggestions: ["Connect to a human consequence — who benefits and how does it change their life?", "Use words that create urgency or hope."] },
          logical: { score: 55, examples: [], suggestions: ["Your logical language is strong. Consider pairing one key statistic with an emotional framing to increase impact."] },
          overall: "Your text leans heavily on logical language, which builds credibility but may not hold attention on its own. Try adding visual metaphors and emotional hooks to create a more balanced and compelling piece.",
        },
      });
    case "structureStory":
      return NextResponse.json({
        result: {
          pip: { problem: "The challenge your audience faces is real and urgent — name it clearly and make them feel the gap between what is and what should be.", inspiration: "Your approach is different because it addresses what others have missed — be specific about the mechanism or insight.", payoff: "If this works, describe the changed world — not the academic contribution, but the human outcome.", coaching: "Lead with the problem to create tension, then let the inspiration resolve it. The payoff should feel inevitable by the time you reach it." },
          scr: { setup: "Set the scene with a specific moment, place, or person that draws the listener in.", conflict: "Introduce the obstacle, the surprise, or the thing that went wrong — this is where attention peaks.", resolution: "Show how the conflict was resolved and what it means for the future.", coaching: "Do not rush to the resolution. The conflict is where your audience is most engaged — let it breathe." },
          pep: { past: "Describe how things were before your work began — the status quo that needed changing.", event: "What happened? What was the turning point, discovery, or decision that changed things?", present: "Where are things now, and what does that mean for what comes next?", coaching: "This structure works brilliantly for personal stories and origin stories. Keep the 'event' vivid and specific." },
        },
      });
    case "generatePrisms":
      return NextResponse.json({
        result: [
          { stakeholder: "The End User", angle: "The person whose daily life changes", perspective: "From my perspective, this is not about research or innovation — it is about whether my Tuesday morning gets easier. I do not care how it works. I care that it works for me." },
          { stakeholder: "The Funder", angle: "The person deciding whether to invest", perspective: "I need to see return. Not just scientific return, but real-world impact I can point to in my next board meeting. Show me the numbers and show me the people." },
          { stakeholder: "The Sceptic", angle: "The person who has seen similar claims before", perspective: "I have heard this before — another project promising to change everything. What makes this one different? I need proof, not promises." },
          { stakeholder: "The Practitioner", angle: "The person who will implement it on the ground", perspective: "If this does not work in my context, with my resources and my constraints, it does not work at all. Show me it fits the real world, not just the lab." },
          { stakeholder: "The Next Generation", angle: "The student or early-career researcher", perspective: "This work gives me hope that what I am studying actually matters. It shows me there is a path from research to real impact." },
        ],
      });
    case "prepInterview":
      return NextResponse.json({
        result: {
          likelyQuestions: [
            { question: "Can you explain what your work is about in simple terms?", suggestedAnswer: "At its core, we are trying to solve a problem that affects thousands of people every day. Think of it as building a better bridge between what research knows and what communities actually experience." },
            { question: "Why should our listeners care about this?", suggestedAnswer: "Because this affects people they know. The statistics are striking, but behind every number is a real person waiting for this to get better. That is why it matters." },
            { question: "What makes your approach different from what has been tried before?", suggestedAnswer: "Previous approaches treated this as a one-size-fits-all problem. We started by listening to the people most affected and built the solution around their reality, not our assumptions." },
            { question: "What happens next?", suggestedAnswer: "We are at a tipping point. The evidence is in and the approach works. What we need now is the commitment from decision-makers to take this from a proven pilot to a standard practice." },
          ],
          blockingBridging: [
            { scenario: "A question about internal politics or funding disputes", block: "I am not going to speculate on internal processes — that would not be fair to the people involved.", bridge: "What I can tell you is that the work itself is producing results that speak for themselves, and that is what I would love to focus on." },
            { scenario: "A question trying to get you to criticise a competitor", block: "I have a lot of respect for everyone working in this space — the more people tackling this problem, the better.", bridge: "What makes our approach distinctive is the way we have involved communities from day one. That is the story I would love to tell you about." },
            { scenario: "A question about something outside your expertise", block: "That is a really important question, but it falls outside my area of expertise and I would not want to give you an incomplete answer.", bridge: "What I can speak to with confidence is the direct impact we are seeing on the ground, and that is genuinely exciting." },
          ],
          deliveryTips: [
            "Smile when you greet the presenter and use their name in your first answer — it builds instant rapport.",
            "Keep your answers to 30-45 seconds. If the presenter starts nodding quickly, they are politely asking you to wrap up.",
            "Have your three key messages written on a card in front of you. If the conversation drifts, bridge back to them.",
            "Speak slightly slower than feels natural. What feels slow to you sounds clear and confident to the listener.",
          ],
        },
      });
    default:
      return NextResponse.json({ error: "Unknown type" }, { status: 400 });
  }
}
