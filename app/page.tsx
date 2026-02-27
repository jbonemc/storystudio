"use client";

import { useState, useCallback } from "react";
import { Progress } from "@/components/ui/progress";
import { AppState, TOTAL_STEPS, STEP_LABELS } from "@/lib/types";
import { UploadStep } from "@/components/steps/UploadStep";
import { BehaviourChangeStep } from "@/components/steps/BehaviourChangeStep";
import { ShouldStatementStep } from "@/components/steps/ShouldStatementStep";
import { KeyMessagesStep } from "@/components/steps/KeyMessagesStep";
import { StoriesStep } from "@/components/steps/StoriesStep";
import { StatisticsStep } from "@/components/steps/StatisticsStep";
import { SoundbitesStep } from "@/components/steps/SoundbitesStep";
import { SummaryStep } from "@/components/steps/SummaryStep";

const initialMessage = () => ({
  text: "", story: "", storyAdvice: "", statistic: "", statisticAdvice: "", soundbite: "", soundbiteAdvice: "",
});

export default function Home() {
  const [state, setState] = useState<AppState>({
    step: 0, documents: "", documentSummary: "", behaviourChange: "",
    shouldStatements: [], selectedShouldStatement: "", customShouldStatement: "",
    suggestedMessages: [], selectedMessages: [], messageExplanations: [],
    messages: [initialMessage(), initialMessage(), initialMessage()], isLoading: false,
  });

  const updateState = useCallback((partial: Partial<AppState>) => {
    setState((prev) => ({ ...prev, ...partial }));
  }, []);
  const nextStep = useCallback(() => {
    setState((prev) => ({ ...prev, step: Math.min(prev.step + 1, TOTAL_STEPS - 1) }));
  }, []);
  const prevStep = useCallback(() => {
    setState((prev) => ({ ...prev, step: Math.max(prev.step - 1, 0) }));
  }, []);
  const goToStep = useCallback((step: number) => {
    setState((prev) => ({ ...prev, step }));
  }, []);

  const progressPercent = ((state.step + 1) / TOTAL_STEPS) * 100;

  const renderStep = () => {
    const p = { state, updateState };
    switch (state.step) {
      case 0: return <UploadStep {...p} onNext={nextStep} />;
      case 1: return <BehaviourChangeStep {...p} onNext={nextStep} onBack={prevStep} />;
      case 2: return <ShouldStatementStep {...p} onNext={nextStep} onBack={prevStep} />;
      case 3: return <KeyMessagesStep {...p} onNext={nextStep} onBack={prevStep} />;
      case 4: return <StoriesStep {...p} onNext={nextStep} onBack={prevStep} />;
      case 5: return <StatisticsStep {...p} onNext={nextStep} onBack={prevStep} />;
      case 6: return <SoundbitesStep {...p} onNext={nextStep} onBack={prevStep} />;
      case 7: return <SummaryStep state={state} goToStep={goToStep} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F8FB]">
      <header className="bg-[#1F4E79] text-white py-4 px-6 shadow-md">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Story Studio</h1>
            <p className="text-sm text-blue-200 mt-0.5">Content Tool Builder</p>
          </div>
          <div className="text-right text-sm text-blue-200">Step {state.step + 1} of {TOTAL_STEPS}</div>
        </div>
      </header>
      <div className="max-w-3xl mx-auto px-6 pt-4">
        <div className="flex items-center gap-1 mb-2 flex-wrap">
          {STEP_LABELS.map((label, i) => (
            <button key={i} onClick={() => i <= state.step && goToStep(i)} disabled={i > state.step}
              className={`text-[10px] font-medium px-1.5 py-0.5 rounded transition-colors ${
                i === state.step ? "bg-[#2E75B6] text-white"
                  : i < state.step ? "bg-[#1F4E79] text-white cursor-pointer hover:bg-[#2E75B6]"
                  : "bg-gray-200 text-gray-400"}`}>
              {label}
            </button>
          ))}
        </div>
        <Progress value={progressPercent} className="h-1.5 bg-gray-200 [&>div]:bg-[#2E75B6]" />
      </div>
      <main className="max-w-3xl mx-auto px-6 py-6">{renderStep()}</main>
      <footer className="text-center text-xs text-gray-400 py-6">
        Story Studio Content Tool · storystudiocourse.com · Problem → Inspiration → Payoff
      </footer>
    </div>
  );
}
