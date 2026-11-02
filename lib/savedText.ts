// Turns any saved Story Bank item into readable plain text, for display,
// copying and downloading.

export const TOOL_LABELS: Record<string, string> = {
  "content-tool": "Content Tool plans",
  metaphor: "Metaphors",
  language: "Language Analyser",
  "story-coach": "Story Coach",
  prism: "Prisming",
  opposites: "Opposites",
  "should-statement": "Should Statements",
  "interview-prep": "Interview prep",
  practice: "Practice sessions",
  "audience-planner": "Audience plans",
};

const KEY_LABELS: Record<string, string> = {
  pip: "PIP", scr: "SCR", pep: "PEP", qa: "Q&A",
  whyItWorks: "Why it works", expandNote: "Extension", suggestedAnswer: "Suggested answer",
  blockingBridging: "Blocking and bridging", deliveryTips: "Delivery tips", likelyQuestions: "Likely questions",
  thirtySecond: "30-second version", usualFraming: "Your usual framing", useWhen: "Use it when",
  usualMessage: "The message your audience expects", oppositeOf: "Opposite of", lands: "Where it lands", care: "Handle with care",
  readingTheRoom: "Reading the room", goingWell: "Going well", notGoingWell: "Not going well",
  draftFeedback: "Feedback on your draft", keyMessages: "Key messages", betterAnswer: "Better answer",
};

function label(key: string) {
  if (KEY_LABELS[key]) return KEY_LABELS[key];
  const spaced = key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

// Fields that are internal or not worth printing.
const SKIP = new Set(["expandable", "type", "id", "isLoading", "step", "spans", "documentSummary"]);

/** A generic, readable rendering of nested data. */
export function genericText(value: unknown, indent = ""): string {
  if (value == null || value === "") return "";
  if (typeof value === "string") return indent + value;
  if (typeof value === "number" || typeof value === "boolean") return indent + String(value);
  if (Array.isArray(value)) {
    return value
      .map((v) => {
        const t = genericText(v, indent + "  ").trimStart();
        return t ? `${indent}- ${t}` : "";
      })
      .filter(Boolean)
      .join("\n");
  }
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .filter(([k, v]) => !SKIP.has(k) && v != null && v !== "" && !(Array.isArray(v) && !v.length))
      .map(([k, v]) => {
        if (typeof v === "string" || typeof v === "number") return `${indent}${label(k)}: ${v}`;
        const inner = genericText(v, indent + "  ");
        return inner ? `${indent}${label(k)}:\n${inner}` : "";
      })
      .filter(Boolean)
      .join("\n");
  }
  return "";
}

interface PlanLike {
  documents?: string;
  behaviourChange?: string;
  audience?: { who?: string; think?: string; care?: string; barriers?: string };
  customShouldStatement?: string;
  selectedShouldStatement?: string;
  selectedMessages?: string[];
  messages?: { story?: string; statistic?: string; soundbite?: string }[];
  watchouts?: string[];
}

export function planText(p: PlanLike): string {
  const out: string[] = [];
  const should = p.customShouldStatement || p.selectedShouldStatement;
  if (p.behaviourChange) out.push(`WHY (the change you want)\n${p.behaviourChange}`);
  const a = p.audience || {};
  const who = [a.who && `Who: ${a.who}`, a.think && `They think: ${a.think}`, a.care && `They care about: ${a.care}`, a.barriers && `Barriers: ${a.barriers}`].filter(Boolean);
  if (who.length) out.push(`WHO (your audience)\n${who.join("\n")}`);
  if (should) out.push(`SHOULD STATEMENT\n"${should}"`);
  const pip = ["Problem", "Inspiration", "Payoff"];
  (p.selectedMessages || []).forEach((m, i) => {
    if (!m) return;
    const d = p.messages?.[i] || {};
    out.push(
      [`MESSAGE ${i + 1} (${pip[i]}): ${m}`, d.story && `  Story: ${d.story}`, d.statistic && `  Statistic: ${d.statistic}`, d.soundbite && `  Soundbite: "${d.soundbite}"`]
        .filter(Boolean)
        .join("\n")
    );
  });
  if (p.watchouts?.length) out.push(`WATCHOUT\n${p.watchouts.map((w) => `- ${w}`).join("\n")}`);
  return out.join("\n\n") || "This plan has not been started yet.";
}

interface PracticeLike {
  mode?: string;
  topic?: string;
  history?: { q?: string; a?: string }[];
  feedback?: ({ worked?: string; change?: string; betterAnswer?: string } | null)[];
  summary?: string;
}

function practiceText(p: PracticeLike): string {
  const out: string[] = [`${p.mode === "qa" ? "Q&A drill" : "Interview practice"}: ${p.topic || ""}`];
  (p.history || []).forEach((h, i) => {
    const f = p.feedback?.[i];
    out.push(
      [`Q${i + 1}: ${h.q || ""}`, h.a && `Your answer: ${h.a}`, f?.worked && `What worked: ${f.worked}`, f?.change && `One change: ${f.change}`, f?.betterAnswer && `Better version: ${f.betterAnswer}`]
        .filter(Boolean)
        .join("\n")
    );
  });
  if (p.summary) out.push(`Summary: ${p.summary}`);
  return out.join("\n\n");
}

export function savedItemText(tool: string, data: unknown): string {
  if (!data || typeof data !== "object") return String(data ?? "");
  if (tool === "content-tool") return planText(data as PlanLike);
  if (tool === "practice") return practiceText(data as PracticeLike);
  return genericText(data);
}
