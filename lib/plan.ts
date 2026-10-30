import type { AppState } from "@/lib/types";
import type { PlanContext } from "@/lib/ai/prompts";

/** What the AI needs to know about the participant's Content Tool plan so far. */
export function planFromState(s: AppState): PlanContext {
  return {
    documents: s.documents,
    behaviourChange: s.behaviourChange,
    audience: s.audience,
    shouldStatement: s.customShouldStatement || s.selectedShouldStatement,
    messages: s.selectedMessages,
    stories: s.messages.map((m) => m.story),
    statistics: s.messages.map((m) => m.statistic),
    soundbites: s.messages.map((m) => m.soundbite),
    watchouts: s.watchouts,
  };
}

/** The parts of the state worth saving (no loading flags or AI coaching text). */
export function savableState(s: AppState) {
  const { isLoading: _l, ...rest } = s;
  void _l;
  return rest;
}

export function planTitle(s: AppState) {
  const base = s.behaviourChange || s.documentSummary || s.documents;
  const t = base.trim().replace(/\s+/g, " ");
  return t ? (t.length > 70 ? `${t.slice(0, 67)}...` : t) : "Content Tool plan";
}
