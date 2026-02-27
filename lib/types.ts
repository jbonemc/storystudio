export interface MessageData {
  text: string;
  story: string;
  storyAdvice: string;
  statistic: string;
  statisticAdvice: string;
  soundbite: string;
  soundbiteAdvice: string;
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
  isLoading: boolean;
}

export const TOTAL_STEPS = 8;

export const STEP_LABELS = [
  "Upload",
  "Behaviour Change",
  "Should Statement",
  "Key Messages",
  "Stories",
  "Statistics",
  "Soundbites",
  "Summary"
];
