"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";

interface StoryResult {
  pip: { problem: string; inspiration: string; payoff: string; coaching: string };
  scr: { setup: string; conflict: string; resolution: string; coaching: string };
  pep: { past: string; event: string; present: string; coaching: string };
}

export function StoryCoach() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<StoryResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "structureStory", story: input }),
      });
      const data = await res.json();
      setResult(data.result);
    } finally {
      setLoading(false);
    }
  };

  const renderStructure = (
    parts: { label: string; colour: string; text: string }[],
    coaching: string
  ) => (
    <div className="space-y-3">
      {parts.map((p, i) => (
        <div key={i} className="flex gap-3">
          <div
            className="w-1 rounded-full shrink-0"
            style={{ backgroundColor: p.colour }}
          />
          <div>
            <p className="text-xs font-semibold text-navy/60 uppercase tracking-wider mb-0.5">
              {p.label}
            </p>
            <p className="text-sm text-navy leading-relaxed">{p.text}</p>
          </div>
        </div>
      ))}
      <Card className="border-ep2/20 bg-ep2-light/30 mt-3">
        <CardContent className="pt-3 pb-3">
          <p className="text-xs font-semibold text-navy/50 uppercase tracking-wider mb-1">
            Coaching
          </p>
          <p className="text-sm text-gray-700 leading-relaxed">{coaching}</p>
        </CardContent>
      </Card>
    </div>
  );

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
            <BookOpen className="w-4 h-4 text-navy" />
          </div>
          <h1 className="text-2xl font-bold text-navy">Story Structure Coach</h1>
        </div>
        <p className="text-sm text-gray-500 leading-relaxed">
          Tell a rough story or anecdote about your work. The AI will restructure
          it into three different frameworks and coach you on how to strengthen each version.
        </p>
      </div>

      <Card className="border-gray-200">
        <CardContent className="pt-5">
          <Textarea
            value={input}
            onChange={(e) => { setInput(e.target.value); setResult(null); }}
            placeholder="Tell me about a moment, experience, or case study from your work..."
            className="min-h-[150px] text-sm border-gray-300 focus:border-ep2 focus:ring-ep2"
          />
          <div className="flex justify-end mt-3">
            <Button
              onClick={handleGenerate}
              disabled={input.trim().length < 30 || loading}
              className="bg-navy hover:bg-navy-light text-white gap-2"
            >
              <Sparkles className="w-4 h-4" />
              {loading ? "Structuring..." : "Structure My Story"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Tabs defaultValue="pip">
          <TabsList className="grid grid-cols-3 bg-gray-100">
            <TabsTrigger value="pip" className="text-xs data-[state=active]:bg-ep2 data-[state=active]:text-navy">
              PIP
            </TabsTrigger>
            <TabsTrigger value="scr" className="text-xs data-[state=active]:bg-ep2 data-[state=active]:text-navy">
              Setup-Conflict-Resolution
            </TabsTrigger>
            <TabsTrigger value="pep" className="text-xs data-[state=active]:bg-ep2 data-[state=active]:text-navy">
              Past-Event-Present
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pip" className="mt-4">
            {renderStructure(
              [
                { label: "Problem", colour: "#ef4444", text: result.pip.problem },
                { label: "Inspiration", colour: "#f59e0b", text: result.pip.inspiration },
                { label: "Payoff", colour: "#22c55e", text: result.pip.payoff },
              ],
              result.pip.coaching
            )}
          </TabsContent>

          <TabsContent value="scr" className="mt-4">
            {renderStructure(
              [
                { label: "Setup", colour: "#6366f1", text: result.scr.setup },
                { label: "Conflict", colour: "#ef4444", text: result.scr.conflict },
                { label: "Resolution", colour: "#22c55e", text: result.scr.resolution },
              ],
              result.scr.coaching
            )}
          </TabsContent>

          <TabsContent value="pep" className="mt-4">
            {renderStructure(
              [
                { label: "Past", colour: "#8b5cf6", text: result.pep.past },
                { label: "Event", colour: "#ec4899", text: result.pep.event },
                { label: "Present", colour: "#0ea5e9", text: result.pep.present },
              ],
              result.pep.coaching
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
