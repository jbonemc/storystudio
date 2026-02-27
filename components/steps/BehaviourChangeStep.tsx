"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { AppState } from "@/lib/types";
import { aiSuggestBehaviourChanges } from "@/lib/aiClient";
import { ArrowLeft, ArrowRight, Lightbulb, AlertCircle } from "lucide-react";

interface Props {
  state: AppState;
  updateState: (p: Partial<AppState>) => void;
  onNext: () => void;
  onBack: () => void;
}

function isRaisingAwareness(text: string): boolean {
  const t = text.toLowerCase();
  return (
    t.includes("raise awareness") ||
    t.includes("raising awareness") ||
    t.includes("increase awareness") ||
    t.includes("build awareness") ||
    t.includes("raise the profile") ||
    t.includes("raise my profile") ||
    t.includes("raise the awareness") ||
    (t.includes("aware") && t.length < 80)
  );
}

export function BehaviourChangeStep({ state, updateState, onNext, onBack }: Props) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const showAwarenessNudge = isRaisingAwareness(state.behaviourChange);

  const handleShowSuggestions = async () => {
    setShowSuggestions(true);
    if (suggestions.length === 0) {
      setLoadingSuggestions(true);
      try {
        const s = await aiSuggestBehaviourChanges(state.documents);
        setSuggestions(s);
      } finally {
        setLoadingSuggestions(false);
      }
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold text-[#1F4E79] mb-2">
          What change do you want to create?
        </h2>
        <p className="text-gray-600 leading-relaxed">
          Every talk, presentation or pitch has a <strong>North Star</strong> — the one thing
          you want your audience to do or decide differently after hearing you. Get this right,
          and everything else falls into place.
        </p>
      </div>

      {/* Coaching box — always visible */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-4 pb-4">
          <p className="text-sm font-medium text-amber-800 mb-2">Three questions to find your North Star:</p>
          <ul className="text-sm text-amber-700 space-y-1">
            <li>→ <strong>Who</strong> is the most important person in the room — the one whose decision matters most?</li>
            <li>→ <strong>What</strong> would you want them to do, approve, fund, adopt, or change?</li>
            <li>→ <strong>When?</strong> What would success look like in the next six months?</li>
          </ul>
        </CardContent>
      </Card>

      <Card className="border-gray-200 shadow-sm">
        <CardContent className="pt-5">
          <label className="text-sm font-medium text-gray-700 block mb-2">
            After my audience hears me, I want them to:
          </label>
          <Textarea
            value={state.behaviourChange}
            onChange={(e) => updateState({ behaviourChange: e.target.value })}
            placeholder="e.g. I want the funding committee to approve a three-year grant for our field trial..."
            className="min-h-[100px] text-sm border-gray-300 focus:border-[#2E75B6] focus:ring-[#2E75B6]"
          />
        </CardContent>
      </Card>

      {/* Gentle "raise awareness" redirect */}
      {showAwarenessNudge && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-4 pb-4">
            <div className="flex gap-2">
              <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-orange-800 mb-1">
                  Raising awareness is a starting point, not a destination.
                </p>
                <p className="text-sm text-orange-700">
                  Once people are aware, what should they actually <em>do</em>? Think about 
                  the most important person in your audience — what would you want them to 
                  decide, fund, adopt, share, or change? That&apos;s your real behaviour change.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!showSuggestions && (
        <Button
          variant="outline"
          onClick={handleShowSuggestions}
          className="gap-2 border-[#2E75B6] text-[#2E75B6] hover:bg-[#EAF2FA]"
        >
          <Lightbulb className="w-4 h-4" /> Show me some examples based on my project
        </Button>
      )}

      {showSuggestions && (
        <Card className="border-[#2E75B6]/30 bg-[#EAF2FA]/50">
          <CardContent className="pt-5">
            {loadingSuggestions ? (
              <p className="text-sm text-gray-500">Thinking about your project...</p>
            ) : (
              <>
                <p className="text-sm font-medium text-[#1F4E79] mb-1">
                  Based on your project, here are five different types of change you could aim for.
                </p>
                <p className="text-sm text-gray-500 mb-3">
                  Click one to use it as a starting point — then make it your own.
                </p>
                <div className="space-y-2">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => updateState({ behaviourChange: s })}
                      className={`block w-full text-left text-sm p-3 rounded border transition-colors ${
                        state.behaviourChange === s
                          ? "bg-[#2E75B6] text-white border-[#2E75B6]"
                          : "bg-white border-gray-200 hover:border-[#2E75B6] text-gray-700"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between pt-2">
        <Button variant="ghost" onClick={onBack} className="gap-2 text-gray-500">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <Button
          onClick={onNext}
          disabled={state.behaviourChange.trim().length < 10}
          className="bg-[#1F4E79] hover:bg-[#163a5c] text-white gap-2"
        >
          Next: Should Statement <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
