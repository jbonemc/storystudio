"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Mail, ArrowRight, CheckCircle, XCircle, Loader2 } from "lucide-react";

type Step = "email" | "terms" | "sent" | "denied";

export default function LoginPage() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Check if email is on the allowlist
      const res = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });
      const data = await res.json();

      if (data.allowed) {
        if (data.needsTerms) {
          setStep("terms");
        } else {
          await sendMagicLink();
        }
      } else {
        setStep("denied");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function sendMagicLink() {
    setLoading(true);
    setError("");

    try {
      const { error: authError } = await supabase.auth.signInWithOtp({
        email: email.toLowerCase().trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (authError) {
        setError(authError.message);
      } else {
        setStep("sent");
      }
    } catch {
      setError("Failed to send login link. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAcceptTerms() {
    setLoading(true);
    // Record terms acceptance
    await fetch("/api/auth/accept-terms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.toLowerCase().trim() }),
    });
    await sendMagicLink();
  }

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center px-4">
      {/* Background accents */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-[#C4B3D4]/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-[#E8B4C8]/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#F2C4A8]/5 blur-3xl" />
      </div>

      <motion.div
        className="relative z-10 w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Logo / Brand */}
        <div className="text-center mb-10">
          <div className="flex justify-center gap-1.5 mb-4">
            <div className="w-6 h-8 rounded-sm bg-[#C4B3D4] -rotate-6" />
            <div className="w-6 h-8 rounded-sm bg-[#E8B4C8] rotate-0" />
            <div className="w-6 h-8 rounded-sm bg-[#F2C4A8] rotate-6" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wide">
            STORY STUDIO
          </h1>
          <p className="text-white/40 text-sm mt-1">Participant Portal</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
          <AnimatePresence mode="wait">
            {step === "email" && (
              <motion.form
                key="email"
                onSubmit={handleEmailSubmit}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-lg font-semibold text-white mb-1">
                  Sign in
                </h2>
                <p className="text-white/40 text-sm mb-6">
                  Enter the email address registered for your course.
                </p>

                <div className="relative mb-4">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-[#C4B3D4]/50 focus:ring-1 focus:ring-[#C4B3D4]/30 transition-all"
                  />
                </div>

                {error && (
                  <p className="text-red-400 text-sm mb-4">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#C4B3D4] hover:bg-[#b5a3c6] text-navy font-semibold rounded-xl py-3 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </motion.form>
            )}

            {step === "terms" && (
              <motion.div
                key="terms"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-lg font-semibold text-white mb-1">
                  Fair Use Agreement
                </h2>
                <p className="text-white/40 text-sm mb-5">
                  Please review and accept before continuing.
                </p>

                <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-5 max-h-64 overflow-y-auto text-sm text-white/60 leading-relaxed space-y-3">
                  <p>
                    <strong className="text-white/80">Access period:</strong>{" "}
                    Your access is valid for 12 months from the date your email
                    was registered. After this period, access may be extended at
                    the discretion of the course organiser.
                  </p>
                  <p>
                    <strong className="text-white/80">Fair use:</strong> The AI
                    tools are provided to support your ongoing communication
                    development. Usage is expected to remain within reasonable
                    levels — approximately 50 tool interactions per month.
                    Automated or bulk usage is not permitted.
                  </p>
                  <p>
                    <strong className="text-white/80">Data:</strong> Text you
                    enter into the tools is processed by Anthropic&apos;s Claude API
                    to generate feedback. Your inputs are not stored beyond the
                    active session and are not used to train AI models. The only
                    personal data held is your email address for authentication.
                  </p>
                  <p>
                    <strong className="text-white/80">Your content:</strong> You
                    retain full ownership of any content you create using the
                    tools.
                  </p>
                  <p>
                    <strong className="text-white/80">Access removal:</strong>{" "}
                    Access may be revoked if usage significantly exceeds fair use
                    levels or if the tools are used for purposes unrelated to
                    communication development.
                  </p>
                </div>

                {error && (
                  <p className="text-red-400 text-sm mb-4">{error}</p>
                )}

                <button
                  onClick={handleAcceptTerms}
                  disabled={loading}
                  className="w-full bg-[#C4B3D4] hover:bg-[#b5a3c6] text-navy font-semibold rounded-xl py-3 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      I agree — send me a login link
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </motion.div>
            )}

            {step === "sent" && (
              <motion.div
                key="sent"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="text-center py-4"
              >
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <h2 className="text-lg font-semibold text-white mb-2">
                  Check your email
                </h2>
                <p className="text-white/40 text-sm mb-1">
                  We&apos;ve sent a login link to
                </p>
                <p className="text-white font-medium">{email}</p>
                <p className="text-white/30 text-xs mt-4">
                  Check your spam folder if you don&apos;t see it within a minute.
                </p>
              </motion.div>
            )}

            {step === "denied" && (
              <motion.div
                key="denied"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="text-center py-4"
              >
                <XCircle className="w-12 h-12 text-[#E8B4C8] mx-auto mb-4" />
                <h2 className="text-lg font-semibold text-white mb-2">
                  Access not found
                </h2>
                <p className="text-white/40 text-sm mb-4 max-w-xs mx-auto">
                  The email <strong className="text-white/60">{email}</strong>{" "}
                  is not registered for Story Studio. If you believe this is an
                  error, please contact your course organiser.
                </p>
                <button
                  onClick={() => {
                    setStep("email");
                    setEmail("");
                  }}
                  className="text-[#C4B3D4] text-sm font-medium hover:underline"
                >
                  Try a different email
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center text-white/20 text-xs mt-6">
          Story Studio by Whipsmart Media
        </p>
      </motion.div>
    </div>
  );
}
