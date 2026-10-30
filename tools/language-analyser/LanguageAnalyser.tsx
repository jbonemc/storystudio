"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";
import { callAI, toAIError, type AIRequestError } from "@/lib/aiClient";
import { AIErrorNotice } from "@/components/portal/AIErrorNotice";
import { SaveButton } from "@/components/portal/SaveButton";

interface AnalysisResult {
  visual: { score: number; examples: string[]; suggestions: string[] };
  emotional: { score: number; examples: string[]; suggestions: string[] };
  logical: { score: number; examples: string[]; suggestions: string[] };
  overall: string;
  spans?: { text: string; type: LangType }[];
}

type LangType = "visual" | "emotional" | "logical";

interface RewriteResult {
  rewrite: string;
  changes: string[];
}

/** Splits the text into plain and highlighted pieces, using the exact phrases the AI quoted. */
function highlight(text: string, spans: { text: string; type: LangType }[] = []) {
  const found: { start: number; end: number; type: LangType }[] = [];
  for (const sp of spans) {
    if (!sp?.text || !LANG_CONFIG[sp.type]) continue;
    let from = 0;
    while (from < text.length) {
      const start = text.indexOf(sp.text, from);
      if (start === -1) break;
      const end = start + sp.text.length;
      if (!found.some((f) => start < f.end && end > f.start)) {
        found.push({ start, end, type: sp.type });
        break;
      }
      from = start + 1;
    }
  }
  found.sort((a, b) => a.start - b.start);
  const parts: { text: string; type?: LangType }[] = [];
  let pos = 0;
  for (const f of found) {
    if (f.start > pos) parts.push({ text: text.slice(pos, f.start) });
    parts.push({ text: text.slice(f.start, f.end), type: f.type });
    pos = f.end;
  }
  if (pos < text.length) parts.push({ text: text.slice(pos) });
  return { parts, count: found.length };
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
  const [error, setError] = useState<AIRequestError | null>(null);
  const [analysed, setAnalysed] = useState("");
  const [rewrite, setRewrite] = useState<RewriteResult | null>(null);
  const [rewriting, setRewriting] = useState(false);
  const [rewriteError, setRewriteError] = useState<AIRequestError | null>(null);

  const handleRewrite = async () => {
    setRewriting(true);
    setRewriteError(null);
    try {
      setRewrite(await callAI<RewriteResult>("rewriteLanguage", { text: analysed }));
    } catch (err) {
      setRewriteError(toAIError(err));
    } finally {
      setRewriting(false);
    }
  };

  const handleAnalyse = async () => {
    setLoading(true);
    setError(null);
    try {
      setRewrite(null);
      setResult(await callAI<AnalysisResult>("analyseLanguage", { text: input }));
      setAnalysed(input);
    } catch (err) {
      setError(toAIError(err));
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
          Paste any paragraph (a pitch, an abstract, an email) and see how
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

      {error && <AIErrorNotice error={error} onRetry={handleAnalyse} />}

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

          {/* The text, coloured by language type */}
          {(() => {
            const { parts, count } = highlight(analysed, result.spans);
            if (!count) return null;
            return (
              <Card className="border-gray-200">
                <CardContent className="pt-4 pb-4 space-y-2">
                  <div className="flex items-center gap-3 flex-wrap text-xs text-gray-500">
                    <span>Your text:</span>
                    {(["visual", "emotional", "logical"] as const).map((k) => (
                      <span key={k} className="inline-flex items-center gap-1">
                        <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: `${LANG_CONFIG[k].colour}33`, border: `1px solid ${LANG_CONFIG[k].colour}` }} />
                        {LANG_CONFIG[k].label}
                      </span>
                    ))}
                  </div>
                  <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                    {parts.map((p, i) =>
                      p.type ? (
                        <mark
                          key={i}
                          title={`${LANG_CONFIG[p.type].label} language`}
                          className="rounded px-0.5 text-gray-900"
                          style={{ backgroundColor: `${LANG_CONFIG[p.type].colour}33`, borderBottom: `2px solid ${LANG_CONFIG[p.type].colour}` }}
                        >
                          {p.text}
                        </mark>
                      ) : (
                        <span key={i}>{p.text}</span>
                      )
                    )}
                  </p>
                </CardContent>
              </Card>
            );
          })()}

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

          {/* Rewrite */}
          <Card className="border-navy/15">
            <CardContent className="pt-4 pb-4 space-y-3">
              <div>
                <h3 className="text-sm font-semibold text-navy">See it rewritten</h3>
                <p className="text-xs text-gray-500">
                  A version with all three types of language, keeping your facts. Anything in [brackets] is for you to fill in.
                </p>
              </div>
              <Button onClick={handleRewrite} disabled={rewriting} variant="outline" size="sm" className="gap-2">
                <Sparkles className="w-3.5 h-3.5" /> {rewriting ? "Rewriting..." : rewrite ? "Try another version" : "Rewrite it balanced"}
              </Button>
              {rewriteError && <AIErrorNotice error={rewriteError} onRetry={handleRewrite} />}
              {rewrite && (
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1">Before</p>
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap bg-gray-50 rounded p-3">{analysed}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-navy mb-1">After</p>
                    <p className="text-sm text-navy leading-relaxed whitespace-pre-wrap bg-ep1-light/50 rounded p-3">{rewrite.rewrite}</p>
                  </div>
                  {rewrite.changes?.length > 0 && (
                    <ul className="sm:col-span-2 text-xs text-gray-600 space-y-1 list-disc pl-5">
                      {rewrite.changes.map((c, i) => <li key={i}>{c}</li>)}
                    </ul>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <SaveButton
            tool="language"
            title={`Language check: ${analysed.trim().slice(0, 60)}`}
            data={{ input: { text: analysed }, result, rewrite }}
          />
        </div>
      )}
    </div>
  );
}
