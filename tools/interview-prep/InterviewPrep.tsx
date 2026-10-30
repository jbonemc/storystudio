"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Mic, ArrowLeft, Sparkles, Shield, MessageCircle } from "lucide-react";
import Link from "next/link";
import { callAI, listSaved, toAIError, type AIRequestError } from "@/lib/aiClient";
import { SaveButton } from "@/components/portal/SaveButton";
import { PracticeSession } from "@/components/portal/PracticeSession";
import { AIErrorNotice } from "@/components/portal/AIErrorNotice";

interface PrepResult {
  likelyQuestions: { question: string; suggestedAnswer: string }[];
  blockingBridging: { scenario: string; block: string; bridge: string }[];
  deliveryTips: string[];
}

export function InterviewPrep() {
  const [topic, setTopic] = useState("");
  const [format, setFormat] = useState("");
  const [result, setResult] = useState<PrepResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AIRequestError | null>(null);
  const [messages, setMessages] = useState(["", "", ""]);
  const [importNote, setImportNote] = useState("");
  const [practising, setPractising] = useState(false);
  const keyMessages = messages.map((m) => m.trim()).filter(Boolean);

  // Pull the three messages from the participant's latest Content Tool plan.
  const importFromContentTool = async () => {
    setImportNote("Looking for your plan...");
    try {
      const plans = await listSaved("content-tool");
      const data = plans[0]?.data as { selectedMessages?: string[]; documents?: string } | undefined;
      const found = (data?.selectedMessages || []).filter((m) => m && m.trim());
      if (!found.length) {
        setImportNote("No key messages found in your Content Tool plans yet.");
        return;
      }
      setMessages([0, 1, 2].map((i) => found[i] || ""));
      if (!topic.trim() && data?.documents) setTopic(data.documents.slice(0, 2000));
      setImportNote(`Added ${found.length} message${found.length > 1 ? "s" : ""} from "${plans[0].title}".`);
    } catch (err) {
      setImportNote(toAIError(err).message);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      setResult(await callAI<PrepResult>("prepInterview", { topic, format, keyMessages }));
    } catch (err) {
      setError(toAIError(err));
    } finally {
      setLoading(false);
    }
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
            <Mic className="w-4 h-4 text-navy" />
          </div>
          <h1 className="text-2xl font-bold text-navy">Interview Prep Coach</h1>
        </div>
        <p className="text-sm text-gray-500 leading-relaxed">
          Tell us what you will be interviewed about and the format. Get likely
          questions, suggested answers, blocking & bridging strategies, and
          delivery tips.
        </p>
      </div>

      <Card className="border-gray-200">
        <CardContent className="pt-5 space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">
              What will you be talking about?
            </label>
            <Textarea
              value={topic}
              onChange={(e) => { setTopic(e.target.value); setResult(null); }}
              placeholder="e.g. Our research on biodegradable packaging for the food industry..."
              className="min-h-[100px] text-sm border-gray-300 focus:border-ep3 focus:ring-ep3"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">
              Interview format (optional)
            </label>
            <Input
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              placeholder="e.g. 5-minute live radio interview on Morning Ireland"
              className="text-sm border-gray-300 focus:border-ep3 focus:ring-ep3"
            />
          </div>
          <div>
            <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
              <label className="text-xs font-medium text-gray-600">
                Your key messages (optional, but the coaching is much better with them)
              </label>
              <button type="button" onClick={importFromContentTool} className="text-xs font-medium text-navy underline underline-offset-2">
                Use my Content Tool messages
              </button>
            </div>
            <div className="space-y-2">
              {messages.map((m, i) => (
                <Input
                  key={i}
                  value={m}
                  onChange={(e) => setMessages(messages.map((x, j) => (j === i ? e.target.value : x)))}
                  placeholder={["Message 1: the problem", "Message 2: what is different about your approach", "Message 3: how the world looks if it works"][i]}
                  className="text-sm border-gray-300 focus:border-ep3 focus:ring-ep3"
                />
              ))}
            </div>
            {importNote && <p className="text-xs text-gray-500 mt-1">{importNote}</p>}
          </div>
          <div className="flex justify-end gap-2 flex-wrap">
            <Button
              variant="outline"
              onClick={() => setPractising(true)}
              disabled={topic.trim().length < 15 || practising}
              className="gap-2 border-navy/30 text-navy"
            >
              <Mic className="w-4 h-4" /> Practise live
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={topic.trim().length < 15 || loading}
              className="bg-navy hover:bg-navy-light text-white gap-2"
            >
              <Sparkles className="w-4 h-4" />
              {loading ? "Preparing..." : "Prepare Me"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && <AIErrorNotice error={error} onRetry={handleGenerate} />}

      {practising && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-navy">Live practice</h2>
          <p className="text-xs text-gray-500">
            Your coach plays the presenter. Answer out loud first if you can, then type what you said.
          </p>
          <PracticeSession
            mode="interview"
            topic={topic}
            format={format}
            keyMessages={keyMessages}
            onExit={() => setPractising(false)}
          />
        </section>
      )}

      {result && (
        <div className="space-y-6">
          {/* Likely Questions */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <MessageCircle className="w-4 h-4 text-navy/40" />
              <h2 className="text-sm font-semibold text-navy">Likely Questions</h2>
            </div>
            <div className="space-y-3">
              {result.likelyQuestions.map((q, i) => (
                <Card key={i} className="border-gray-100">
                  <CardContent className="pt-4 pb-4">
                    <p className="text-sm font-medium text-navy mb-2">
                      Q: {q.question}
                    </p>
                    <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded p-3">
                      {q.suggestedAnswer}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Blocking & Bridging */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-navy/40" />
              <h2 className="text-sm font-semibold text-navy">
                Blocking & Bridging
              </h2>
            </div>
            <div className="space-y-3">
              {result.blockingBridging.map((bb, i) => (
                <Card key={i} className="border-ep3/20 bg-ep3-light/20">
                  <CardContent className="pt-4 pb-4 space-y-2">
                    <p className="text-xs text-gray-500">
                      <strong>If asked:</strong> {bb.scenario}
                    </p>
                    <p className="text-sm text-navy">
                      <strong className="text-red-500/70">Block:</strong>{" "}
                      {bb.block}
                    </p>
                    <p className="text-sm text-navy">
                      <strong className="text-green-600/70">Bridge:</strong>{" "}
                      {bb.bridge}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Delivery Tips */}
          <section>
            <h2 className="text-sm font-semibold text-navy mb-3">
              Delivery Tips
            </h2>
            <Card className="border-navy/10 bg-navy/5">
              <CardContent className="pt-4 pb-4">
                <ul className="space-y-2">
                  {result.deliveryTips.map((tip, i) => (
                    <li key={i} className="text-sm text-navy flex gap-2">
                      <span className="text-ep3 shrink-0">&#8226;</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </section>

          <SaveButton
            tool="interview-prep"
            title={`Interview prep: ${topic.trim().slice(0, 60)}`}
            data={{ input: { topic, format, keyMessages }, result }}
          />
        </div>
      )}
    </div>
  );
}
