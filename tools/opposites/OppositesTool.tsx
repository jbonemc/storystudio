"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ArrowLeftRight, Sparkles, Copy, Check, Lightbulb } from "lucide-react";
import Link from "next/link";
import { callAI, toAIError, type AIRequestError } from "@/lib/aiClient";
import { AIErrorNotice } from "@/components/portal/AIErrorNotice";
import { SaveButton } from "@/components/portal/SaveButton";

interface Opposite {
  oppositeOf: string;
  line: string;
  lands: string;
  care?: string;
}

interface OppositesResult {
  usualMessage: string;
  opposites: Opposite[];
  tip: string;
}

const MIN_CHARS = 20;

export function OppositesTool() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<OppositesResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AIRequestError | null>(null);
  const [copied, setCopied] = useState<number | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await callAI<OppositesResult>("generateOpposites", {
        description: input,
      });
      setResult(res);
    } catch (err) {
      setError(toAIError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopied(idx);
    setTimeout(() => setCopied(null), 2000);
  };

  const opposites = result?.opposites ?? [];

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
            <ArrowLeftRight className="w-4 h-4 text-navy" />
          </div>
          <h1 className="text-2xl font-bold text-navy">Opposites Device</h1>
        </div>
        <div className="space-y-2 text-sm text-gray-500 leading-relaxed">
          <p>
            Open by saying the opposite of what the audience expects. It is
            risky, and when it works it buys you total attention for the next
            30 seconds.
          </p>
          <p>
            Take the message you always deliver and say the exact reverse,
            pushed far enough to be funny or startling. The joke gets the
            audience to your real point by a route they have not heard before.
          </p>
        </div>
      </div>

      <Card className="border-gray-200">
        <CardContent className="pt-5">
          <label
            htmlFor="opposites-input"
            className="text-sm font-medium text-navy block mb-1.5"
          >
            How do you usually describe your work?
          </label>
          <p className="text-xs text-gray-400 mb-2">
            Write it the way you normally would, at a conference or to a
            colleague, including the message you usually end on. That is what
            we will flip.
          </p>
          <Textarea
            id="opposites-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. My research looks at new ways to detect sepsis earlier in hospital patients using routine blood tests..."
            className="min-h-[110px] text-sm border-gray-300 focus:border-ep1 focus:ring-ep1"
          />
          <div className="flex justify-between items-center mt-3">
            <span className="text-xs text-gray-400">
              {input.trim().length < MIN_CHARS
                ? `At least ${MIN_CHARS} characters`
                : ""}
            </span>
            <Button
              onClick={handleGenerate}
              disabled={input.trim().length < MIN_CHARS || loading}
              className="bg-navy hover:bg-navy-light text-white gap-2"
            >
              <Sparkles className="w-4 h-4" />
              {loading ? "Thinking..." : "Find the Opposites"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && <AIErrorNotice error={error} onRetry={handleGenerate} />}

      {result && (
        <div className="space-y-4">
          {result.usualMessage && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs font-semibold text-navy/60 mb-1">
                The message your audience expects from you
              </p>
              <p className="text-sm text-gray-600 leading-relaxed">
                {result.usualMessage}
              </p>
            </div>
          )}

          {opposites.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-navy">
                {opposites.length} opposites to try
              </h2>
              {opposites.map((o, i) => (
                <Card
                  key={i}
                  className="border-gray-200 hover:border-ep1/40 transition-colors"
                >
                  <CardContent className="pt-4 pb-4">
                    {o.oppositeOf && (
                      <p className="text-xs font-semibold text-navy/60 mb-1.5">
                        {o.oppositeOf}
                      </p>
                    )}
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-base text-navy leading-relaxed font-medium">
                        {o.line}
                      </p>
                      <button
                        type="button"
                        onClick={() => handleCopy(o.line, i)}
                        aria-label="Copy this line"
                        className="shrink-0 mt-1 inline-flex items-center gap-1 text-xs text-gray-400 hover:text-navy transition-colors"
                      >
                        {copied === i ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-green-500" /> Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" /> Copy
                          </>
                        )}
                      </button>
                    </div>
                    <div className="mt-3 space-y-1 text-xs text-gray-600 leading-relaxed">
                      <p>
                        <strong className="text-navy/70">Where it lands:</strong>{" "}
                        {o.lands}
                      </p>
                      {o.care && (
                        <p>
                          <strong className="text-navy/70">Handle with care:</strong>{" "}
                          {o.care}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {result.tip && (
            <div className="flex items-start gap-2 p-3 bg-ep1-light/50 rounded-lg border border-ep1/20">
              <Lightbulb className="w-4 h-4 text-navy/60 shrink-0 mt-0.5" />
              <p className="text-xs text-navy/80 leading-relaxed">{result.tip}</p>
            </div>
          )}

          <SaveButton
            tool="opposites"
            title={input.trim().slice(0, 60)}
            data={{ input, result }}
          />
        </div>
      )}
    </div>
  );
}
