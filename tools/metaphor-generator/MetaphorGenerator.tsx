"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Lightbulb,
  ArrowLeft,
  Sparkles,
  Copy,
  Check,
  Info,
  ChevronDown,
  ChevronUp,
  Zap,
  Globe,
  Shuffle,
  Eye,
  Target,
} from "lucide-react";
import Link from "next/link";

const CONCEPT_TYPES = [
  { value: "", label: "Let the AI figure it out" },
  { value: "process_with_steps", label: "A process with steps" },
  { value: "things_aligning", label: "Multiple things needing to align" },
  { value: "scale_problem", label: "A scale or size problem" },
  { value: "hidden_mechanism", label: "A hidden or invisible mechanism" },
  { value: "transformation", label: "A transformation or change" },
  { value: "relationship", label: "A relationship between parts" },
  { value: "competing_forces", label: "Competing or opposing forces" },
  { value: "accumulation", label: "Small things adding up over time" },
];

interface MetaphorResult {
  metaphor: string;
  whyItWorks: string;
  expandable: boolean;
  expandNote: string;
  type: "structural" | "visual" | "topical" | "brute" | "simplest";
}

const TYPE_CONFIG: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }>; colour: string }
> = {
  structural: { label: "Best Structural Match", icon: Target, colour: "bg-indigo-100 text-indigo-700" },
  visual: { label: "Most Visual", icon: Eye, colour: "bg-pink-100 text-pink-700" },
  topical: { label: "Topical / Zeitgeist", icon: Globe, colour: "bg-amber-100 text-amber-700" },
  brute: { label: "Brute Creativity", icon: Shuffle, colour: "bg-emerald-100 text-emerald-700" },
  simplest: { label: "Simplest", icon: Zap, colour: "bg-sky-100 text-sky-700" },
};

export function MetaphorGenerator() {
  const [input, setInput] = useState("");
  const [conceptType, setConceptType] = useState("");
  const [zeitgeist, setZeitgeist] = useState("");
  const [showZeitgeist, setShowZeitgeist] = useState(false);
  const [showZeitgeistInfo, setShowZeitgeistInfo] = useState(false);
  const [results, setResults] = useState<MetaphorResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);
  const [expandedCard, setExpandedCard] = useState<number | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "generateMetaphors",
          description: input,
          conceptType,
          zeitgeist: zeitgeist.trim() || undefined,
        }),
      });
      const data = await res.json();
      setResults(data.result || []);
      setExpandedCard(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopied(idx);
    setTimeout(() => setCopied(null), 2000);
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
            <Lightbulb className="w-4 h-4 text-navy" />
          </div>
          <h1 className="text-2xl font-bold text-navy">Metaphor Generator</h1>
        </div>
        <p className="text-sm text-gray-500 leading-relaxed">
          Great metaphors make complex ideas instantly clear. They work because
          their <em>mechanism</em> mirrors your real concept — not just how it
          looks, but how it works. The best ones can be pictured by a
          10-year-old.
        </p>
      </div>

      {/* Step 1: The hard-to-explain part */}
      <Card className="border-gray-200">
        <CardContent className="pt-5 space-y-4">
          <div>
            <label className="text-sm font-medium text-navy block mb-1.5">
              What part of your work is most difficult to explain?
            </label>
            <p className="text-xs text-gray-400 mb-2">
              Focus on the concept, process, or mechanism that people struggle
              with — not your entire project.
            </p>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. Our immune therapy works by training the body's own cells to recognise a threat they've been ignoring. The hard part to explain is that we're not adding anything new — we're reprogramming what's already there..."
              className="min-h-[110px] text-sm border-gray-300 focus:border-ep1 focus:ring-ep1"
            />
          </div>

          {/* Step 2: Concept type */}
          <div>
            <label className="text-sm font-medium text-navy block mb-1.5">
              What kind of concept is this?
            </label>
            <p className="text-xs text-gray-400 mb-2">
              This helps find metaphors where the mechanism genuinely maps onto
              your idea.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {CONCEPT_TYPES.map((ct) => (
                <button
                  key={ct.value}
                  onClick={() => setConceptType(ct.value)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    conceptType === ct.value
                      ? "bg-navy text-white border-navy"
                      : "bg-white text-gray-600 border-gray-200 hover:border-ep1 hover:text-navy"
                  }`}
                >
                  {ct.label}
                </button>
              ))}
            </div>
          </div>

          {/* Step 3: Zeitgeist (collapsible) */}
          <div className="border-t border-gray-100 pt-3">
            <button
              onClick={() => setShowZeitgeist(!showZeitgeist)}
              className="flex items-center gap-2 text-sm font-medium text-navy/70 hover:text-navy transition-colors w-full"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Add a topical moment</span>
              <span className="text-xs text-gray-400 font-normal ml-1">
                (optional)
              </span>
              {showZeitgeist ? (
                <ChevronUp className="w-3.5 h-3.5 ml-auto" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 ml-auto" />
              )}
            </button>

            {showZeitgeist && (
              <div className="mt-3 space-y-2">
                <div className="flex items-start gap-2">
                  <Textarea
                    value={zeitgeist}
                    onChange={(e) => setZeitgeist(e.target.value)}
                    placeholder="e.g. The Traitors is massive on TV right now / the Oscars just happened / Liverpool won the Champions League..."
                    className="min-h-[60px] text-sm border-gray-300 focus:border-ep1 focus:ring-ep1"
                    rows={2}
                  />
                  <button
                    onClick={() => setShowZeitgeistInfo(!showZeitgeistInfo)}
                    className="shrink-0 mt-1 text-gray-400 hover:text-ep1 transition-colors"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                </div>

                {showZeitgeistInfo && (
                  <div className="p-3 bg-ep1-light/50 rounded-lg border border-ep1/20 text-xs text-navy/70 leading-relaxed space-y-1.5">
                    <p>
                      <strong>Topical metaphors</strong> connect your idea to
                      something your audience is already thinking about — a TV
                      show, a sporting result, a viral moment, a cultural event.
                    </p>
                    <p>
                      They work brilliantly for{" "}
                      <strong>live radio, television, and public talks</strong>{" "}
                      because the audience recognises the reference instantly and
                      it creates a shared moment of connection or humour.
                    </p>
                    <p>
                      They are less effective in{" "}
                      <strong>print, books, or evergreen content</strong> where
                      the reference may date quickly.
                    </p>
                    <p>
                      In Story Studio&apos;s Brute Creativity exercise, we show
                      that most people can explain their work through any random
                      object — the same is true of any live water-cooler moment.
                      If it&apos;s in the zeitgeist, it can probably carry your
                      metaphor.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Generate button */}
          <div className="flex justify-between items-center pt-1">
            <span className="text-xs text-gray-400">
              {input.split(/\s+/).filter(Boolean).length} words
            </span>
            <Button
              onClick={handleGenerate}
              disabled={input.trim().length < 15 || loading}
              className="bg-navy hover:bg-navy-light text-white gap-2"
            >
              <Sparkles className="w-4 h-4" />
              {loading ? "Generating..." : "Generate Metaphors"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-navy">
            5 metaphors — each chosen for a different reason
          </h2>

          {results.map((r, i) => {
            const cfg = TYPE_CONFIG[r.type] || TYPE_CONFIG.structural;
            const Icon = cfg.icon;
            const isExpanded = expandedCard === i;

            return (
              <Card
                key={i}
                className="border-gray-200 hover:border-ep1/40 transition-colors"
              >
                <CardContent className="pt-4 pb-4">
                  {/* Type badge */}
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.colour}`}
                    >
                      <Icon className="w-3 h-3" />
                      {cfg.label}
                    </span>
                    <button
                      onClick={() => handleCopy(r.metaphor, i)}
                      className="shrink-0 text-gray-300 hover:text-navy transition-colors"
                    >
                      {copied === i ? (
                        <Check className="w-3.5 h-3.5 text-green-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* The metaphor */}
                  <p className="text-sm text-navy leading-relaxed font-medium">
                    {r.metaphor}
                  </p>

                  {/* Expandable detail */}
                  <button
                    onClick={() =>
                      setExpandedCard(isExpanded ? null : i)
                    }
                    className="mt-2 text-xs text-ep1 hover:text-navy transition-colors flex items-center gap-1"
                  >
                    {isExpanded ? "Less" : "Why this works"}
                    {isExpanded ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="mt-2 space-y-2 text-xs text-gray-600 leading-relaxed">
                      <p>{r.whyItWorks}</p>
                      <p className="text-gray-500">
                        <strong className="text-navy/70">
                          {r.expandable
                            ? "Expandable:"
                            : "Keep it tight:"}
                        </strong>{" "}
                        {r.expandNote}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}

          <p className="text-xs text-gray-400 italic">
            These are starting points — edit and make them your own. The best
            metaphor is the one that feels natural when you say it out loud.
          </p>
        </div>
      )}
    </div>
  );
}
