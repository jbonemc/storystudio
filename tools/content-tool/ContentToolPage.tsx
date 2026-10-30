"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Check, CloudOff, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { AppState, TOTAL_STEPS, STEP_LABELS } from "@/lib/types";
import { UploadStep } from "@/components/steps/UploadStep";
import { BehaviourChangeStep } from "@/components/steps/BehaviourChangeStep";
import { AudienceStep } from "@/components/steps/AudienceStep";
import { ShouldStatementStep } from "@/components/steps/ShouldStatementStep";
import { KeyMessagesStep } from "@/components/steps/KeyMessagesStep";
import { StoriesStep } from "@/components/steps/StoriesStep";
import { StatisticsStep } from "@/components/steps/StatisticsStep";
import { SoundbitesStep } from "@/components/steps/SoundbitesStep";
import { WatchoutStep } from "@/components/steps/WatchoutStep";
import { SummaryStep } from "@/components/steps/SummaryStep";
import { listSaved, saveWork, toAIError, type SavedItem } from "@/lib/aiClient";
import { savableState, planTitle } from "@/lib/plan";

const initialMessage = () => ({
  text: "", story: "", storyAdvice: "", statistic: "", statisticAdvice: "", soundbite: "", soundbiteAdvice: "",
});

const freshState = (): AppState => ({
  step: 0, documents: "", documentSummary: "", behaviourChange: "",
  shouldStatements: [], selectedShouldStatement: "", customShouldStatement: "",
  suggestedMessages: [], selectedMessages: [], messageExplanations: [],
  messages: [initialMessage(), initialMessage(), initialMessage()],
  audience: { who: "", think: "", care: "", barriers: "" },
  watchouts: [],
  isLoading: false,
});

/** Fills in fields added since a plan was saved, so old plans still open. */
function restore(data: unknown): AppState {
  const base = freshState();
  if (!data || typeof data !== "object") return base;
  const d = data as Partial<AppState>;
  return {
    ...base,
    ...d,
    audience: { ...base.audience, ...(d.audience || {}) },
    messages: [0, 1, 2].map((i) => ({ ...initialMessage(), ...(d.messages?.[i] || {}) })),
    watchouts: Array.isArray(d.watchouts) ? d.watchouts : [],
    isLoading: false,
  };
}

// A browser copy, so a refresh never loses work even if the server save fails.
const LOCAL_KEY = "ss-content-tool-draft";
type SaveStatus = { kind: "idle" | "saving" | "saved" | "error"; message?: string; at?: string };

export function ContentToolPage() {
  const searchParams = useSearchParams();
  const [state, setState] = useState<AppState>(freshState);
  const [savedId, setSavedId] = useState<string | undefined>();
  const [status, setStatus] = useState<SaveStatus>({ kind: "idle" });
  const [resumeOffer, setResumeOffer] = useState<SavedItem | null>(null);
  const [ready, setReady] = useState(false);

  // ── Load: a plan from the Story Bank link, or offer the latest one ────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const wanted = searchParams.get("plan");
      try {
        const plans = await listSaved("content-tool");
        if (cancelled) return;
        const chosen = wanted ? plans.find((p) => p.id === wanted) : undefined;
        if (chosen) {
          setState(restore(chosen.data));
          setSavedId(chosen.id);
        } else if (plans[0]) {
          setResumeOffer(plans[0]);
        }
      } catch {
        // Server saving unavailable: fall back to the browser copy, if any.
        try {
          const local = localStorage.getItem(LOCAL_KEY);
          if (local && !cancelled) {
            const parsed = JSON.parse(local) as { data: unknown; at: string };
            setResumeOffer({ id: "", tool: "content-tool", title: "Your last plan on this device", data: parsed.data, updated_at: parsed.at });
          }
        } catch {}
      }
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  // ── Autosave: two seconds after the last change ───────────────────────────
  const inFlight = useRef<Promise<void> | null>(null);
  const idRef = useRef<string | undefined>(undefined);
  idRef.current = savedId;

  const persist = useCallback(async (s: AppState) => {
    const data = savableState(s);
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify({ data, at: new Date().toISOString() }));
    } catch {}
    // Never run two saves at once, or the first one would create a duplicate.
    if (inFlight.current) await inFlight.current;
    setStatus({ kind: "saving" });
    const run = (async () => {
      try {
        const row = await saveWork({ id: idRef.current, tool: "content-tool", title: planTitle(s), data });
        idRef.current = row.id;
        setSavedId(row.id);
        setStatus({ kind: "saved", at: new Date().toLocaleTimeString("en-IE", { hour: "2-digit", minute: "2-digit" }) });
      } catch (err) {
        const e = toAIError(err);
        setStatus({
          kind: "error",
          message: e.status === 503 ? "saving to your account is not switched on yet." : e.message,
        });
      }
    })();
    inFlight.current = run;
    await run;
    inFlight.current = null;
  }, []);

  useEffect(() => {
    if (!ready || resumeOffer || !state.documents.trim()) return;
    const t = setTimeout(() => persist(state), 2000);
    return () => clearTimeout(t);
    // Save on content changes, not on loading flags.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, resumeOffer, persist, JSON.stringify(savableState(state))]);

  const updateState = useCallback((partial: Partial<AppState>) => {
    setState((prev) => ({ ...prev, ...partial }));
  }, []);
  const nextStep = useCallback(() => {
    setState((prev) => ({ ...prev, step: Math.min(prev.step + 1, TOTAL_STEPS - 1) }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);
  const prevStep = useCallback(() => {
    setState((prev) => ({ ...prev, step: Math.max(prev.step - 1, 0) }));
  }, []);
  const goToStep = useCallback((step: number) => {
    setState((prev) => ({ ...prev, step }));
  }, []);

  const startNew = () => {
    setResumeOffer(null);
    setSavedId(undefined);
    idRef.current = undefined;
    setState(freshState());
    setStatus({ kind: "idle" });
  };
  const resume = (item: SavedItem) => {
    setState(restore(item.data));
    setSavedId(item.id || undefined);
    setResumeOffer(null);
  };

  const progressPercent = ((state.step + 1) / TOTAL_STEPS) * 100;

  const renderStep = () => {
    const p = { state, updateState };
    switch (state.step) {
      case 0: return <UploadStep {...p} onNext={nextStep} />;
      case 1: return <BehaviourChangeStep {...p} onNext={nextStep} onBack={prevStep} />;
      case 2: return <AudienceStep {...p} onNext={nextStep} onBack={prevStep} />;
      case 3: return <ShouldStatementStep {...p} onNext={nextStep} onBack={prevStep} />;
      case 4: return <KeyMessagesStep {...p} onNext={nextStep} onBack={prevStep} />;
      case 5: return <StoriesStep {...p} onNext={nextStep} onBack={prevStep} />;
      case 6: return <StatisticsStep {...p} onNext={nextStep} onBack={prevStep} />;
      case 7: return <SoundbitesStep {...p} onNext={nextStep} onBack={prevStep} />;
      case 8: return <WatchoutStep {...p} onNext={nextStep} onBack={prevStep} />;
      case 9: return <SummaryStep state={state} goToStep={goToStep} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <div className="max-w-3xl mx-auto px-6 pt-4">
        <Link
          href="/episode/3-audience"
          className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-navy transition-colors"
        >
          <ArrowLeft className="w-3 h-3" /> Episode 3: Audience
        </Link>
      </div>
      <header className="bg-navy text-white py-4 px-6 mt-2">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Content Tool</h1>
            <p className="text-sm text-white/50 mt-0.5">Why, Who, three messages with their proof, and your Watchout</p>
          </div>
          <div className="text-right text-sm text-white/50 space-y-0.5">
            <div>Step {state.step + 1} of {TOTAL_STEPS}</div>
            <SaveIndicator status={status} />
          </div>
        </div>
      </header>
      <div className="max-w-3xl mx-auto px-6 pt-4">
        <div className="flex items-center gap-1 mb-2 flex-wrap">
          {STEP_LABELS.map((label, i) => (
            <button key={i} onClick={() => i <= state.step && goToStep(i)} disabled={i > state.step}
              className={`text-[10px] font-medium px-1.5 py-0.5 rounded transition-colors ${
                i === state.step ? "bg-ep3 text-white"
                  : i < state.step ? "bg-navy text-white cursor-pointer hover:bg-ep3"
                  : "bg-gray-200 text-gray-400"}`}>
              {label}
            </button>
          ))}
        </div>
        <Progress value={progressPercent} className="h-1.5 bg-gray-200 [&>div]:bg-ep3" />
        {status.kind === "error" && (
          <p className="mt-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded p-2">
            Not saved to your account: {status.message} This browser keeps a copy, so refreshing
            the page will not lose your work.
          </p>
        )}
      </div>
      <main className="max-w-3xl mx-auto px-6 py-6">
        {resumeOffer ? (
          <div className="rounded-lg border border-[#2E75B6]/30 bg-white p-5 space-y-3">
            <p className="text-lg font-semibold text-[#1F4E79]">Pick up where you left off?</p>
            <p className="text-sm text-gray-600">
              {resumeOffer.title}
              <span className="text-gray-400">
                {" "}(last changed {new Date(resumeOffer.updated_at).toLocaleDateString("en-IE", { day: "numeric", month: "short" })})
              </span>
            </p>
            <div className="flex gap-2 flex-wrap">
              <button type="button" onClick={() => resume(resumeOffer)} className="text-sm font-medium text-white bg-[#1F4E79] hover:bg-[#163a5c] rounded-md px-4 py-2">
                Continue this plan
              </button>
              <button type="button" onClick={startNew} className="text-sm font-medium text-[#1F4E79] border border-gray-300 rounded-md px-4 py-2">
                Start a new plan
              </button>
            </div>
            <p className="text-xs text-gray-400">
              All your plans are kept in your <Link href="/story-bank" className="underline">Story Bank</Link>.
            </p>
          </div>
        ) : (
          renderStep()
        )}
      </main>
      <footer className="text-center text-xs text-gray-300 py-6">
        Story Studio &middot; Problem &rarr; Inspiration &rarr; Payoff
      </footer>
    </div>
  );
}

function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status.kind === "saving")
    return (
      <div className="inline-flex items-center gap-1 text-xs">
        <Loader2 className="w-3 h-3 animate-spin" /> Saving...
      </div>
    );
  if (status.kind === "saved")
    return (
      <div className="inline-flex items-center gap-1 text-xs text-emerald-300">
        <Check className="w-3 h-3" /> Saved {status.at}
      </div>
    );
  if (status.kind === "error")
    return (
      <div className="inline-flex items-center gap-1 text-xs text-red-300">
        <CloudOff className="w-3 h-3" /> Not saved
      </div>
    );
  return null;
}
