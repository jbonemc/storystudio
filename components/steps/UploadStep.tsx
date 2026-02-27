"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { AppState } from "@/lib/types";
import { aiSummariseDocument } from "@/lib/aiClient";
import { FileText, ArrowRight } from "lucide-react";

interface Props {
  state: AppState;
  updateState: (p: Partial<AppState>) => void;
  onNext: () => void;
}

export function UploadStep({ state, updateState, onNext }: Props) {
  const handleAnalyse = async () => {
    updateState({ isLoading: true });
    try {
      const summary = await aiSummariseDocument(state.documents);
      updateState({ documentSummary: summary, isLoading: false });
    } catch {
      updateState({ isLoading: false });
    }
  };

  const canProceed = state.documentSummary && state.documents.split(/\s+/).length >= 15;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold text-[#1F4E79] mb-2">
          Let&apos;s build your communication plan
        </h2>
        <p className="text-gray-600 leading-relaxed">
          Start by sharing what your project is about. Paste an abstract, executive summary,
          research description, or any document that explains your work. The more context
          you give me, the better I can help.
        </p>
      </div>

      <Card className="border-gray-200 shadow-sm">
        <CardContent className="pt-5">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-[#2E75B6]" />
            <label className="text-sm font-medium text-gray-700">Your project content</label>
          </div>
          <Textarea
            value={state.documents}
            onChange={(e) => updateState({ documents: e.target.value, documentSummary: "" })}
            placeholder="Paste your abstract, summary, or project description here..."
            className="min-h-[200px] resize-y text-sm border-gray-300 focus:border-[#2E75B6] focus:ring-[#2E75B6]"
          />
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-gray-400">
              {state.documents.split(/\s+/).filter(Boolean).length} words
            </span>
            <Button
              onClick={handleAnalyse}
              disabled={state.documents.trim().length < 20 || state.isLoading}
              className="bg-[#2E75B6] hover:bg-[#1F4E79] text-white"
            >
              {state.isLoading ? "Analysing..." : "Analyse my content"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {state.documentSummary && (
        <Card className="border-[#2E75B6]/30 bg-[#EAF2FA]/50">
          <CardContent className="pt-5">
            <p className="text-sm font-medium text-[#1F4E79] mb-1">What I understood:</p>
            <p className="text-sm text-gray-700 leading-relaxed">{state.documentSummary}</p>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button
          onClick={onNext}
          disabled={!canProceed}
          className="bg-[#1F4E79] hover:bg-[#163a5c] text-white gap-2"
        >
          Next: Behaviour Change <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
