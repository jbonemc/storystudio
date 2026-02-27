import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppState } from "@/lib/types";
import { aiGenerateSoundbiteOptions, aiGenerateSoundbiteAdvice } from "@/lib/aiClient";
import { ArrowLeft, ArrowRight, Sparkles, Quote, MessageSquare } from "lucide-react";

interface Props {
  state: AppState;
  updateState: (p: Partial<AppState>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function SoundbitesStep({ state, updateState, onNext, onBack }: Props) {
  const [activeTab, setActiveTab] = useState("0");
  const [options, setOptions] = useState<string[][]>([[], [], []]);
  const [showOpts, setShowOpts] = useState([false, false, false]);

  const handleGenerate = async (index: number) => {
    try {
      const opts = await aiGenerateSoundbiteOptions(state.selectedMessages[index], index);
      const newO = [...options]; newO[index] = opts; setOptions(newO);
      const newS = [...showOpts]; newS[index] = true; setShowOpts(newS);
    } catch { /* silent fail */ }
  };

  const handleSelect = (mi: number, sb: string) => {
    const msgs = [...state.messages];
    msgs[mi] = { ...msgs[mi], soundbite: sb, soundbiteAdvice: "" };
    updateState({ messages: msgs });
  };

  const handleCustom = (index: number, sb: string) => {
    const msgs = [...state.messages];
    msgs[index] = { ...msgs[index], soundbite: sb, soundbiteAdvice: "" };
    updateState({ messages: msgs });
  };

  const handleAdvice = async (index: number) => {
    try {
      const advice = await aiGenerateSoundbiteAdvice(state.messages[index].soundbite);
      const msgs = [...state.messages];
      msgs[index] = { ...msgs[index], soundbiteAdvice: advice };
      updateState({ messages: msgs });
    } catch { /* silent fail */ }
  };

  const allDone = state.messages.slice(0, 3).every((m) => m.soundbite.trim().length >= 5);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold text-[#1F4E79] mb-2">Soundbites for each message</h2>
        <p className="text-gray-600 leading-relaxed">
          A soundbite is the one line someone repeats to a colleague without looking at their notes.
          Short, memorable, emotionally resonant. Under 15 words is ideal.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 bg-gray-100">
          {[0, 1, 2].map((i) => (
            <TabsTrigger key={i} value={String(i)}
              className="text-xs data-[state=active]:bg-[#2E75B6] data-[state=active]:text-white">
              Msg {i + 1} {state.messages[i].soundbite.trim().length >= 5 ? " \u2713" : ""}
            </TabsTrigger>
          ))}
        </TabsList>
        {[0, 1, 2].map((i) => (
          <TabsContent key={i} value={String(i)} className="space-y-3 mt-3">
            <div className="p-3 bg-[#EAF2FA]/50 rounded text-sm text-[#1F4E79]">
              <strong>Message {i + 1}:</strong> {state.selectedMessages[i]}
            </div>
            {!showOpts[i] && (
              <Button onClick={() => handleGenerate(i)} className="bg-[#2E75B6] hover:bg-[#1F4E79] text-white gap-2" size="sm">
                <Sparkles className="w-3.5 h-3.5" /> Generate soundbite ideas
              </Button>
            )}
            {showOpts[i] && (
              <div className="space-y-2">
                <p className="text-xs text-gray-500">Click one to use it, or write your own below:</p>
                {options[i].map((opt, j) => (
                  <button key={j} onClick={() => handleSelect(i, opt)}
                    className={`block w-full text-left text-sm p-3 rounded border transition-all ${
                      state.messages[i].soundbite === opt
                        ? "bg-[#1F4E79] text-white border-[#1F4E79]"
                        : "bg-white border-gray-200 hover:border-[#2E75B6] text-gray-700"}`}>
                    <Quote className="w-3 h-3 inline mr-1 opacity-50" />&ldquo;{opt}&rdquo;
                  </button>
                ))}
              </div>
            )}
            <Input value={state.messages[i].soundbite} onChange={(e) => handleCustom(i, e.target.value)}
              placeholder="Or write your own soundbite..." className="text-sm border-gray-300" />
            {state.messages[i].soundbite.trim().length >= 5 && (
              <Button onClick={() => handleAdvice(i)} variant="outline"
                className="gap-2 border-[#2E75B6] text-[#2E75B6] hover:bg-[#EAF2FA]" size="sm">
                <MessageSquare className="w-3.5 h-3.5" /> Why does this soundbite work?
              </Button>
            )}
            {state.messages[i].soundbiteAdvice && (
              <Card className="border-[#2E75B6]/20 bg-[#EAF2FA]/30">
                <CardContent className="pt-4">
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{state.messages[i].soundbiteAdvice}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <div className="flex justify-between pt-2">
        <Button variant="ghost" onClick={onBack} className="gap-2 text-gray-500"><ArrowLeft className="w-4 h-4" /> Back</Button>
        <Button onClick={onNext} disabled={!allDone} className="bg-[#1F4E79] hover:bg-[#163a5c] text-white gap-2">
          View Complete Plan <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
