import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppState } from "@/lib/types";
import { aiGenerateStatisticAdvice } from "@/lib/aiClient";
import { ArrowLeft, ArrowRight, BarChart3, MessageSquare } from "lucide-react";
import { toAIError, type AIRequestError } from "@/lib/aiClient";
import { AIErrorNotice } from "@/components/portal/AIErrorNotice";
import { planFromState } from "@/lib/plan";

interface Props {
  state: AppState;
  updateState: (p: Partial<AppState>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StatisticsStep({ state, updateState, onNext, onBack }: Props) {
  const [activeTab, setActiveTab] = useState("0");
  const [busy, setBusy] = useState<number | null>(null);
  const [aiError, setAiError] = useState<{ index: number; error: AIRequestError; retry: () => void } | null>(null);

  const handleStatChange = (index: number, statistic: string) => {
    const msgs = [...state.messages];
    msgs[index] = { ...msgs[index], statistic, statisticAdvice: "" };
    updateState({ messages: msgs });
  };

  const handleGetAdvice = async (index: number) => {
    setAiError(null);
    setBusy(index);
    try {
      const advice = await aiGenerateStatisticAdvice(state.messages[index].statistic, index, planFromState(state));
      const msgs = [...state.messages];
      msgs[index] = { ...msgs[index], statisticAdvice: advice };
      updateState({ messages: msgs });
    } catch (err) {
      setAiError({ index, error: toAIError(err), retry: () => handleGetAdvice(index) });
    } finally {
      setBusy(null);
    }
  };

  const allHaveStats = state.messages.slice(0, 3).every((m) => m.statistic.trim().length >= 5);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold text-[#1F4E79] mb-2">Statistics for each message</h2>
        <p className="text-gray-600 leading-relaxed">
          One powerful, well-framed statistic beats ten charts. What numbers back up each of your messages?
        </p>
      </div>

      <div className="p-3 bg-amber-50 border border-amber-200 rounded text-sm text-amber-800">
        <BarChart3 className="w-4 h-4 inline mr-1 relative -top-0.5" />
        <strong>Tip:</strong> &ldquo;50% of patients&rdquo; is good. &ldquo;1 in 2, meaning if you and your
        colleague both got this diagnosis, one of you would not survive&rdquo; is unforgettable.
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 bg-gray-100">
          {[0, 1, 2].map((i) => (
            <TabsTrigger key={i} value={String(i)}
              className="text-xs data-[state=active]:bg-[#2E75B6] data-[state=active]:text-white">
              Msg {i + 1} {state.messages[i].statistic.trim().length >= 5 ? " \u2713" : ""}
            </TabsTrigger>
          ))}
        </TabsList>
        {[0, 1, 2].map((i) => (
          <TabsContent key={i} value={String(i)} className="space-y-3 mt-3">
            <div className="p-3 bg-[#EAF2FA]/50 rounded text-sm text-[#1F4E79]">
              <strong>Message {i + 1}:</strong> {state.selectedMessages[i]}
            </div>
            <Textarea value={state.messages[i].statistic} onChange={(e) => handleStatChange(i, e.target.value)}
              placeholder="What numbers, percentages, costs, or comparisons support this message?"
              className="min-h-[80px] text-sm border-gray-300" />
            <Button onClick={() => handleGetAdvice(i)} disabled={state.messages[i].statistic.trim().length < 5 || busy === i}
              variant="outline" className="gap-2 border-[#2E75B6] text-[#2E75B6] hover:bg-[#EAF2FA]" size="sm">
              <MessageSquare className="w-3.5 h-3.5" /> {busy === i ? "Thinking..." : "Help me frame this number"}
            </Button>
            {state.messages[i].statisticAdvice && (
              <Card className="border-[#2E75B6]/20 bg-[#EAF2FA]/30">
                <CardContent className="pt-4">
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{state.messages[i].statisticAdvice}</p>
                </CardContent>
              </Card>
            )}
            {aiError?.index === i && <AIErrorNotice error={aiError.error} onRetry={aiError.retry} />}
          </TabsContent>
        ))}
      </Tabs>

      <div className="flex justify-between pt-2">
        <Button variant="ghost" onClick={onBack} className="gap-2 text-gray-500"><ArrowLeft className="w-4 h-4" /> Back</Button>
        <Button onClick={onNext} disabled={!allHaveStats} className="bg-[#1F4E79] hover:bg-[#163a5c] text-white gap-2">
          Next: Soundbites <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
