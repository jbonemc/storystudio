"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, AlertTriangle, Sparkles, Plus, X } from "lucide-react";
import type { AppState } from "@/lib/types";
import { aiSuggestWatchouts, toAIError, type AIRequestError, type Watchout } from "@/lib/aiClient";
import { AIErrorNotice } from "@/components/portal/AIErrorNotice";
import { planFromState } from "@/lib/plan";

interface Props {
  state: AppState;
  updateState: (p: Partial<AppState>) => void;
  onNext: () => void;
  onBack: () => void;
}

const asLine = (w: Watchout) => `${w.watchout} Handle it: ${w.handle}`;

export function WatchoutStep({ state, updateState, onNext, onBack }: Props) {
  const [suggestions, setSuggestions] = useState<Watchout[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AIRequestError | null>(null);
  const [draft, setDraft] = useState("");
  const list = state.watchouts;

  const handleSuggest = async () => {
    setLoading(true);
    setError(null);
    try {
      setSuggestions(await aiSuggestWatchouts(planFromState(state)));
    } catch (err) {
      setError(toAIError(err));
    } finally {
      setLoading(false);
    }
  };

  const add = (text: string) => {
    const t = text.trim();
    if (t && !list.includes(t)) updateState({ watchouts: [...list, t] });
  };
  const remove = (i: number) => updateState({ watchouts: list.filter((_, j) => j !== i) });

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold text-[#1F4E79] mb-2">Watchout</h2>
        <p className="text-gray-600 leading-relaxed">
          This is the section most people skip. It is also the most valuable to complete. What is the
          one question you least want to be asked? Who is most likely to derail the room?
        </p>
      </div>

      <Card className="border-gray-200">
        <CardContent className="pt-5 space-y-3">
          <p className="text-sm font-medium text-[#1F4E79]">Your watchouts</p>
          {list.length === 0 && <p className="text-sm text-gray-500">None yet. Add your own, or ask for suggestions below.</p>}
          <ul className="space-y-2">
            {list.map((w, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700 bg-amber-50/60 border border-amber-200 rounded p-2.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-700 mt-0.5 shrink-0" />
                <span className="flex-1">{w}</span>
                <button type="button" onClick={() => remove(i)} aria-label="Remove this watchout" className="text-gray-400 hover:text-gray-700">
                  <X className="w-3.5 h-3.5" />
                </button>
              </li>
            ))}
          </ul>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              add(draft);
              setDraft("");
            }}
          >
            <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="e.g. Someone will ask how much it costs" className="text-sm border-gray-300" />
            <Button type="submit" variant="outline" size="sm" disabled={!draft.trim()} className="gap-1 shrink-0">
              <Plus className="w-3.5 h-3.5" /> Add
            </Button>
          </form>
        </CardContent>
      </Card>

      <Button variant="outline" onClick={handleSuggest} disabled={loading} size="sm" className="gap-2 border-[#2E75B6] text-[#2E75B6] hover:bg-[#EAF2FA]">
        <Sparkles className="w-3.5 h-3.5" /> {loading ? "Looking for the tricky bits..." : "Suggest watchouts for my plan"}
      </Button>

      {error && <AIErrorNotice error={error} onRetry={handleSuggest} />}

      {suggestions.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500">Click any that apply to add them to your plan:</p>
          {suggestions.map((s, i) => {
            const line = asLine(s);
            const added = list.includes(line);
            return (
              <button
                key={i}
                type="button"
                onClick={() => add(line)}
                disabled={added}
                className={`block w-full text-left text-sm p-3 rounded border transition-colors ${
                  added ? "bg-[#EAF2FA] border-[#2E75B6]/30 text-gray-500" : "bg-white border-gray-200 hover:border-[#2E75B6] text-gray-700"
                }`}
              >
                <span className="font-medium text-[#1F4E79]">{s.watchout}</span>
                <span className="block mt-1 text-gray-600">How to handle it: {s.handle}</span>
                {added && <span className="block mt-1 text-xs text-[#2E75B6]">Added</span>}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex justify-between pt-2">
        <Button variant="ghost" onClick={onBack} className="gap-2 text-gray-500">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <Button onClick={onNext} className="bg-[#1F4E79] hover:bg-[#163a5c] text-white gap-2">
          View Complete Plan <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
