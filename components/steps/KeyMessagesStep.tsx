import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { AppState } from "@/lib/types";
import { aiGeneratePIPSuggestions } from "@/lib/aiClient";
import type { PIPSuggestions } from "@/lib/mockAI";
import { ArrowLeft, ArrowRight, Sparkles, Check, Pencil } from "lucide-react";

interface Props {
  state: AppState;
  updateState: (p: Partial<AppState>) => void;
  onNext: () => void;
  onBack: () => void;
}

const PIP_ROLES = [
  {
    key: "problem" as const,
    badge: "P",
    badgeClasses: "bg-red-50 text-red-600 border border-red-200",
    label: "Problem",
    question: "What is the specific problem your research is trying to solve?",
    hint: "Keep this to 1–2 sentences. Name the problem, its scale, and why it persists. Ask: what would make a thoughtful sceptic say 'yes, that IS worth solving'?",
    coach: "The best problem statements have tension built in — they describe a gap between what is and what should be. That gap is what makes an audience lean forward and want to hear what comes next.",
  },
  {
    key: "inspiration" as const,
    badge: "I",
    badgeClasses: "bg-amber-50 text-amber-600 border border-amber-200",
    label: "Inspiration",
    question: "What is unique about your approach? What have you found or built?",
    hint: "This is not a repeat of the problem — it is your answer to it. What makes your work different from what has been tried before? Name the mechanism, the finding, the breakthrough.",
    coach: "This message should begin to resolve the tension your Problem sets up. Strong Inspiration statements are specific — they tell you not just what you're doing, but what makes it different from everything that came before.",
  },
  {
    key: "payoff" as const,
    badge: "P",
    badgeClasses: "bg-emerald-50 text-emerald-600 border border-emerald-200",
    label: "Payoff",
    question: "If your work succeeds, how does the world look different?",
    hint: "The Payoff is the most neglected part of research communication. Don't describe your work — describe the world after it succeeds. Think: lives changed, systems transformed. This is why your research matters to someone who will never read your paper.",
    coach: "This is why everything before it was worth saying. A strong Payoff gives funders and policymakers a reason to care that goes beyond the research itself — and it's the message that stays with people long after the conversation ends.",
  },
];

export function KeyMessagesStep({ state, updateState, onNext, onBack }: Props) {
  const shouldStatement = state.customShouldStatement || state.selectedShouldStatement;
  const [inputs, setInputs] = useState(["", "", ""]);
  const [pipSuggestions, setPipSuggestions] = useState<PIPSuggestions | null>(null);
  const [showSuggestions, setShowSuggestions] = useState([false, false, false]);

  const getSuggestionsForSlot = (slotIndex: number): string[] => {
    if (!pipSuggestions) return [];
    const keys: Array<keyof PIPSuggestions> = ["problem", "inspiration", "payoff"];
    return pipSuggestions[keys[slotIndex]] || [];
  };

  const handleInspire = async (slotIndex: number) => {
    if (!pipSuggestions) {
      const suggestions = await aiGeneratePIPSuggestions(state.documents, shouldStatement);
      setPipSuggestions(suggestions);
    }
    const updated = [...showSuggestions];
    updated[slotIndex] = !updated[slotIndex];
    setShowSuggestions(updated);
  };

  const handleSelectSuggestion = (slotIndex: number, text: string) => {
    const updated = [...inputs];
    updated[slotIndex] = text;
    setInputs(updated);
    const hide = [...showSuggestions];
    hide[slotIndex] = false;
    setShowSuggestions(hide);
  };

  const handleSet = (slotIndex: number) => {
    const val = inputs[slotIndex].trim();
    if (val.length < 10) return;
    const sel = [...state.selectedMessages];
    sel[slotIndex] = val;
    const msgs = state.messages.map((msg, i) => ({ ...msg, text: sel[i] || msg.text }));
    updateState({ selectedMessages: sel, messages: msgs });
  };

  const handleEdit = (slotIndex: number) => {
    const sel = [...state.selectedMessages];
    sel[slotIndex] = "";
    updateState({ selectedMessages: sel });
  };

  const confirmedCount = state.selectedMessages.filter(s => s && s.trim().length > 0).length;
  const has3 = confirmedCount === 3;

  return (
    <div className="space-y-5">

      <div>
        <h2 className="text-2xl font-semibold text-[#1F4E79] mb-2">Three Key Messages</h2>
        <p className="text-gray-600 leading-relaxed">
          Your three messages follow the <strong>PIP</strong> structure — <strong>Problem, Inspiration, Payoff</strong>.
          Each does a different job. Together they build an irresistible case, step by step.
        </p>
        <div className="mt-3 p-3 bg-[#EAF2FA]/70 rounded text-sm text-[#1F4E79]">
          <strong>Your Should Statement:</strong> &ldquo;{shouldStatement}&rdquo;
        </div>
      </div>

      <div className="space-y-4">
        {PIP_ROLES.map((role, slotIndex) => {
          const confirmed = !!(state.selectedMessages[slotIndex]?.trim().length);
          const suggestions = getSuggestionsForSlot(slotIndex);

          return (
            <Card
              key={role.key}
              className={`border transition-colors ${confirmed ? "border-[#2E75B6]/30 bg-[#EAF2FA]/15" : "border-gray-200 bg-white"}`}
            >
              <CardContent className="pt-4 space-y-3">

                {/* Slot header */}
                <div className="flex items-center gap-2.5">
                  <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold flex-shrink-0 ${role.badgeClasses}`}>
                    {role.badge}
                  </span>
                  <span className="text-sm font-semibold text-[#1F4E79]">
                    Message {slotIndex + 1} — {role.label}
                  </span>
                  {confirmed && <Check className="w-4 h-4 text-emerald-600 ml-auto flex-shrink-0" />}
                </div>

                {/* Guiding question */}
                <p className="text-sm font-medium text-gray-800 leading-snug">{role.question}</p>

                {confirmed ? (
                  /* ── Confirmed state ── */
                  <div className="space-y-2.5">
                    <div className="p-3 bg-[#1F4E79]/5 border-l-2 border-[#2E75B6] rounded-r text-sm text-[#1F4E79] font-medium leading-relaxed">
                      &ldquo;{state.selectedMessages[slotIndex]}&rdquo;
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed italic pl-1">{role.coach}</p>
                    <button
                      onClick={() => handleEdit(slotIndex)}
                      className="text-xs text-[#2E75B6] hover:underline flex items-center gap-1 pl-1"
                    >
                      <Pencil className="w-3 h-3" /> Edit this message
                    </button>
                  </div>
                ) : (
                  /* ── Input state ── */
                  <div className="space-y-2.5">
                    <p className="text-xs text-gray-400 leading-relaxed">{role.hint}</p>

                    <Textarea
                      value={inputs[slotIndex]}
                      onChange={(e) => {
                        const updated = [...inputs];
                        updated[slotIndex] = e.target.value;
                        setInputs(updated);
                      }}
                      placeholder="Keep it to 1–2 clear sentences..."
                      className="text-sm resize-none border-gray-200 focus:border-[#2E75B6]"
                      rows={2}
                    />

                    <div className="flex gap-2 flex-wrap">
                      <Button
                        onClick={() => handleSet(slotIndex)}
                        disabled={inputs[slotIndex].trim().length < 10}
                        size="sm"
                        className="bg-[#1F4E79] hover:bg-[#163a5c] text-white"
                      >
                        <Check className="w-3.5 h-3.5 mr-1" /> Set this message
                      </Button>
                      <Button
                        onClick={() => handleInspire(slotIndex)}
                        size="sm"
                        variant="outline"
                        className="border-[#2E75B6] text-[#2E75B6] hover:bg-[#EAF2FA]"
                      >
                        <Sparkles className="w-3.5 h-3.5 mr-1" />
                        {showSuggestions[slotIndex] ? "Hide ideas" : "Inspire me"}
                      </Button>
                    </div>

                    {/* Suggestions panel */}
                    {showSuggestions[slotIndex] && suggestions.length > 0 && (
                      <div className="space-y-2 pt-1">
                        <p className="text-xs text-gray-400">
                          Click any option to use it as a starting point — then edit to make it yours:
                        </p>
                        {suggestions.map((s, si) => (
                          <button
                            key={si}
                            onClick={() => handleSelectSuggestion(slotIndex, s)}
                            className="block w-full text-left text-xs p-3 rounded border border-gray-200 hover:border-[#2E75B6] hover:bg-[#EAF2FA]/40 text-gray-600 transition-all leading-relaxed"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* All 3 confirmed summary nudge */}
      {has3 && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-sm text-emerald-800 flex items-start gap-2">
          <Check className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-600" />
          <span>
            All three messages set. Problem → Inspiration → Payoff — that is a complete, coherent case that builds step by step toward your behaviour change.
          </span>
        </div>
      )}

      <div className="flex justify-between pt-2">
        <Button variant="ghost" onClick={onBack} className="gap-2 text-gray-500">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <Button onClick={onNext} disabled={!has3} className="bg-[#1F4E79] hover:bg-[#163a5c] text-white gap-2">
          Next: Stories <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
