import type { PlanContext } from "@/lib/ai/prompts";

// Client-side helper that calls the /api/ai route.
// Every tool goes through callAI so a failure always reaches the screen as an
// AIRequestError with a message the participant can act on.

export class AIRequestError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "AIRequestError";
    this.status = status;
  }
  /** True when the participant needs to sign in again before retrying. */
  get needsSignIn() {
    return this.status === 401;
  }
}

const FALLBACK_MESSAGES: Record<number, string> = {
  401: "Your session has ended. Please sign in again to keep using the tools.",
  429: "Lots of requests at once. Please wait a minute and try again.",
};

export function toAIError(err: unknown): AIRequestError {
  if (err instanceof AIRequestError) return err;
  return new AIRequestError(
    "We could not reach the AI service. Check your connection and try again.",
    0
  );
}

export async function callAI<T>(type: string, params: Record<string, unknown>): Promise<T> {
  let res: Response;
  try {
    res = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, ...params }),
    });
  } catch {
    throw toAIError(null);
  }

  let data: { result?: unknown; error?: string } = {};
  try {
    data = await res.json();
  } catch {
    // Non-JSON reply (for example a platform timeout page). Handled below.
  }

  if (!res.ok) {
    throw new AIRequestError(
      FALLBACK_MESSAGES[res.status] ||
        data.error ||
        "Something went wrong on our side. Please try again.",
      res.status
    );
  }

  const result = data.result;
  if (result == null || (Array.isArray(result) && result.length === 0)) {
    throw new AIRequestError(
      "The AI sent back an empty answer. Please try again.",
      res.status
    );
  }
  return result as T;
}

export async function aiSummariseDocument(documents: string): Promise<string> {
  return callAI<string>("summariseDocument", { documents });
}

export async function aiSuggestBehaviourChanges(documents: string): Promise<string[]> {
  return callAI<string[]>("suggestBehaviourChanges", { documents });
}

export interface AudienceProfile {
  who: string;
  think: string;
  care: string;
  barriers: string;
}

export async function aiSuggestAudience(plan: PlanContext): Promise<AudienceProfile> {
  return callAI<AudienceProfile>("suggestAudience", { plan });
}

export async function aiGenerateShouldStatements(plan: PlanContext): Promise<string[]> {
  return callAI<string[]>("generateShouldStatements", { plan });
}

export async function aiGeneratePIPSuggestions(
  plan: PlanContext
): Promise<{ problem: string[]; inspiration: string[]; payoff: string[] }> {
  return callAI("generatePIPSuggestions", { plan });
}

export async function aiGenerateStoryAdvice(story: string, messageIndex: number, plan: PlanContext): Promise<string> {
  return callAI<string>("generateStoryAdvice", { story, messageIndex, plan });
}

export async function aiGenerateStatisticAdvice(statistic: string, messageIndex: number, plan: PlanContext): Promise<string> {
  return callAI<string>("generateStatisticAdvice", { statistic, messageIndex, plan });
}

export async function aiGenerateSoundbiteOptions(message: string, messageIndex: number, plan: PlanContext): Promise<string[]> {
  return callAI<string[]>("generateSoundbiteOptions", { message, messageIndex, plan });
}

export async function aiGenerateSoundbiteAdvice(soundbite: string): Promise<string> {
  return callAI<string>("generateSoundbiteAdvice", { soundbite });
}

export interface Watchout {
  watchout: string;
  handle: string;
}

export async function aiSuggestWatchouts(plan: PlanContext): Promise<Watchout[]> {
  return callAI<Watchout[]>("suggestWatchouts", { plan });
}

export interface PlanReview {
  overall: string;
  strengths: string[];
  fixes: { item: string; issue: string; suggestion: string }[];
  nextStep: string;
}

export async function aiReviewPlan(plan: PlanContext): Promise<PlanReview> {
  return callAI<PlanReview>("reviewPlan", { plan });
}

// ── Saved work (Story Bank) ─────────────────────────────────────────────────

export interface SavedItem {
  id: string;
  tool: string;
  title: string;
  data: unknown;
  created_at?: string;
  updated_at: string;
}

async function savedRequest<T>(method: string, query: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api/saved${query}`, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw toAIError(null);
  }
  let data: { result?: T; error?: string } = {};
  try {
    data = await res.json();
  } catch {}
  if (!res.ok || data.result == null) {
    throw new AIRequestError(data.error || "Could not reach your Story Bank. Please try again.", res.status);
  }
  return data.result;
}

export const listSaved = (tool?: string) =>
  savedRequest<SavedItem[]>("GET", tool ? `?tool=${encodeURIComponent(tool)}` : "");

/** Creates or updates a saved item. Resolves only once the database confirms it. */
export const saveWork = (item: { id?: string; tool: string; title: string; data: unknown }) =>
  savedRequest<{ id: string; updated_at: string }>("POST", "", item);

export const deleteSaved = (id: string) => savedRequest<{ id: string }>("DELETE", `?id=${encodeURIComponent(id)}`);
