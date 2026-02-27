"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { AppState } from "@/lib/types";
import { aiSuggestBehaviourChanges } from "@/lib/aiClient";
import { ArrowLeft, ArrowRight, Lightbulb } from "lucide-react";

interface Props {
  state: AppState;
  updateState: (p: Partial<AppState>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function BehaviourChangeStep({ state, updateState, onNext, onBack }: Props) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

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
          This is the North Star of your entire communication. After your audience hears you,
          what should they <strong>think differently</strong> or <strong>do differently</strong>?
          Be specific — &ldquo;raise awareness&rdquo; isn&apos;t enough. What concrete action or shift in thinking
          are you after?
        </p>
      </div>

      <Card className="border-gray-200 shadow-sm">
        <CardContent className="pt-5">
          <label className="text-sm font-medium text-gray-700 block mb-2">
            The behaviour or thought change I want from my audience is:
          </label>
          <Textarea
            value={state.behaviourChange}
            onChange={(e) => updateState({ behaviourChange: e.target.value })}
            placeholder="e.g. I want the funding committee to approve a three-year grant for our clinical trial..."
            className="min-h-[100px] text-sm border-gray-300 focus:border-[#2E75B6] focus:ring-[#2E75B6]"
          />
        </CardContent>
      </Card>

      {!showSuggestions && (
        <Button
          variant="outline"
          onClick={handleShowSuggestions}
          className="gap-2 border-[#2E75B6] text-[#2E75B6] hover:bg-[#EAF2FA]"
        >
          <Lightbulb className="w-4 h-4" /> Help me think about this
        </Button>
      )}

      {showSuggestions && (
        <Card className="border-[#2E75B6]/30 bg-[#EAF2FA]/50">
          <CardContent className="pt-5">
            {loadingSuggestions ? (
              <p className="text-sm text-gray-500">Generating suggestions...</p>
            ) : (
              <>
                <p className="text-sm font-medium text-[#1F4E79] mb-3">
                  Here are some common behaviour changes to consider. Click one to use it as a starting point:
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
