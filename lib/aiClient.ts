// Client-side helper that calls the /api/ai route.
// Falls back gracefully — the API route itself falls back to mock AI if no key is set.

async function callAI<T>(type: string, params: Record<string, unknown>): Promise<T> {
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, ...params }),
  });
  if (!res.ok) throw new Error(`AI request failed: ${res.status}`);
  const data = await res.json();
  return data.result as T;
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
