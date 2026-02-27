"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { AppState } from "@/lib/types";
import { aiGenerateShouldStatements } from "@/lib/aiClient";
import { ArrowLeft, ArrowRight, Sparkles, Pencil } from "lucide-react";

interface Props {
  state: AppState;
  updateState: (p: Partial<AppState>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function ShouldStatementStep({ state, updateState, onNext, onBack }: Props) {
  const [isCustom, setIsCustom] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (state.shouldStatements.length === 0) {
      setLoading(true);
      aiGenerateShouldStatements(state.documents, state.behaviourChange)
        .then((statements) => {
          updateState({ shouldStatements: statements });
        })
        .finally(() => setLoading(false));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selected = isCustom ? state.customShouldStatement : state.selectedShouldStatement;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold text-[#1F4E79] mb-2">Your Should Statement</h2>
        <p className="text-gray-600 leading-relaxed">
          A Should Statement names what your work is ultimately fighting for &mdash; in one plain-language
          sentence. It opens every talk with purpose and emotion.
        </p>
      </div>

      {loading ? (
        <Card className="border-gray-200">
          <CardContent className="py-8 text-center">
            <Sparkles className="w-6 h-6 text-[#2E75B6] mx-auto mb-2 animate-pulse" />
            <p className="text-sm text-gray-500">Generating should statements based on your project...</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-2">
            {state.shouldStatements.map((stmt, i) => (
              <button
                key={i}
                onClick={() => { updateState({ selectedShouldStatement: stmt }); setIsCustom(false); }}
                className={`block w-full text-left text-sm p-4 rounded border transition-all ${
                  !isCustom && state.selectedShouldStatement === stmt
                    ? "bg-[#1F4E79] text-white border-[#1F4E79] shadow-sm"
                    : "bg-white border-gray-200 hover:border-[#2E75B6] text-gray-700"
                }`}
              >
                &ldquo;{stmt}&rdquo;
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="h-px bg-gray-200 flex-1" />
            <span className="text-xs text-gray-400 uppercase tracking-wide">or</span>
            <div className="h-px bg-gray-200 flex-1" />
          </div>

          <Card className={`border-gray-200 ${isCustom ? "ring-2 ring-[#2E75B6]" : ""}`}>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <Pencil className="w-3.5 h-3.5 text-[#2E75B6]" />
                <label className="text-sm font-medium text-gray-700">Write your own</label>
              </div>
              <Input
                value={state.customShouldStatement}
                onChange={(e) => { updateState({ customShouldStatement: e.target.value }); setIsCustom(true); }}
                onFocus={() => setIsCustom(true)}
                placeholder="Every person affected by... should have access to..."
                className="text-sm border-gray-300"
              />
            </CardContent>
          </Card>
        </>
      )}

      <div className="flex justify-between pt-2">
        <Button variant="ghost" onClick={onBack} className="gap-2 text-gray-500">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <Button onClick={onNext} disabled={!selected || selected.trim().length < 5} className="bg-[#1F4E79] hover:bg-[#163a5c] text-white gap-2">
          Next: Key Messages <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
