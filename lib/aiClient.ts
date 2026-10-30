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

export async function aiGenerateShouldStatements(documents: string, behaviourChange: string): Promise<string[]> {
  return callAI<string[]>("generateShouldStatements", { documents, behaviourChange });
}

export async function aiGeneratePIPSuggestions(
  documents: string,
  shouldStatement: string
): Promise<{ problem: string[]; inspiration: string[]; payoff: string[] }> {
  return callAI("generatePIPSuggestions", { documents, shouldStatement });
}

export async function aiGenerateStoryAdvice(story: string, messageIndex: number): Promise<string> {
  return callAI<string>("generateStoryAdvice", { story, messageIndex });
}

export async function aiGenerateStatisticAdvice(statistic: string, messageIndex: number): Promise<string> {
  return callAI<string>("generateStatisticAdvice", { statistic, messageIndex });
}

export async function aiGenerateSoundbiteOptions(message: string, messageIndex: number): Promise<string[]> {
  return callAI<string[]>("generateSoundbiteOptions", { message, messageIndex });
}

export async function aiGenerateSoundbiteAdvice(soundbite: string): Promise<string> {
  return callAI<string>("generateSoundbiteAdvice", { soundbite });
}
