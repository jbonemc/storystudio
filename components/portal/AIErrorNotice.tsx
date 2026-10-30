"use client";

import { AlertCircle, RotateCw, LogIn } from "lucide-react";
import type { AIRequestError } from "@/lib/aiClient";

interface Props {
  error: AIRequestError;
  /** Called by the "Try again" button. Omit to hide the button. */
  onRetry?: () => void;
}

/** Shown wherever an AI call fails, so a participant never sees a blank result. */
export function AIErrorNotice({ error, onRetry }: Props) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4"
    >
      <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
      <div className="flex-1 space-y-2">
        <p className="text-sm text-red-800">{error.message}</p>
        <div className="flex flex-wrap gap-3">
          {error.needsSignIn ? (
            <a
              href="/login"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-navy underline underline-offset-2"
            >
              <LogIn className="w-3.5 h-3.5" /> Sign in again
            </a>
          ) : (
            onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-navy underline underline-offset-2"
              >
                <RotateCw className="w-3.5 h-3.5" /> Try again
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
