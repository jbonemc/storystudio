"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Users, Sparkles } from "lucide-react";
import type { AppState, AudienceState } from "@/lib/types";
import { aiSuggestAudience, toAIError, type AIRequestError } from "@/lib/aiClient";
import { AIErrorNotice } from "@/components/portal/AIErrorNotice";
import { planFromState } from "@/lib/plan";

interface Props {
  state: AppState;
  updateState: (p: Partial<AppState>) => void;
  onNext: () => void;
  onBack: () => void;
}

const FIELDS: { key: keyof AudienceState; label: string; hint: string; rows: number }[] = [
  { key: "who", label: "Who is in the room?", hint: "The person or group whose decision matters most. Name them as specifically as you can.", rows: 3 },
  { key: "think", label: "What do they already think or know about this?", hint: "Where are they starting from? Supportive, sceptical, never heard of it?", rows: 3 },
  { key: "care", label: "What do they care about most?", hint: "In their terms, not yours: budgets, patients, reputation, their own workload...", rows: 3 },
  { key: "barriers", label: "What could get in the way?", hint: "Physical (room, Zoom), cultural, language (jargon), perception (who they think you are), or the messenger (should someone else say it?).", rows: 4 },
];

export function AudienceStep({ state, updateState, onNext, onBack }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AIRequestError | null>(null);
  const a = state.audience;

  const set = (key: keyof AudienceState, value: string) => updateState({ audience: { ...a, [key]: value } });

  const handleSuggest = async () => {
    setLoading(true);
    setError(null);
    try {
      const s = await aiSuggestAudience(planFromState(state));
      // Only fill boxes the participant has left empty.
      updateState({
        audience: {
          who: a.who.trim() ? a.who : s.who || "",
          think: a.think.trim() ? a.think : s.think || "",
          care: a.care.trim() ? a.care : s.care || "",
          barriers: a.barriers.trim() ? a.barriers : s.barriers || "",
        },
      });
    } catch (err) {
      setError(toAIError(err));
    } finally {
      setLoading(false);
    }
  };

  const canProceed = a.who.trim().length >= 3;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold text-[#1F4E79] mb-2">Who do you need to move?</h2>
        <p className="text-gray-600 leading-relaxed">
          Think about who they are, what they care about and what motivates them. Then consider the
          barriers between you and them. Every suggestion from here on is written for this audience.
        </p>
      </div>

      <Card className="border-gray-200">
        <CardContent className="pt-5 space-y-4">
          {FIELDS.map((f) => (
            <div key={f.key}>
              <label className="text-sm font-medium text-[#1F4E79] block mb-0.5">{f.label}</label>
              <p className="text-xs text-gray-500 mb-1.5">{f.hint}</p>
              <Textarea
                value={a[f.key]}
                onChange={(e) => set(f.key, e.target.value)}
                rows={f.rows}
                className="text-sm border-gray-300"
              />
            </div>
          ))}
          <Button
            variant="outline"
            onClick={handleSuggest}
            disabled={loading}
            className="gap-2 border-[#2E75B6] text-[#2E75B6] hover:bg-[#EAF2FA]"
            size="sm"
          >
            {loading ? <Users className="w-3.5 h-3.5 animate-pulse" /> : <Sparkles className="w-3.5 h-3.5" />}
            {loading ? "Thinking about your audience..." : "Help me fill in the empty boxes"}
          </Button>
        </CardContent>
      </Card>

      {error && <AIErrorNotice error={error} onRetry={handleSuggest} />}

      <div className="flex justify-between pt-2">
        <Button variant="ghost" onClick={onBack} className="gap-2 text-gray-500">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <Button onClick={onNext} disabled={!canProceed} className="bg-[#1F4E79] hover:bg-[#163a5c] text-white gap-2">
          Next: Should Statement <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
