"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw, ArrowLeft, Sparkles, Users } from "lucide-react";
import Link from "next/link";
import { callAI, toAIError, type AIRequestError } from "@/lib/aiClient";
import { AIErrorNotice } from "@/components/portal/AIErrorNotice";
import { SaveButton } from "@/components/portal/SaveButton";

interface PrismResult {
  stakeholder: string;
  perspective: string;
  angle: string;
}

export function PrismingTool() {
  const [input, setInput] = useState("");
  const [prisms, setPrisms] = useState<PrismResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [error, setError] = useState<AIRequestError | null>(null);
  const [opening, setOpening] = useState<{ index: number; opening: string; why: string } | null>(null);
  const [writing, setWriting] = useState(false);
  const [openingError, setOpeningError] = useState<AIRequestError | null>(null);

  const handleOpening = async (index: number) => {
    const p = prisms[index];
    setWriting(true);
    setOpeningError(null);
    try {
      const r = await callAI<{ opening: string; why: string }>("prismOpening", {
        description: input,
        stakeholder: p.stakeholder,
        angle: p.angle,
      });
      setOpening({ index, ...r });
    } catch (err) {
      setOpeningError(toAIError(err));
    } finally {
      setWriting(false);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await callAI<PrismResult[]>("generatePrisms", { description: input });
      setPrisms(result);
      setSelected(null);
      setOpening(null);
    } catch (err) {
      setError(toAIError(err));
    } finally {
      setLoading(false);
    }
  };

  const COLOURS = ["#8b5cf6", "#ec4899", "#f59e0b", "#22c55e", "#0ea5e9", "#ef4444"];

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <Link
        href="/episode/2-story"
        className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-navy transition-colors"
      >
        <ArrowLeft className="w-3 h-3" /> Episode 2: Story
      </Link>

      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-ep2/30 flex items-center justify-center">
            <RefreshCw className="w-4 h-4 text-navy" />
          </div>
          <h1 className="text-2xl font-bold text-navy">Prisming Tool</h1>
        </div>
        <p className="text-sm text-gray-500 leading-relaxed">
          Describe your work or project. The AI will identify different
          stakeholders affected by it and retell your story from each of their
          perspectives, revealing angles you may not have considered.
        </p>
      </div>

      <Card className="border-gray-200">
        <CardContent className="pt-5">
          <Textarea
            value={input}
            onChange={(e) => { setInput(e.target.value); setPrisms([]); }}
            placeholder="Describe your work, research, or project..."
            className="min-h-[120px] text-sm border-gray-300 focus:border-ep2 focus:ring-ep2"
          />
          <div className="flex justify-end mt-3">
            <Button
              onClick={handleGenerate}
              disabled={input.trim().length < 20 || loading}
              className="bg-navy hover:bg-navy-light text-white gap-2"
            >
              <Sparkles className="w-4 h-4" />
              {loading ? "Finding perspectives..." : "Find Perspectives"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && <AIErrorNotice error={error} onRetry={handleGenerate} />}

      {prisms.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-navy/40" />
            <h2 className="text-sm font-semibold text-navy">
              {prisms.length} perspectives on your work
            </h2>
          </div>
          <p className="text-xs text-gray-500">
            These are imagined voices to help you find new angles. Check anything
            you plan to say in public against what the people involved have told you.
          </p>
          {prisms.map((p, i) => (
            <button
              key={i}
              onClick={() => setSelected(selected === i ? null : i)}
              className={`block w-full text-left rounded-lg border p-4 transition-all ${
                selected === i
                  ? "border-navy/30 shadow-md bg-white"
                  : "border-gray-100 bg-gray-50 hover:border-gray-200"
              }`}
            >
              <div className="flex items-center gap-3 mb-1">
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: COLOURS[i % COLOURS.length] }}
                />
                <h3 className="text-sm font-semibold text-navy">
                  {p.stakeholder}
                </h3>
              </div>
              <p className="text-xs text-gray-500 ml-6">{p.angle}</p>
              {selected === i && (
                <div className="mt-3 ml-6 p-3 bg-ep2-light/40 rounded border border-ep2/20">
                  <p className="text-sm text-navy leading-relaxed">
                    {p.perspective}
                  </p>
                </div>
              )}
            </button>
          ))}

          {selected !== null && prisms[selected] && (
            <div className="rounded-lg border border-ep2/40 bg-white p-4 space-y-3">
              <p className="text-sm text-navy">
                <strong>Tell it from here.</strong> Pick the most interesting person on your list and
                tell your story from their point of view.
              </p>
              <Button onClick={() => handleOpening(selected)} disabled={writing} size="sm" className="bg-navy hover:bg-navy-light text-white gap-2">
                <Sparkles className="w-3.5 h-3.5" />
                {writing ? "Writing..." : `Write my opening as ${prisms[selected].stakeholder}`}
              </Button>
              {openingError && <AIErrorNotice error={openingError} onRetry={() => handleOpening(selected)} />}
              {opening?.index === selected && (
                <div className="space-y-2">
                  <p className="text-sm text-navy leading-relaxed bg-ep2-light/40 rounded p-3 border border-ep2/20">{opening.opening}</p>
                  <p className="text-xs text-gray-500">{opening.why}</p>
                </div>
              )}
            </div>
          )}

          <SaveButton
            tool="prism"
            title={`Prisms: ${input.trim().slice(0, 60)}`}
            data={{ input: { description: input }, result: prisms, opening: opening ? { stakeholder: prisms[opening.index]?.stakeholder, text: opening.opening } : null }}
          />
        </div>
      )}
    </div>
  );
}
