// Every AI job the portal can run: its model tier, its prompt, and how to pick
// the result out of the model's JSON. The shared system prompt (Story Studio
// method, facts rule, house style) lives in ./system.ts.

import type { Tier } from "./models";

type Params = Record<string, unknown>;

export interface ToolDef {
  tier: Tier;
  build: (p: Params) => string;
  /** Pull the part of the parsed JSON the screen needs. Defaults to all of it. */
  pick?: (parsed: Record<string, unknown>) => unknown;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const str = (v: unknown, max = 4000) => (typeof v === "string" ? v.slice(0, max).trim() : "");
const list = (v: unknown) =>
  Array.isArray(v) ? v.filter((x) => typeof x === "string" && x.trim()).map((x) => (x as string).trim()) : [];

/** Everything the participant has decided so far in the Content Tool. */
export interface PlanContext {
  documents?: string;
  summary?: string;
  behaviourChange?: string;
  audience?: { who?: string; think?: string; care?: string; barriers?: string };
  shouldStatement?: string;
  messages?: string[];
  stories?: string[];
  statistics?: string[];
  soundbites?: string[];
  watchouts?: string[];
}

const PIP = ["Problem", "Inspiration", "Payoff"];

/** A plain-text block describing the plan so far, or "" if there is none. */
export function planBlock(raw: unknown, opts: { includeDocuments?: boolean } = {}): string {
  if (!raw || typeof raw !== "object") return "";
  const p = raw as PlanContext;
  const lines: string[] = [];
  if (opts.includeDocuments !== false && str(p.documents)) lines.push(`Their project, in their words:\n${str(p.documents, 6000)}`);
  if (str(p.behaviourChange)) lines.push(`The change they want (their Why): ${str(p.behaviourChange)}`);
  const a = p.audience || {};
  const aud = [
    str(a.who) && `Who is in the room: ${str(a.who)}`,
    str(a.think) && `What this audience already thinks or knows: ${str(a.think)}`,
    str(a.care) && `What this audience cares about: ${str(a.care)}`,
    str(a.barriers) && `Barriers they expect: ${str(a.barriers)}`,
  ].filter(Boolean);
  if (aud.length) lines.push(`Their audience (Who):\n${aud.join("\n")}`);
  if (str(p.shouldStatement)) lines.push(`Their Should Statement: "${str(p.shouldStatement)}"`);
  // Index by position, not by filtered list, so Message 2's story stays with Message 2.
  const at = (arr: unknown, i: number) => (Array.isArray(arr) ? str(arr[i]) : "");
  const msgs = Array.isArray(p.messages) ? p.messages : [];
  msgs.forEach((raw, i) => {
    const m = str(raw);
    if (!m) return;
    const parts = [`Message ${i + 1} (${PIP[i] || "Message"}): ${m}`];
    const s = at(p.stories, i);
    const st = at(p.statistics, i);
    const sb = at(p.soundbites, i);
    if (s) parts.push(`  Story: ${s}`);
    if (st) parts.push(`  Statistic: ${st}`);
    if (sb) parts.push(`  Soundbite: "${sb}"`);
    lines.push(parts.join("\n"));
  });
  const w = list(p.watchouts);
  if (w.length) lines.push(`Watchouts they have noted:\n- ${w.join("\n- ")}`);
  if (!lines.length) return "";
  return `THE PARTICIPANT'S PLAN SO FAR (use it; do not contradict their choices):\n${lines.join("\n\n")}\n\n`;
}

const AUDIENCE_HINTS: Record<string, string> = {
  public: "a general public audience with no specialist knowledge",
  children: "children of about ten, or adults who want the simplest possible picture",
  decision: "decision-makers such as a hospital board, funders or policymakers, who are busy and care about outcomes, cost and risk",
  specialists: "specialists in a neighbouring field, who know the basics but not this work",
};

// ── Tools ───────────────────────────────────────────────────────────────────

export const TOOLS: Record<string, ToolDef> = {
  // Content Tool ------------------------------------------------------------
  summariseDocument: {
    tier: "quick",
    build: (p) => `Read this description of someone's work and write a 2-3 sentence summary in the second person ("You are..."), noting the domain, the place and the people the work focuses on. End with: "Let us use this as the foundation for building your communication plan."

Respond with JSON: {"summary": "..."}

Document:
${str(p.documents, 8000)}`,
    pick: (r) => r.summary,
  },

  suggestBehaviourChanges: {
    tier: "standard",
    build: (p) => `${planBlock({ documents: p.documents })}Suggest 5 behaviour change goals this person might want from their audience.

RULES:
- Never suggest "raise awareness" or "increase profile". A behaviour change is something a specific person does, decides, funds, adopts or joins.
- Each suggestion is a different type of change, one each: (1) a concrete decision or formal commitment, (2) a practice change, (3) a mindset shift, (4) participation or direct engagement, (5) championing or amplification.
- Be specific to this work: name the actual topic, place, population or domain.
- Start each with an active verb ("Commit to...", "Adopt...", "Shift from... to...", "Sign up to...", "Publicly endorse...").
- One ask per suggestion, 1-2 sentences, concrete enough to put on a slide.

Respond with JSON: {"suggestions": ["...", "...", "...", "...", "..."]}`,
    pick: (r) => r.suggestions,
  },

  suggestAudience: {
    tier: "standard",
    build: (p) => `${planBlock(p.plan)}Help this person think about WHO they need to move to get the change they want. Suggest the most important audience and describe it, using only what their plan says plus general knowledge of that kind of audience. If the plan names no audience, suggest the most likely decision-maker for their Why.

Use Story Studio's five barrier types where they genuinely apply: physical (room, format, Zoom), cultural (work culture or literal culture), language (jargon), perception (who you are relative to them), messenger (someone else might be better placed to say it).

Respond with JSON: {"who": "1-2 sentences naming the key person or group in the room", "think": "what they probably already think or know about this, 1-2 sentences", "care": "what they care about most, in their terms, 1-2 sentences", "barriers": "the 2-3 barriers most likely to get in the way, each named by type with one line on why"}`,
  },

  generateShouldStatements: {
    tier: "standard",
    build: (p) => `${planBlock(p.plan ?? { documents: p.documents, behaviourChange: p.behaviourChange })}Write 5 Should Statements for this person.

A Should Statement is a short injustice claim. It names what is wrong with the world, not what the research does:
- Short enough to say right after your name.
- A moral claim about the world. No technology, methods or products.
- Patterns: "No [person] should [face this]..." or "We should not accept...". Vary the patterns.
- Good: "No child should go to school hungry when solutions already exist."
- Bad: "We should fund solar threshing technology in Zimbabwe." (too specific)
- If their audience is known, write statements that audience would feel.

Respond with JSON: {"statements": ["...", "...", "...", "...", "..."]}`,
    pick: (r) => r.statements,
  },

  generatePIPSuggestions: {
    tier: "standard",
    build: (p) => `${planBlock(p.plan ?? { documents: p.documents, shouldStatement: p.shouldStatement })}Suggest key messages for this person's three PIP slots:
- Problem: the injustice or unresolved gap. Creates tension. Connects to their Should Statement.
- Inspiration: what is unique about their approach, different from everything tried before.
- Payoff: how the world looks if this succeeds. Outcomes for people, not academic contributions. Point towards the change they want.

3 options per slot, each 1-2 sentences, written for their audience. Use only facts from their plan; bracket placeholders for anything missing.

Respond with JSON: {"problem": ["...", "...", "..."], "inspiration": ["...", "...", "..."], "payoff": ["...", "...", "..."]}`,
  },

  generateStoryAdvice: {
    tier: "standard",
    build: (p) => `${planBlock(p.plan)}This person wants to use the story below to support Message ${Number(p.messageIndex ?? 0) + 1}. Coach them on telling it (no longer than 90 seconds): how to open on the human moment, build tension, and connect it back to the message and their Should Statement (use the one in their plan; do not invent a new one). Lead with what already works. Keep it to about 200 words, in 3 short paragraphs separated by blank lines. Do not add details to the story that they did not give.

Story: ${str(p.story)}

Respond with JSON: {"advice": "..."}`,
    pick: (r) => r.advice,
  },

  generateStatisticAdvice: {
    tier: "standard",
    build: (p) => `${planBlock(p.plan)}This person wants to use the statistic below for Message ${Number(p.messageIndex ?? 0) + 1}. Coach them on framing it: anchor it to something their audience can picture, make it relatable, pair it with the human side. Use figures and places from their plan where they exist (for example their country or region); otherwise use a bracketed placeholder. Keep it to about 180 words in 2-3 short paragraphs, and end with one ready-to-say sentence using the number.

Statistic: ${str(p.statistic)}

Respond with JSON: {"advice": "..."}`,
    pick: (r) => r.advice,
  },

  generateSoundbiteOptions: {
    tier: "standard",
    build: (p) => `${planBlock(p.plan, { includeDocuments: false })}Write 3 soundbite options for this key message. A soundbite is under 15 words, memorable, something a person would repeat to a colleague without notes. A provocation or an insight, not a summary. Make the three genuinely different (for example: a contrast, an image, a challenge).

Key message: ${str(p.message)}

Respond with JSON: {"options": ["...", "...", "..."]}`,
    pick: (r) => r.options,
  },

  generateSoundbiteAdvice: {
    tier: "quick",
    build: (p) => `Say why this soundbite works, or what would make it work better, in two short paragraphs (under 150 words in total). Check: under 15 words, one idea, something to feel as well as know, no jargon an outsider would trip on. If it can be sharper, give one improved version.

Soundbite: "${str(p.soundbite, 300)}"

Respond with JSON: {"advice": "..."}`,
    pick: (r) => r.advice,
  },

  suggestWatchouts: {
    tier: "standard",
    build: (p) => `${planBlock(p.plan)}List the WATCHOUTS for this plan: the things most likely to trip this person up with this audience. Start from Jonathan's question: what is the one question they least want to be asked, and who is most likely to derail the room? Think about hard questions or objections, sensitivities (patients, families, colleagues, politics, commercial claims), jargon, claims they cannot yet back up, and barriers in the room. Only include ones that genuinely apply to this plan.

Give 4-6 watchouts. Each one: the watchout in a short sentence, and how to handle it in 1-2 sentences (a line they could say, or something to prepare).

Respond with JSON: {"watchouts": [{"watchout": "...", "handle": "..."}]}`,
    pick: (r) => r.watchouts,
  },

  reviewPlan: {
    tier: "deep",
    build: (p) => `${planBlock(p.plan)}Review this whole communication plan the way Jonathan would at the end of a Story Studio session. Check:
- Does every message move the audience towards the Why (the behaviour change)?
- Is it written for the Who, in their terms, without jargon?
- Is the Should Statement a broad injustice claim, not a description of the research?
- Do Problem, Inspiration and Payoff each do their own job, and does the Payoff describe the changed world rather than results?
- Is each story specific and human, each statistic framed and anchored, each soundbite under 15 words and repeatable?
- Are the watchouts covered?

Lead with what works (positive, then developmental). Then give the 3-5 changes that would make the biggest difference, most important first, each with a concrete rewrite or suggestion. Do not invent facts; use [brackets] for anything they need to supply.

Respond with JSON: {"overall": "2-3 sentences", "strengths": ["...", "..."], "fixes": [{"item": "which part, e.g. Message 2 soundbite", "issue": "...", "suggestion": "..."}], "nextStep": "one sentence on what to do before they present"}`,
  },

  // Episode 1: Language -----------------------------------------------------
  generateMetaphors: {
    tier: "deep",
    build: (p) => {
      const conceptType = str(p.conceptType, 100);
      const zeitgeist = str(p.zeitgeist, 300);
      const audience = AUDIENCE_HINTS[str(p.audience, 40)] || "";
      return `Design metaphors for the part of this person's work that is hardest to explain. Generate exactly 5, each chosen for a different reason.

PRINCIPLES (apply strictly):
1. Understood the moment it is heard, with no extra explanation.
2. The listener can picture it: concrete, physical images.
3. Shared human experience: everyday objects and processes, nothing niche or local.
4. It simplifies. Plain words, short sentences.
5. A metaphor is a bridge, not a full explanation.
6. Structural mapping: it works the way the real thing works, not just looks like it.
7. Don't over-engineer it.
8. No clichés ("well-oiled machine", "tip of the iceberg", "thinner than a human hair").
9. If a ten-year-old cannot picture it, it is too complicated. No systems language.
10. Clarity first; emotion is a bonus.

Work through 8-10 candidates privately, then keep the best 5, one per slot:
1. "structural": the cleanest mechanical mapping.
2. "visual": the strongest mental image.
3. "topical": uses a current cultural moment (see below).
4. "brute": Story Studio Brute Creativity. Pick a deliberately unexpected everyday object (a dishwasher, a trampoline, a vending machine, a school lunch queue) and force a connection.
5. "simplest": the one a ten-year-old could explain back to you.
${conceptType ? `\nThey describe the concept as: "${conceptType.replace(/_/g, " ")}". Favour metaphors whose mechanism mirrors that.` : ""}${audience ? `\nThe audience is ${audience}. Pitch every metaphor at them.` : ""}
${zeitgeist ? `TOPICAL MOMENT: they say "${zeitgeist}" is in the news right now. The "topical" metaphor must use it, but only if the mapping genuinely works; if it is weak, say so plainly in whyItWorks.` : `No topical moment given: make the "topical" slot a second strong structural metaphor.`}

WHAT THEY FIND HARD TO EXPLAIN:
${str(p.description, 2500)}

For each metaphor give:
- "metaphor": 1-2 sentences of plain everyday language
- "whyItWorks": one sentence on what in the metaphor corresponds to what in the real concept
- "expandable": true/false
- "expandNote": if expandable, one extension; if not, why to keep it tight
- "type": "structural" | "visual" | "topical" | "brute" | "simplest"

Respond with JSON: {"metaphors": [{...}, {...}, {...}, {...}, {...}]}`;
    },
    pick: (r) => r.metaphors,
  },

  moreMetaphors: {
    tier: "standard",
    build: (p) => `Someone liked this metaphor for explaining their work and wants more in the same spirit.

What they are explaining: ${str(p.description, 2000)}
The metaphor they liked: ${str(p.metaphor, 600)}

Write 3 fresh variations: same underlying mapping, different everyday images. Each must be instantly picturable, plain-language and not a cliché.

Respond with JSON: {"metaphors": [{"metaphor": "...", "whyItWorks": "...", "expandable": true, "expandNote": "...", "type": "structural"}]}  (type is always "structural", "visual", "brute" or "simplest", whichever fits best)`,
    pick: (r) => r.metaphors,
  },

  analyseLanguage: {
    tier: "standard",
    build: (p) => `Analyse the text below for the three types of language taught in Story Studio:
- VISUAL: creates pictures. Metaphors, imagery, sensory detail, scenes.
- EMOTIONAL: creates feeling. Urgency, hope, empathy, human stakes.
- LOGICAL: creates belief. Facts, numbers, evidence, reasoning, credibility markers.

For each type give: a score from 0-100 for how much is present; up to 3 example phrases quoted EXACTLY from the text that genuinely are that type (technical terms and jargon are not visual or emotional language; if a type is barely present, give an empty list); up to 2 concrete suggestions for adding more.

Also return "spans": every phrase in the text that is clearly visual, emotional or logical, each quoted EXACTLY as it appears (same spelling and punctuation) so it can be highlighted, with its type. Spans must not overlap.

Finish with an overall 2-sentence assessment of the balance.

Text: """${str(p.text, 3000)}"""

Respond with JSON: {
  "visual": {"score": N, "examples": [...], "suggestions": [...]},
  "emotional": {"score": N, "examples": [...], "suggestions": [...]},
  "logical": {"score": N, "examples": [...], "suggestions": [...]},
  "spans": [{"text": "...", "type": "visual" | "emotional" | "logical"}],
  "overall": "..."
}`,
  },

  rewriteLanguage: {
    tier: "standard",
    build: (p) => `Rewrite the text below so it balances visual, emotional and logical language for a non-specialist audience${str(p.audience, 300) ? ` (${str(p.audience, 300)})` : ""}. Keep every fact and claim exactly as given: do not add numbers, results, people or events that are not in the original. Where a picture or human moment would help but needs a fact they have not given, use a [bracketed placeholder]. Keep roughly the same length.

Text: """${str(p.text, 3000)}"""

Respond with JSON: {"rewrite": "...", "changes": ["one line per main change and why it helps", "..."]}`,
  },

  generateOpposites: {
    tier: "standard",
    build: (p) => `Story Studio's Opposites Device: think about how you usually talk about your work, then say the opposite. It breaks habitual phrasing and often produces a far more memorable opening.

Here is how this person usually describes their work:
${str(p.description, 2500)}

1. Name their usual framing in one plain sentence (the habit they are stuck in).
2. Write 4 opposite openings, each 1-2 sentences, each flipping a different expectation (for example: lead with failure instead of success, the small instead of the big, what we do not know instead of what we know, the audience's view instead of the researcher's). Each must stay true to their work; no invented facts.
3. For each, one line on when to use it and the risk to watch for. Write these in your own words; do not repeat course phrases such as "a spice, not a meal", which the screen already shows.

Respond with JSON: {"usualFraming": "...", "opposites": [{"line": "...", "flips": "what expectation it flips", "useWhen": "..."}], "tip": "one sentence of coaching"}`,
  },

  // Episode 2: Story --------------------------------------------------------
  shouldStatementCoach: {
    tier: "standard",
    build: (p) => {
      const draft = str(p.draft, 400);
      return `Help this person write their Should Statement: one sentence that names what their work is ultimately fighting for. It is a broad injustice claim about the world, short enough to say right after their name, with no technology or methods in it. Example: "No child should be left alone in the dark."

Their work: ${str(p.description, 2500)}
${draft ? `\nTheir own draft: "${draft}"\nFirst give feedback on the draft: what works, what to change, and an improved version that keeps their voice.` : ""}

Then write 5 options with varied patterns ("No [person] should...", "We should not accept...", "[People] should...", a contrast). For each, a one-line note on the feeling it creates.

Respond with JSON: {${draft ? `"draftFeedback": {"works": "...", "change": "...", "improved": "..."}, ` : ""}"statements": [{"statement": "...", "note": "..."}]}`;
    },
  },

  structureStory: {
    tier: "deep",
    build: (p) => `A person has shared a rough story. Restructure it in Story Studio's three frameworks, and say which one fits best.

- PIP (Problem, Inspiration, Payoff): the default when they have an approach that works or results to share.
- SCR (Setup, Conflict, Resolution): a classic arc for a story with a clear obstacle that was resolved, such as a case study or a patient story.
- PEP (Past, Event, Present): for when they do NOT have results yet. "We used to do it like this" (Past), then something seismic happened (Event), "so now we have to do it differently, here is what we are trying and why we think it will work" (Present).

Do not force-fit. Recommend the framework that genuinely suits this story and say why in one or two sentences. Write the other two as well so they can compare.

For each framework, 2-3 sentences per section and a 1-2 sentence coaching note on delivery. Use only what the story says; where a section needs something they have not given (their method, a result), write a [bracketed placeholder] that says what to add.

Also write a 30-second spoken version (about 75 words) using the recommended framework.

Story: ${str(p.story, 3000)}

Respond with JSON: {
  "recommended": "pip" | "scr" | "pep",
  "why": "...",
  "thirtySecond": "...",
  "pip": {"problem": "...", "inspiration": "...", "payoff": "...", "coaching": "..."},
  "scr": {"setup": "...", "conflict": "...", "resolution": "...", "coaching": "..."},
  "pep": {"past": "...", "event": "...", "present": "...", "coaching": "..."}
}`,
  },

  generatePrisms: {
    tier: "standard",
    build: (p) => `Teach "prisming": retelling a story from the point of view of different people affected by it. Each prism is a fresh way into the same work.

Identify 5-6 different stakeholders connected to this work. For each: who they are; a one-line angle (what makes their view interesting); and a 2-3 sentence retelling of the work from their perspective, in first person or close third person.

These are imagined voices to help find new angles. Ground each in what the description says. Do not give anyone invented backstory, events, anecdotes or figures; describe how they would feel about the facts given.

Description: ${str(p.description, 3000)}

Respond with JSON: {"prisms": [{"stakeholder": "...", "angle": "...", "perspective": "..."}]}`,
    pick: (r) => r.prisms,
  },

  prismOpening: {
    tier: "standard",
    build: (p) => `Write the opening of a talk about this work, told through one stakeholder's eyes (prisming). 3-5 sentences the speaker could say out loud, starting with that person's world rather than the research, then turning to the work. Use only facts from the description; [bracket] anything the speaker must fill in, such as a real person's name used with permission.

The work: ${str(p.description, 2500)}
The prism: ${str(p.stakeholder, 200)}: ${str(p.angle, 300)}
${str(p.audience, 300) ? `The audience: ${str(p.audience, 300)}` : ""}

Respond with JSON: {"opening": "...", "why": "one sentence on why this way in works for this audience"}`,
  },

  // Episode 3: Audience -----------------------------------------------------
  prepInterview: {
    tier: "deep",
    build: (p) => {
      const msgs = list(p.keyMessages);
      return `Prepare this person for a media interview.

Topic: ${str(p.topic, 3000)}
Format: ${str(p.format, 300) || "General media interview"}
${msgs.length ? `Their key messages (bridge back to these):\n${msgs.map((m, i) => `${i + 1}. ${m}`).join("\n")}` : "They have not given key messages: infer 2-3 from the topic and state them in suggested answers."}

Generate:
1. 4 likely questions a journalist or presenter would ask in this format, with suggested answers (2-3 sentences each, visual and emotional language, ending on a key message). Use only facts from the topic; [bracket] anything they must supply.
2. 3 blocking and bridging scenarios: the difficult, off-topic or hostile questions most likely for this topic, each with a short block and a bridge back to a key message.
3. 4 delivery tips specific to this format.

Respond with JSON: {
  "likelyQuestions": [{"question": "...", "suggestedAnswer": "..."}],
  "blockingBridging": [{"scenario": "...", "block": "...", "bridge": "..."}],
  "deliveryTips": ["...", "...", "...", "..."]
}`;
    },
  },

  practiceTurn: {
    tier: "deep",
    build: (p) => {
      const mode = p.mode === "qa" ? "qa" : "interview";
      const msgs = list(p.keyMessages);
      const history = Array.isArray(p.history) ? (p.history as { q?: string; a?: string }[]) : [];
      const maxQ = Math.min(Math.max(Number(p.maxQuestions) || 5, 2), 8);
      const answered = history.filter((h) => str(h.a)).length;
      const transcript = history
        .map((h, i) => `Q${i + 1}: ${str(h.q, 600)}${str(h.a) ? `\nA${i + 1}: ${str(h.a, 2000)}` : ""}`)
        .join("\n\n");
      const role =
        mode === "qa"
          ? `You are playing an audience member at the end of their talk (the Q&A). Ask the kinds of questions real audiences ask: sceptical, off-topic, too detailed, rambling, or "what does this mean for me". Vary them.`
          : `You are playing the journalist or presenter in this format${str(p.format, 200) ? ` (${str(p.format, 200)})` : ""}. Ask what a good interviewer would: open, then follow up on what they actually said, then push on weak spots, with at least one hard or off-topic question to practise blocking and bridging.`;
      const coach =
        mode === "qa"
          ? `Judge the last answer on Story Studio's thinking-on-your-feet techniques: did they clarify if needed, answer briefly, bridge to familiar ground or a key message, admit what they don't know, or use a three-part answer (Past, Present, Future, or Micro, Macro, Global)?`
          : `Judge the last answer as Jonathan would in media training: length for the format (radio and TV: 30 seconds or so, about 75 words; a broadcast clip is 15 to 20 seconds), plain language, a picture or human moment, blocking and bridging back to a key message when needed, and finishing on the message rather than trailing off.`;
      return `This is a practice session. ${role}

Topic: ${str(p.topic, 2500)}
${msgs.length ? `Their key messages:\n${msgs.map((m, i) => `${i + 1}. ${m}`).join("\n")}` : ""}

Session so far:
${transcript || "(not started)"}

${answered > 0 ? `${coach} Lead with what worked. Give one change that would help most, and a better version of their answer that keeps their facts and voice (do not add facts). Score it 1-5 on clarity, brevity and message.` : "Do not give feedback yet: just ask the first question."}

${answered >= maxQ ? `That was the last question. Set "done" to true, give no new question, and write a short overall summary: two strengths and the one habit to practise.` : `Then ask the next question (${answered + 1} of ${maxQ}). Questions only, no hints.`}

Respond with JSON: {
  "feedback": ${answered > 0 ? `{"worked": "...", "change": "...", "betterAnswer": "...", "scores": {"clarity": N, "brevity": N, "message": N}}` : "null"},
  "nextQuestion": ${answered >= maxQ ? "null" : `"..."`},
  "done": ${answered >= maxQ ? "true" : "false"},
  "summary": ${answered >= maxQ ? `"..."` : "null"}
}`;
    },
  },

  planAudience: {
    tier: "deep",
    build: (p) => `Help this person prepare for a meeting, talk or pitch where they need a specific outcome, using Story Studio's Audience episode.

The situation: ${str(p.situation, 2000)}
Who will be there: ${str(p.audience, 1500)}
What they want to happen: ${str(p.goal, 1000)}

Work out:
1. The ask: the one specific thing to ask for, phrased as they could say it.
2. Barriers: only those that genuinely apply, from physical (room, format, Zoom), cultural (work or literal culture), language (jargon), perception (who they are relative to this audience) and messenger (should someone else say it?). For each, the risk and the move that gets round it.
3. Persuasion: the 2-3 of Cialdini's principles (liking, reciprocity, authority, consensus or social proof, scarcity, consistency) that fit this audience best, each with a concrete, ethical move for this meeting.
4. An opening line written for this audience.
5. A listening plan for the 70/30 rule: 3 questions to ask them, and when to stop talking.
6. Reading the room: signs it is going well and what to do (make the ask), and signs it is not and what to do (switch to empathy, reprioritise, pick the one thing they must leave with).

Use only facts they have given; [bracket] anything they need to find out.

Respond with JSON: {
  "ask": "...",
  "barriers": [{"type": "...", "risk": "...", "move": "..."}],
  "persuasion": [{"principle": "...", "move": "..."}],
  "opening": "...",
  "listening": {"questions": ["...", "...", "..."], "note": "..."},
  "readingTheRoom": {"goingWell": "...", "notGoingWell": "..."}
}`,
  },
};
