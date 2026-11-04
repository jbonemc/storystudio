"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { episodes } from "@/lib/episodes/data";
import { TOOL_ICONS, FallbackToolIcon } from "@/lib/episodes/icons";

// Remembers that this browser has seen the tour, so it only opens by itself once.
// It is a convenience only: if storage is blocked the tour simply shows again.
const SEEN_KEY = "ss-walkthrough-seen-v1";

const CARD_BG: Record<number, string> = { 1: "bg-ep1", 2: "bg-ep2", 3: "bg-ep3" };

// One plain-language explanation per episode. Tool names come from the episode data.
const COPY: Record<number, { headline: string; body: string }> = {
  1: {
    headline: "Find words that make people see, feel and believe.",
    body: "Turn a technical description into vivid everyday metaphors, check the balance of visual, emotional and logical language in anything you write, and find openings your audience won't expect.",
  },
  2: {
    headline: "Shape what you know into a story people remember.",
    body: "Reshape a rough anecdote into proven story structures, see your work through the eyes of the people it affects, and find the one sentence that says what your work is fighting for.",
  },
  3: {
    headline: "Get your story to the right people, in the right way.",
    body: "Build your full communication plan in the Content Tool, prepare for media interviews, plan a persuasive meeting and rehearse the questions you dread with an AI coach.",
  },
};

function readSeen(): boolean {
  try {
    return window.localStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

function markSeen() {
  try {
    window.localStorage.setItem(SEEN_KEY, "1");
  } catch {
    /* storage blocked: nothing to do */
  }
}

export function useWalkthrough() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!readSeen()) setOpen(true);
  }, []);

  const close = useCallback(() => {
    markSeen();
    setOpen(false);
  }, []);

  return { open, show: () => setOpen(true), close };
}

export default function Walkthrough({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState(0);
  const nextRef = useRef<HTMLButtonElement>(null);
  const last = episodes.length - 1;

  useEffect(() => {
    if (open) setStep(0);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    nextRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setStep((s) => Math.min(s + 1, last));
      if (e.key === "ArrowLeft") setStep((s) => Math.max(s - 1, 0));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, last]);

  const ep = episodes[step];
  const copy = COPY[ep.number];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-navy/70 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="walkthrough-title"
            className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              aria-label="Close the tour"
              className="absolute right-3 top-3 z-10 rounded-lg p-1.5 text-navy/60 hover:bg-white/40 hover:text-navy"
            >
              <X className="h-5 w-5" />
            </button>

            <AnimatePresence mode="wait">
              <motion.div
                key={ep.slug}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.2 }}
              >
                <div className={`${CARD_BG[ep.number]} px-7 pb-6 pt-7`}>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-navy/60">
                    Episode {ep.number} of {episodes.length}
                  </span>
                  <h2 id="walkthrough-title" className="mt-2 text-3xl font-bold tracking-tight text-navy">
                    {ep.title}
                  </h2>
                  <p className="mt-2 text-base font-medium leading-snug text-navy/80">{copy.headline}</p>
                </div>

                <div className="px-7 pb-2 pt-5">
                  <p className="text-sm leading-relaxed text-gray-600">{copy.body}</p>
                  <ul className="mt-4 space-y-2">
                    {ep.tools.map((tool) => {
                      const Icon = TOOL_ICONS[tool.icon] || FallbackToolIcon;
                      return (
                        <li key={tool.id} className="flex items-center gap-2.5 text-sm font-medium text-navy">
                          <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${CARD_BG[ep.number]}`}>
                            <Icon className="h-3.5 w-3.5 text-navy/80" />
                          </span>
                          {tool.title}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="flex items-center justify-between px-7 pb-6 pt-5">
              <div className="flex gap-1.5" aria-hidden="true">
                {episodes.map((e, i) => (
                  <span
                    key={e.slug}
                    className={`h-1.5 rounded-sm transition-all ${i === step ? `w-6 ${CARD_BG[e.number]}` : "w-1.5 bg-gray-200"}`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                {step > 0 ? (
                  <button
                    onClick={() => setStep(step - 1)}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:text-navy"
                  >
                    Back
                  </button>
                ) : (
                  <button
                    onClick={onClose}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:text-navy"
                  >
                    Skip
                  </button>
                )}
                <button
                  ref={nextRef}
                  onClick={() => (step === last ? onClose() : setStep(step + 1))}
                  className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy/90"
                >
                  {step === last ? "Get started" : "Next"}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
