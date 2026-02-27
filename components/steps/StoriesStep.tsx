import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppState } from "@/lib/types";
import { aiGenerateStoryAdvice } from "@/lib/aiClient";
import { ArrowLeft, ArrowRight, BookOpen, MessageSquare } from "lucide-react";

interface Props {
  state: AppState;
  updateState: (p: Partial<AppState>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StoriesStep({ state, updateState, onNext, onBack }: Props) {
  const [activeTab, setActiveTab] = useState("0");

  const handleStoryChange = (index: number, story: string) => {
    const msgs = [...state.messages];
    msgs[index] = { ...msgs[index], story, storyAdvice: "" };
    updateState({ messages: msgs });
  };

  const handleGetAdvice = async (index: number) => {
    try {
      const advice = await aiGenerateStoryAdvice(state.messages[index].story, index);
      const msgs = [...state.messages];
      msgs[index] = { ...msgs[index], storyAdvice: advice };
      updateState({ messages: msgs });
    } catch { /* silent fail */ }
  };

  const allHaveStories = state.messages.slice(0, 3).every((m) => m.story.trim().length >= 10);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold text-[#1F4E79] mb-2">Stories for each message</h2>
        <p className="text-gray-600 leading-relaxed">
          Now it is your turn to dig deep. For each key message, think about a personal story,
          a patient journey, something that happened in your research, or a real-world example
          that brings this message to life.
        </p>
      </div>

      <div className="p-3 bg-amber-50 border border-amber-200 rounded text-sm text-amber-800">
        <BookOpen className="w-4 h-4 inline mr-1 relative -top-0.5" />
        <strong>Story prompts:</strong> Why did you get into this field? What moment made you care?
        Who is a real person affected by this problem? What does a typical day look like?
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 bg-gray-100">
          {[0, 1, 2].map((i) => (
            <TabsTrigger key={i} value={String(i)}
              className="text-xs data-[state=active]:bg-[#2E75B6] data-[state=active]:text-white">
              Msg {i + 1} {state.messages[i].story.trim().length >= 10 ? " \u2713" : ""}
            </TabsTrigger>
          ))}
        </TabsList>
        {[0, 1, 2].map((i) => (
          <TabsContent key={i} value={String(i)} className="space-y-3 mt-3">
            <div className="p-3 bg-[#EAF2FA]/50 rounded text-sm text-[#1F4E79]">
              <strong>Message {i + 1}:</strong> {state.selectedMessages[i]}
            </div>
            <Textarea value={state.messages[i].story} onChange={(e) => handleStoryChange(i, e.target.value)}
              placeholder="Tell me about a specific moment, person, or experience that illustrates this message..."
              className="min-h-[120px] text-sm border-gray-300" />
            <Button onClick={() => handleGetAdvice(i)} disabled={state.messages[i].story.trim().length < 10}
              variant="outline" className="gap-2 border-[#2E75B6] text-[#2E75B6] hover:bg-[#EAF2FA]" size="sm">
              <MessageSquare className="w-3.5 h-3.5" /> Show me how to use this story
            </Button>
            {state.messages[i].storyAdvice && (
              <Card className="border-[#2E75B6]/20 bg-[#EAF2FA]/30">
                <CardContent className="pt-4">
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{state.messages[i].storyAdvice}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <div className="flex justify-between pt-2">
        <Button variant="ghost" onClick={onBack} className="gap-2 text-gray-500"><ArrowLeft className="w-4 h-4" /> Back</Button>
        <Button onClick={onNext} disabled={!allHaveStories} className="bg-[#1F4E79] hover:bg-[#163a5c] text-white gap-2">
          Next: Statistics <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
