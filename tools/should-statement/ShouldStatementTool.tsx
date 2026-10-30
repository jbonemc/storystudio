"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Scale, Sparkles, Copy, Check, Mic } from "lucide-react";
import Link from "next/link";
import { callAI, toAIError, type AIRequestError } from "@/lib/aiClient";
import { AIErrorNotice } from "@/components/portal/AIErrorNotice";
import { SaveButton } from "@/components/portal/SaveButton";

interface ShouldStatement {
  statement: string;
  note: string;
}

interface ShouldResult {
  draftFeedback?: { works: string; change: string; improved: string };
  statements: ShouldStatement[];
}

const MIN_CHARS = 20;

// Common opening words that read naturally in lower case after "I believe that".
// Anything else (names, places, acronyms) keeps its capital letter.
const LOWERCASE_STARTERS = new Set([
  "no", "nobody", "we", "every", "everyone", "all", "our", "people", "the",
  "a", "an", "children", "patients", "it", "there", "nothing", "anyone",
  "families", "parents", "kids", "women", "men", "everybody", "communities",
  "young", "older", "doctors", "researchers", "society", "you", "when", "if",
]);

/** Fits a statement into the sentence "I believe that ...". */
function forFormula(statement: string) {
  const s = statement.trim().replace(/^["'“‘]+|["'”’]+$/g, "").replace(/[.!]+$/, "");
  const first = s.split(/\s+/)[0] ?? "";
  if (LOWERCASE_STARTERS.has(first.toLowerCase())) {
    return s.charAt(0).toLowerCase() + s.slice(1);
  }
  return s;
}

export function ShouldStatementTool() {
  const [description, setDescription] = useState("");
  const [draft, setDraft] = useState("");
  const [result, setResult] = useState<ShouldResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AIRequestError | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [organisation, setOrganisation] = useState("");
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setSelected(null);
    try {
      const res = await callAI<ShouldResult>("shouldStatementCoach", {
        description,
        draft: draft.trim() || undefined,
      });
      setResult(res);
    } catch (err) {
      setError(toAIError(err));
    } finally {
      setLoading(false);
    }
  };

  const statements = result?.statements ?? [];
  const chosen = selected !== null ? statements[selected] : null;
  const introduction = chosen
    ? `My name is ${name.trim() || "[your name]"} and I believe that ${forFormula(chosen.statement)}. I work for ${organisation.trim() || "[your organisation]"}.`
    : "";

  const handleCopy = () => {
    navigator.clipboard.writeText(introduction);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fb = result?.draftFeedback;

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
            <Scale className="w-4 h-4 text-navy" />
          </div>
          <h1 className="text-2xl font-bold text-navy">Should Statement Builder</h1>
        </div>
        <div className="space-y-2 text-sm text-gray-500 leading-relaxed">
          <p>
            A Should Statement is one sentence that captures what your work is
            ultimately fighting for. It names the problem, it reveals your
            values and it creates an emotional response, all at once.
          </p>
          <p>
            Use it in your introduction: &ldquo;My name is [X] and I believe
            that [Should Statement]. I work for [Organisation].&rdquo;
          </p>
        </div>
      </div>

      <Card className="border-gray-200">
        <CardContent className="pt-5 space-y-4">
          <div>
            <label htmlFor="should-description" className="text-sm font-medium text-navy block mb-1.5">
              What is your work about?
            </label>
            <Textarea
              id="should-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. I study why some families wait two years for an autism diagnosis, and how GPs could spot the signs sooner..."
              className="min-h-[110px] text-sm border-gray-300 focus:border-ep2 focus:ring-ep2"
            />
          </div>
          <div>
            <label htmlFor="should-draft" className="text-sm font-medium text-navy block mb-1.5">
              Your own draft <span className="text-xs text-gray-400 font-normal">(optional)</span>
            </label>
            <Input
              id="should-draft"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="e.g. No family should have to wait years for answers."
              className="text-sm border-gray-300 focus-visible:ring-ep2"
            />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400">
              {description.trim().length < MIN_CHARS ? `At least ${MIN_CHARS} characters about your work` : ""}
            </span>
            <Button
              onClick={handleGenerate}
              disabled={description.trim().length < MIN_CHARS || loading}
              className="bg-navy hover:bg-navy-light text-white gap-2"
            >
              <Sparkles className="w-4 h-4" />
              {loading ? "Thinking..." : "Build Should Statements"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && <AIErrorNotice error={error} onRetry={handleGenerate} />}

      {fb && (
        <Card className="border-gray-200">
          <CardContent className="pt-5 space-y-3 text-sm leading-relaxed">
            <h2 className="text-sm font-semibold text-navy">Feedback on your draft</h2>
            <p className="text-gray-600"><strong className="text-navy/80">What works:</strong> {fb.works}</p>
            <p className="text-gray-600"><strong className="text-navy/80">What to change:</strong> {fb.change}</p>
            <div className="p-3 bg-ep2-light/40 rounded-lg border border-ep2/20">
              <p className="text-xs font-semibold text-navy/60 mb-1">Improved version</p>
              <p className="text-base text-navy font-medium">{fb.improved}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {statements.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-navy">Pick the one that feels most like you</h2>
          {statements.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSelected(selected === i ? null : i)}
              aria-pressed={selected === i}
              className={`block w-full text-left rounded-lg border p-4 transition-all ${
                selected === i
                  ? "border-ep2 shadow-md bg-white"
                  : "border-gray-200 bg-gray-50 hover:border-ep2/50"
              }`}
            >
              <p className="text-base text-navy font-medium leading-relaxed">{s.statement}</p>
              <p className="text-xs text-gray-500 mt-1.5">{s.note}</p>
            </button>
          ))}
        </div>
      )}

      {chosen && (
        <Card className="border-ep2/40">
          <CardContent className="pt-5 space-y-4">
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4 text-navy/60" />
              <h2 className="text-sm font-semibold text-navy">Try it out loud</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="should-name" className="text-xs font-medium text-navy/70 block mb-1">Your name</label>
                <Input id="should-name" value={name} onChange={(e) => setName(e.target.value)} className="text-sm border-gray-300" />
              </div>
              <div>
                <label htmlFor="should-org" className="text-xs font-medium text-navy/70 block mb-1">Your organisation</label>
                <Input id="should-org" value={organisation} onChange={(e) => setOrganisation(e.target.value)} className="text-sm border-gray-300" />
              </div>
            </div>
            <div className="p-4 bg-ep2-light/40 rounded-lg border border-ep2/20">
              <p className="text-base text-navy leading-relaxed">{introduction}</p>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-navy/70 hover:text-navy border border-gray-200 hover:border-navy/40 rounded-md px-2.5 py-1.5 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied" : "Copy introduction"}
              </button>
              <SaveButton
                key={selected}
                tool="should-statement"
                title={chosen.statement.slice(0, 60)}
                data={{ input: { description, draft }, result, chosen }}
              />
            </div>
            <p className="text-xs text-gray-400">
              Say it out loud three times. If it feels awkward in your mouth, change the words until it sounds like you.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
