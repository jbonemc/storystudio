"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bookmark, BookmarkCheck, Loader2 } from "lucide-react";
import { saveWork, toAIError } from "@/lib/aiClient";

interface Props {
  tool: string;
  title: string;
  data: unknown;
  label?: string;
  className?: string;
}

/**
 * Saves something to the participant's Story Bank. Shows "Saved" only after
 * the server has confirmed the row exists; otherwise shows why it failed.
 * After the first save it updates that same item, so saving again (for
 * example at the end of a practice session) never creates duplicates.
 */
export function SaveButton({ tool, title, data, label = "Save to Story Bank", className = "" }: Props) {
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");
  const savedId = useRef<string | undefined>(undefined);
  const dataKey = JSON.stringify(data ?? null);
  const savedKey = useRef<string>("");

  // If the content changes after saving, offer to save the changes.
  useEffect(() => {
    if (state === "saved" && dataKey !== savedKey.current) setState("idle");
  }, [dataKey, state]);

  const handleSave = async () => {
    setState("saving");
    setMessage("");
    try {
      const row = await saveWork({ id: savedId.current, tool, title, data });
      savedId.current = row.id;
      savedKey.current = dataKey;
      setState("saved");
    } catch (err) {
      setState("error");
      setMessage(toAIError(err).message);
    }
  };

  return (
    <div className={`inline-flex flex-col items-start gap-1 ${className}`}>
      {state === "saved" ? (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
          <BookmarkCheck className="w-3.5 h-3.5" /> Saved.{" "}
          <Link href="/story-bank" className="underline underline-offset-2 text-navy">
            Open Story Bank
          </Link>
        </span>
      ) : (
        <button
          type="button"
          onClick={handleSave}
          disabled={state === "saving"}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-navy/70 hover:text-navy border border-gray-200 hover:border-navy/40 rounded-md px-2.5 py-1.5 transition-colors disabled:opacity-60"
        >
          {state === "saving" ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Bookmark className="w-3.5 h-3.5" />
          )}
          {state === "saving" ? "Saving..." : savedId.current ? "Save changes" : label}
        </button>
      )}
      {state === "error" && <span className="text-xs text-red-700 max-w-xs">{message}</span>}
    </div>
  );
}
