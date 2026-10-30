// Example answers used only when no ANTHROPIC_API_KEY is set (local demos).
import { NextResponse } from "next/server";
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

// ── Mock fallback ─────────────────────────────────────────────────────────────
export function mockFallback(type: string, params: Record<string, unknown>) {
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
      return NextResponse.json(
        { error: "This tool needs the AI service, which is not configured here." },
        { status: 503 }
      );
  }
}
