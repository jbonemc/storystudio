"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Send, RotateCcw, LogOut, Loader2, Check, ArrowRight, Lightbulb } from "lucide-react";
import { callAI, toAIError, AIRequestError } from "@/lib/aiClient";
import { AIErrorNotice } from "@/components/portal/AIErrorNotice";
import { SaveButton } from "@/components/portal/SaveButton";

export interface PracticeSessionProps {
  mode: "interview" | "qa";
  topic: string;
  format?: string;
  keyMessages?: string[];
  /** How many questions before the coach wraps up. Defaults to 5. */
  maxQuestions?: number;
  onExit?: () => void;
}

interface Scores {
  clarity: number;
  brevity: number;
  message: number;
}

interface TurnFeedback {
  worked: string;
  change: string;
  betterAnswer: string;
  scores: Scores;
}

interface TurnResult {
  feedback: TurnFeedback | null;
  nextQuestion: string | null;
  done: boolean;
  summary: string | null;
}

interface Turn {
  q: string;
  a: string;
  feedback?: TurnFeedback | null;
}

const GUIDE = {
  interview: "Radio or TV: about 75 words (30 seconds or so)",
  qa: "Keep it short and offer to go deeper",
};

const countWords = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;
const clampScore = (n: unknown) => Math.min(5, Math.max(0, Math.round(Number(n) || 0)));

/** One question at a time, with coaching on each answer. Used by the Q&A Drill and interview practice. */
export function PracticeSession({
  mode,
  topic,
  format,
  keyMessages = [],
  maxQuestions = 5,
  onExit,
}: PracticeSessionProps) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [question, setQuestion] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [summary, setSummary] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AIRequestError | null>(null);
  // The exact history last sent, so "Try again" re-sends the same turn.
  const [pending, setPending] = useState<Turn[] | null>(null);
  const started = useRef(false);

  const messages = keyMessages.map((m) => m.trim()).filter(Boolean);

  const sendTurn = async (history: Turn[]) => {
    setLoading(true);
    setError(null);
    setPending(history);
    try {
      const res = await callAI<TurnResult>("practiceTurn", {
        mode,
        topic,
        format,
        keyMessages: messages,
        maxQuestions,
        history: history.map(({ q, a }) => ({ q, a })),
      });
      const finished = Boolean(res.done) || !res.nextQuestion;
      if (history.length === 0 && finished) {
        throw new AIRequestError("The coach did not send a first question. Please try again.", 200);
      }
      const updated = history.map((t, i) =>
        i === history.length - 1 ? { ...t, feedback: res.feedback ?? null } : t
      );
      setTurns(updated);
      setQuestion(finished ? null : res.nextQuestion);
      setDone(finished);
      setSummary(finished ? res.summary ?? null : null);
      setDraft("");
      setPending(null);
    } catch (err) {
      setError(toAIError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    sendTurn([]);
    // Runs once when the session opens.
  }, []);

  const handleSubmit = () => {
    if (!question || !draft.trim()) return;
    sendTurn([...turns, { q: question, a: draft.trim() }]);
  };

  const handleRestart = () => {
    setTurns([]);
    setQuestion(null);
    setDraft("");
    setSummary(null);
    setDone(false);
    sendTurn([]);
  };

  const words = countWords(draft);
  const overLength = mode === "interview" && words > 90;
  const hasFeedback = turns.some((t) => t.feedback);
  const awaitingFeedback = loading && pending && pending.length > turns.length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-gray-500">
          {done
            ? `Session complete: ${turns.length} ${turns.length === 1 ? "answer" : "answers"}`
            : `Question ${Math.min(turns.length + 1, maxQuestions)} of ${maxQuestions}`}
        </p>
        <div className="flex items-center gap-3">
          {hasFeedback && (
            <SaveButton
              key={`${turns.length}-${done}`}
              tool="practice"
              title={`Practice: ${topic.trim().slice(0, 50)}`}
              data={{
                mode,
                topic,
                format,
                keyMessages: messages,
                history: turns.map(({ q, a }) => ({ q, a })),
                feedback: turns.map((t) => t.feedback ?? null),
                summary,
              }}
            />
          )}
          {onExit && !done && (
            <button
              type="button"
              onClick={onExit}
              className="text-xs text-gray-400 hover:text-navy underline underline-offset-2"
            >
              Stop and change setup
            </button>
          )}
        </div>
      </div>

      {turns.map((t, i) => (
        <div key={i} className="space-y-2">
          <p className="text-sm font-medium text-navy">Q{i + 1}: {t.q}</p>
          <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-lg p-3 whitespace-pre-wrap">
            {t.a}
          </p>
          {t.feedback && <FeedbackCard feedback={t.feedback} />}
        </div>
      ))}

      {question && !done && (
        <Card className="border-ep3/40 bg-ep3-light/30">
          <CardContent className="pt-5 space-y-3">
            <p className="text-base font-semibold text-navy">
              Q{turns.length + 1}: {question}
            </p>
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              disabled={loading}
              placeholder="Type your answer as you would say it out loud..."
              className="min-h-[120px] text-sm bg-white border-gray-300 focus:border-ep3 focus:ring-ep3"
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className={`text-xs ${overLength ? "text-amber-700" : "text-gray-500"}`}>
                {words} {words === 1 ? "word" : "words"}. {GUIDE[mode]}
              </p>
              <Button
                onClick={handleSubmit}
                disabled={loading || !draft.trim()}
                className="bg-navy hover:bg-navy-light text-white gap-2"
              >
                <Send className="w-4 h-4" />
                {loading ? "Thinking..." : "Submit answer"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading && (
        <div className="flex items-start gap-2 text-sm text-gray-500" role="status">
          <Loader2 className="w-4 h-4 animate-spin shrink-0 mt-0.5 text-navy/50" />
          <span>
            {awaitingFeedback
              ? "Your coach is reading your answer. This can take up to half a minute."
              : "Your coach is preparing the first question. This can take up to half a minute."}
          </span>
        </div>
      )}

      {error && <AIErrorNotice error={error} onRetry={() => pending && sendTurn(pending)} />}

      {done && (
        <Card className="border-navy/10 bg-navy/5">
          <CardContent className="pt-5 space-y-4">
            <h2 className="text-sm font-semibold text-navy">How it went</h2>
            {summary && (
              <p className="text-sm text-navy leading-relaxed whitespace-pre-wrap">{summary}</p>
            )}
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={handleRestart}
                disabled={loading}
                className="bg-navy hover:bg-navy-light text-white gap-2"
              >
                <RotateCcw className="w-4 h-4" /> Practise again
              </Button>
              {onExit && (
                <Button variant="outline" onClick={onExit} className="gap-2 border-gray-300 text-navy">
                  <LogOut className="w-4 h-4" /> Exit
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function FeedbackCard({ feedback }: { feedback: TurnFeedback }) {
  const scores = feedback.scores || ({} as Scores);
  return (
    <Card className="border-gray-200">
      <CardContent className="pt-4 pb-4 space-y-3">
        {feedback.worked && (
          <p className="text-sm text-navy flex gap-2">
            <Check className="w-4 h-4 text-green-600/80 shrink-0 mt-0.5" />
            <span><strong>What worked:</strong> {feedback.worked}</span>
          </p>
        )}
        {feedback.change && (
          <p className="text-sm text-navy flex gap-2">
            <ArrowRight className="w-4 h-4 text-ep3 shrink-0 mt-0.5" />
            <span><strong>One change:</strong> {feedback.change}</span>
          </p>
        )}
        {feedback.betterAnswer && (
          <div className="rounded-lg border border-ep3/30 bg-ep3-light/40 p-3">
            <p className="text-xs font-medium text-gray-600 mb-1 flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5" /> A stronger version
            </p>
            <p className="text-sm text-navy leading-relaxed">{feedback.betterAnswer}</p>
          </div>
        )}
        <div className="grid grid-cols-3 gap-3 pt-1">
          <ScoreDots label="Clarity" value={scores.clarity} />
          <ScoreDots label="Brevity" value={scores.brevity} />
          <ScoreDots label="Message" value={scores.message} />
        </div>
      </CardContent>
    </Card>
  );
}

function ScoreDots({ label, value }: { label: string; value: unknown }) {
  const score = clampScore(value);
  return (
    <div>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <div className="flex gap-1" aria-label={`${label}: ${score} out of 5`} role="img">
        {[1, 2, 3, 4, 5].map((n) => (
          <span
            key={n}
            className={`h-2 flex-1 rounded-sm ${n <= score ? "bg-navy" : "bg-gray-200"}`}
          />
        ))}
      </div>
    </div>
  );
}
