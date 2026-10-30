export interface MessageData {
  text: string;
  story: string;
  storyAdvice: string;
  statistic: string;
  statisticAdvice: string;
  soundbite: string;
  soundbiteAdvice: string;
}

export interface AudienceState {
  who: string;
  think: string;
  care: string;
  barriers: string;
}

export interface AppState {
  step: number;
  documents: string;
  documentSummary: string;
  behaviourChange: string;
  shouldStatements: string[];
  selectedShouldStatement: string;
  customShouldStatement: string;
  suggestedMessages: string[];
  selectedMessages: string[];
  messageExplanations: string[];
  messages: MessageData[];
  /** WHO: the audience this plan is for. */
  audience: AudienceState;
  /** WATCHOUT: what could trip them up, and how they will handle it. */
  watchouts: string[];
  isLoading: boolean;
}

export const TOTAL_STEPS = 10;

export const STEP_LABELS = [
  "Upload",
  "Why",
  "Who",
  "Should Statement",
  "Key Messages",
  "Stories",
  "Statistics",
  "Soundbites",
  "Watchout",
  "Summary"
];
