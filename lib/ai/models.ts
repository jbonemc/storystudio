// Which model each kind of job runs on. Change models here, or override them
// with the CLAUDE_MODEL (standard and deep) and CLAUDE_MODEL_QUICK env vars.
//
// quick    : short, low-stakes jobs (a summary, a two-paragraph comment).
//            Claude Haiku 5.5, no thinking. Roughly 20x cheaper than Sonnet.
// standard : most tools. Claude Sonnet 5.5, thinking off, so it answers fast.
// deep     : the complicated asks (interview prep and practice, plan review,
//            story structure, metaphors, audience planning). Claude Sonnet 5.5
//            with adaptive thinking at medium effort, so it can reason first.

export type Tier = "quick" | "standard" | "deep";

const MID = process.env.CLAUDE_MODEL || "claude-sonnet-5-5";
const LIGHT = process.env.CLAUDE_MODEL_QUICK || "claude-haiku-5-5";

// USD per million tokens, for the usage_log estimated_cost column.
// Keep in step with https://www.anthropic.com/pricing when models change.
const PRICES: Record<string, { input: number; output: number }> = {
  "claude-sonnet-5-5": { input: 2, output: 10 },
  "claude-haiku-5-5": { input: 0.1, output: 0.5 },
};

export interface TierConfig {
  model: string;
  maxTokens: number;
  /** Extra request fields: thinking and effort settings for this tier. */
  extra: Record<string, unknown>;
}

export function tierConfig(tier: Tier): TierConfig {
  if (tier === "quick") {
    return {
      model: LIGHT,
      maxTokens: 2048,
      // Haiku 5.5 thinks by default; switch it off for these short jobs.
      extra: LIGHT.startsWith("claude-haiku-5-5")
        ? { thinking: { type: "disabled" }, output_config: { effort: "low" } }
        : {},
    };
  }
  if (tier === "deep") {
    return {
      model: MID,
      maxTokens: 16000,
      extra: MID.startsWith("claude-sonnet-5-5")
        ? { thinking: { type: "adaptive" }, output_config: { effort: "medium" } }
        : {},
    };
  }
  return {
    model: MID,
    maxTokens: 4096,
    // Sonnet 5.5 thinks by default; "between_tools" is how it is switched off.
    extra: MID.startsWith("claude-sonnet-5-5") ? { thinking: { type: "between_tools" } } : {},
  };
}

export function estimateCost(model: string, inputTokens: number, outputTokens: number) {
  const p = PRICES[model] || PRICES["claude-sonnet-5-5"];
  return (inputTokens / 1_000_000) * p.input + (outputTokens / 1_000_000) * p.output;
}
