"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";

interface AnalysisResult {
  visual: { score: number; examples: string[]; suggestions: string[] };
  emotional: { score: number; examples: string[]; suggestions: string[] };
  logical: { score: number; examples: string[]; suggestions: string[] };
  overall: string;
}

const LANG_CONFIG = {
  visual: { label: "Visual", colour: "#6366f1", bg: "bg-indigo-50", border: "border-indigo-200" },
  emotional: { label: "Emotional", colour: "#ec4899", bg: "bg-pink-50", border: "border-pink-200" },
  logical: { label: "Logical", colour: "#f59e0b", bg: "bg-amber-50", border: "border-amber-200" },
} as const;

export function LanguageAnalyser() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyse = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "analyseLanguage", text: input }),
      });
      const data = await res.json();
      setResult(data.result);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <Link
        href="/episode/1-language"
        className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-navy transition-colors"
      >
        <ArrowLeft className="w-3 h-3" /> Episode 1: Language
      </Link>

      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-ep1/30 flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-navy" />
          </div>
          <h1 className="text-2xl font-bold text-navy">Language Analyser</h1>
        </div>
        <p className="text-sm text-gray-500 leading-relaxed">
          Paste any paragraph — a pitch, an abstract, an email — and see how
          much Visual, Emotional, and Logical language it contains. Get
          suggestions to strengthen the balance.
        </p>
      </div>

      <Card className="border-gray-200">
        <CardContent className="pt-5">
          <Textarea
            value={input}
            onChange={(e) => { setInput(e.target.value); setResult(null); }}
            placeholder="Paste your text here..."
            className="min-h-[140px] text-sm border-gray-300 focus:border-ep1 focus:ring-ep1"
          />
          <div className="flex justify-end mt-3">
            <Button
              onClick={handleAnalyse}
              disabled={input.trim().length < 20 || loading}
              className="bg-navy hover:bg-navy-light text-white gap-2"
            >
              <Sparkles className="w-4 h-4" />
              {loading ? "Analysing..." : "Analyse Language"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-4">
          {/* Score bars */}
          <div className="grid grid-cols-3 gap-3">
            {(["visual", "emotional", "logical"] as const).map((key) => {
              const cfg = LANG_CONFIG[key];
              const data = result[key];
              return (
                <div key={key} className="text-center">
                  <p className="text-xs font-semibold text-navy mb-1">
                    {cfg.label}
                  </p>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${data.score}%`,
                        backgroundColor: cfg.colour,
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{data.score}%</p>
                </div>
              );
            })}
          </div>

          {/* Overall assessment */}
          <Card className="border-navy/20 bg-navy/5">
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-navy leading-relaxed">
                {result.overall}
              </p>
            </CardContent>
          </Card>

          {/* Detailed breakdown */}
          {(["visual", "emotional", "logical"] as const).map((key) => {
            const cfg = LANG_CONFIG[key];
            const data = result[key];
            return (
              <Card key={key} className={`${cfg.border} ${cfg.bg}/30`}>
                <CardContent className="pt-4 pb-4 space-y-2">
                  <h3 className="text-sm font-semibold text-navy">
                    {cfg.label} Language
                  </h3>
                  {data.examples.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Found in your text:</p>
                      <ul className="text-xs text-gray-700 space-y-0.5">
                        {data.examples.map((ex, i) => (
                          <li key={i} className="italic">&ldquo;{ex}&rdquo;</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {data.suggestions.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Suggestions:</p>
                      <ul className="text-xs text-gray-700 space-y-0.5">
                        {data.suggestions.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
