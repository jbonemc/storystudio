"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Compass, ArrowLeft, Sparkles, Loader2, Target, ShieldAlert, Handshake,
  Quote, Copy, Check, Ear, Eye, ThumbsUp, ThumbsDown,
} from "lucide-react";
import Link from "next/link";
import { callAI, toAIError, type AIRequestError } from "@/lib/aiClient";
import { AIErrorNotice } from "@/components/portal/AIErrorNotice";
import { SaveButton } from "@/components/portal/SaveButton";

interface PlanResult {
  ask: string;
  barriers: { type: string; risk: string; move: string }[];
  persuasion: { principle: string; move: string }[];
  opening: string;
  listening: { questions: string[]; note: string };
  readingTheRoom: { goingWell: string; notGoingWell: string };
}

const FIELDS = [
  {
    key: "situation",
    label: "What is the meeting, talk or pitch?",
    placeholder: "e.g. A 20-minute slot at the hospital board to ask for funding for a pilot clinic...",
  },
  {
    key: "audience",
    label: "Who will be there?",
    placeholder: "e.g. Six board members, mostly finance and operations, one clinician who chairs...",
  },
  {
    key: "goal",
    label: "What do you want to happen?",
    placeholder: "e.g. Agreement to fund a six-month pilot starting in January...",
  },
] as const;

type FieldKey = (typeof FIELDS)[number]["key"];

function SectionTitle({ icon: Icon, children }: { icon: typeof Target; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="w-4 h-4 text-navy/40" />
      <h2 className="text-sm font-semibold text-navy">{children}</h2>
    </div>
  );
}

export function AudiencePlanner() {
  const [input, setInput] = useState<Record<FieldKey, string>>({ situation: "", audience: "", goal: "" });
  const [result, setResult] = useState<PlanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AIRequestError | null>(null);
  const [copied, setCopied] = useState(false);

  const ready = FIELDS.every((f) => input[f.key].trim().length >= 10);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      setResult(
        await callAI<PlanResult>("planAudience", {
          situation: input.situation.trim(),
          audience: input.audience.trim(),
          goal: input.goal.trim(),
        })
      );
    } catch (err) {
      setError(toAIError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const update = (key: FieldKey, value: string) => {
    setInput((prev) => ({ ...prev, [key]: value }));
    setResult(null);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <Link
        href="/episode/3-audience"
        className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-navy transition-colors"
      >
        <ArrowLeft className="w-3 h-3" /> Episode 3: Audience
      </Link>

      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-ep3/30 flex items-center justify-center">
            <Compass className="w-4 h-4 text-navy" />
          </div>
          <h1 className="text-2xl font-bold text-navy">Audience &amp; Persuasion Planner</h1>
        </div>
        <p className="text-sm text-gray-500 leading-relaxed">
          Before you blame the message, check the barriers. Usually one or two are
          doing all the work, and preparing for those beats preparing for all six.
          Describe the room and what you want from it, and get a plan for the ask,
          the barriers, how to persuade and how to read the room.
        </p>
      </div>

      <Card className="border-gray-200">
        <CardContent className="pt-5 space-y-3">
          {FIELDS.map((f) => (
            <div key={f.key}>
              <label className="text-xs font-medium text-gray-600 block mb-1">{f.label}</label>
              <Textarea
                value={input[f.key]}
                onChange={(e) => update(f.key, e.target.value)}
                placeholder={f.placeholder}
                disabled={loading}
                className="min-h-[72px] text-sm border-gray-300 focus:border-ep3 focus:ring-ep3"
              />
            </div>
          ))}
          <div className="flex justify-end">
            <Button
              onClick={handleGenerate}
              disabled={!ready || loading}
              className="bg-navy hover:bg-navy-light text-white gap-2"
            >
              <Sparkles className="w-4 h-4" />
              {loading ? "Planning..." : "Plan My Approach"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading && (
        <div className="flex items-start gap-2 text-sm text-gray-500" role="status">
          <Loader2 className="w-4 h-4 animate-spin shrink-0 mt-0.5 text-navy/50" />
          <span>Working through your audience and the barriers. This can take up to half a minute.</span>
        </div>
      )}

      {error && <AIErrorNotice error={error} onRetry={handleGenerate} />}

      {result && (
        <div className="space-y-6">
          <section className="rounded-lg border border-ep3/40 bg-ep3-light/50 p-5">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-navy/60" />
              <h2 className="text-sm font-semibold text-navy">The ask</h2>
            </div>
            <p className="text-lg font-semibold text-navy leading-snug">{result.ask}</p>
          </section>

          {result.barriers?.length > 0 && (
            <section>
              <SectionTitle icon={ShieldAlert}>Barriers</SectionTitle>
              <div className="space-y-3">
                {result.barriers.map((b, i) => (
                  <Card key={i} className="border-gray-200">
                    <CardContent className="pt-4 pb-4 space-y-2">
                      <p className="text-sm font-semibold text-navy capitalize">{b.type}</p>
                      <p className="text-sm text-gray-600"><strong>Risk:</strong> {b.risk}</p>
                      <p className="text-sm text-navy"><strong>Move:</strong> {b.move}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {result.persuasion?.length > 0 && (
            <section>
              <SectionTitle icon={Handshake}>Persuasion</SectionTitle>
              <div className="space-y-3">
                {result.persuasion.map((p, i) => (
                  <Card key={i} className="border-ep3/20 bg-ep3-light/20">
                    <CardContent className="pt-4 pb-4 space-y-1">
                      <p className="text-sm font-semibold text-navy capitalize">{p.principle}</p>
                      <p className="text-sm text-navy leading-relaxed">{p.move}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {result.opening && (
            <section>
              <SectionTitle icon={Quote}>Opening line</SectionTitle>
              <Card className="border-gray-200">
                <CardContent className="pt-4 pb-4 flex items-start justify-between gap-3">
                  <p className="text-sm text-navy leading-relaxed">{result.opening}</p>
                  <button
                    type="button"
                    onClick={() => handleCopy(result.opening)}
                    className="shrink-0 inline-flex items-center gap-1 text-xs text-navy/70 hover:text-navy border border-gray-200 rounded-md px-2 py-1"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </CardContent>
              </Card>
            </section>
          )}

          {result.listening && (
            <section>
              <SectionTitle icon={Ear}>Listening plan (70/30)</SectionTitle>
              <Card className="border-navy/10 bg-navy/5">
                <CardContent className="pt-4 pb-4 space-y-3">
                  <p className="text-xs text-gray-500">Let them talk for 70% of the time. Questions to ask:</p>
                  <ul className="space-y-2">
                    {(result.listening.questions || []).map((q, i) => (
                      <li key={i} className="text-sm text-navy flex gap-2">
                        <span className="text-ep3 shrink-0">&#8226;</span>
                        {q}
                      </li>
                    ))}
                  </ul>
                  {result.listening.note && (
                    <p className="text-sm text-gray-600 leading-relaxed">{result.listening.note}</p>
                  )}
                </CardContent>
              </Card>
            </section>
          )}

          {result.readingTheRoom && (
            <section>
              <SectionTitle icon={Eye}>Reading the room</SectionTitle>
              <div className="grid sm:grid-cols-2 gap-3">
                <Card className="border-green-200 bg-green-50/50">
                  <CardContent className="pt-4 pb-4">
                    <p className="text-xs font-semibold text-green-800 mb-1 flex items-center gap-1.5">
                      <ThumbsUp className="w-3.5 h-3.5" /> Going well
                    </p>
                    <p className="text-sm text-navy leading-relaxed">{result.readingTheRoom.goingWell}</p>
                  </CardContent>
                </Card>
                <Card className="border-amber-200 bg-amber-50/50">
                  <CardContent className="pt-4 pb-4">
                    <p className="text-xs font-semibold text-amber-800 mb-1 flex items-center gap-1.5">
                      <ThumbsDown className="w-3.5 h-3.5" /> Not going well
                    </p>
                    <p className="text-sm text-navy leading-relaxed">{result.readingTheRoom.notGoingWell}</p>
                  </CardContent>
                </Card>
              </div>
            </section>
          )}

          <SaveButton
            tool="audience-planner"
            title={`Audience plan: ${input.situation.trim().slice(0, 50)}`}
            data={{ input, result }}
          />
        </div>
      )}
    </div>
  );
}
