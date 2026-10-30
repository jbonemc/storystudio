"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { MessagesSquare, ArrowLeft, Play } from "lucide-react";
import Link from "next/link";
import { PracticeSession } from "@/components/portal/PracticeSession";

const TECHNIQUES = [
  { name: "Clarify", detail: "Ask \"In what way?\" before you answer a vague or loaded question." },
  { name: "Pause", detail: "Take a breath. A second of silence looks like thought, not panic." },
  { name: "Bridge", detail: "Move from the question to familiar ground you can speak about well." },
  {
    name: "Admit what you don't know",
    detail: "\"I don't know, but I'll find out and get back to you by Tuesday.\"",
  },
  {
    name: "Three-part answer",
    detail: "Past, Present, Future, or Micro, Macro, Global.",
  },
];

const QUESTION_COUNTS = [3, 5, 8];

export function QADrill() {
  const [topic, setTopic] = useState("");
  const [messages, setMessages] = useState(["", "", ""]);
  const [count, setCount] = useState(5);
  const [running, setRunning] = useState(false);

  const setMessage = (i: number, value: string) =>
    setMessages((prev) => prev.map((m, j) => (j === i ? value : m)));

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
            <MessagesSquare className="w-4 h-4 text-navy" />
          </div>
          <h1 className="text-2xl font-bold text-navy">Q&amp;A Drill</h1>
        </div>
        <p className="text-sm text-gray-500 leading-relaxed">
          The danger is almost never the question you prepared for, it&apos;s being
          surprised into an opinion. Practise the questions an audience really asks,
          one at a time, and get coaching on each answer.
        </p>
      </div>

      {!running && (
        <>
          <Card className="border-navy/10 bg-navy/5">
            <CardContent className="pt-4 pb-4">
              <h2 className="text-sm font-semibold text-navy mb-2">Techniques to try</h2>
              <ul className="space-y-2">
                {TECHNIQUES.map((t) => (
                  <li key={t.name} className="text-sm text-navy flex gap-2">
                    <span className="text-ep3 shrink-0">&#8226;</span>
                    <span>
                      <strong>{t.name}:</strong> {t.detail}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardContent className="pt-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">
                  What is your talk about?
                </label>
                <Textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. A 15-minute talk to hospital managers on why we should screen older patients for hearing loss..."
                  className="min-h-[100px] text-sm border-gray-300 focus:border-ep3 focus:ring-ep3"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">
                  Your key messages (optional)
                </label>
                <div className="space-y-2">
                  {messages.map((m, i) => (
                    <Input
                      key={i}
                      value={m}
                      onChange={(e) => setMessage(i, e.target.value)}
                      placeholder={`Key message ${i + 1}`}
                      aria-label={`Key message ${i + 1}`}
                      className="text-sm border-gray-300 focus:border-ep3 focus:ring-ep3"
                    />
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">How many questions?</p>
                <div className="flex gap-2" role="group" aria-label="Number of questions">
                  {QUESTION_COUNTS.map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setCount(n)}
                      aria-pressed={count === n}
                      className={`w-12 h-9 rounded-md border text-sm font-medium transition-colors ${
                        count === n
                          ? "border-navy bg-navy text-white"
                          : "border-gray-300 text-navy hover:border-navy/40"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => setRunning(true)}
                  disabled={topic.trim().length < 20}
                  className="bg-navy hover:bg-navy-light text-white gap-2"
                >
                  <Play className="w-4 h-4" /> Start the drill
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {running && (
        <PracticeSession
          mode="qa"
          topic={topic.trim()}
          keyMessages={messages}
          maxQuestions={count}
          onExit={() => setRunning(false)}
        />
      )}
    </div>
  );
}
