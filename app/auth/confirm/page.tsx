"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, Suspense } from "react";
import { Loader2, LogIn, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function ConfirmInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") || "magiclink";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const supabase = createClient();

  if (!tokenHash) {
    return (
      <div className="text-center py-8">
        <XCircle className="w-12 h-12 text-[#E8B4C8] mx-auto mb-4" />
        <p className="text-white/60 text-sm">
          This link is invalid or has expired. Please request a new login link.
        </p>
        <a
          href="/login"
          className="mt-4 inline-block text-[#C4B3D4] text-sm font-medium hover:underline"
        >
          Back to login
        </a>
      </div>
    );
  }

  async function handleConfirm() {
    setLoading(true);
    setError("");

    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: tokenHash!,
        type: type as "magiclink" | "email",
      });

      if (verifyError) {
        setError(verifyError.message);
        setLoading(false);
        return;
      }

      router.push("/");
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="text-center py-4">
      <div className="flex justify-center gap-1.5 mb-6">
        <div className="w-6 h-8 rounded-sm bg-[#C4B3D4] -rotate-6" />
        <div className="w-6 h-8 rounded-sm bg-[#E8B4C8] rotate-0" />
        <div className="w-6 h-8 rounded-sm bg-[#F2C4A8] rotate-6" />
      </div>
      <h2 className="text-lg font-semibold text-white mb-2">
        Confirm sign in
      </h2>
      <p className="text-white/40 text-sm mb-6">
        Click the button below to complete your login to Story Studio.
      </p>

      {error && (
        <p className="text-red-400 text-sm mb-4">{error}</p>
      )}

      <button
        onClick={handleConfirm}
        disabled={loading}
        className="w-full bg-[#C4B3D4] hover:bg-[#b5a3c6] text-navy font-semibold rounded-xl py-3 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <LogIn className="w-4 h-4" />
            Sign in to Story Studio
          </>
        )}
      </button>
    </div>
  );
}

export default function ConfirmPage() {
  return (
    <div className="min-h-screen bg-navy flex items-center justify-center px-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-[#C4B3D4]/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-[#E8B4C8]/10 blur-3xl" />
      </div>
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
          <Suspense
            fallback={
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-white/40" />
              </div>
            }
          >
            <ConfirmInner />
          </Suspense>
        </div>
        <p className="text-center text-white/20 text-xs mt-6">
          Story Studio by Whipsmart Media
        </p>
      </div>
    </div>
  );
}
