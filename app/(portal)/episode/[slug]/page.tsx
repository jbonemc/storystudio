"use client";

import { useState } from "react";
import { notFound, useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { getEpisode, Episode } from "@/lib/episodes/data";
import { DownloadCard } from "@/components/portal/DownloadCard";
import {
  Lightbulb,
  BarChart3,
  BookOpen,
  RefreshCw,
  Target,
  Mic,
  ArrowRight,
  Download,
  ChevronDown,
} from "lucide-react";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Lightbulb, BarChart3, BookOpen, RefreshCw, Target, Mic,
};

const HERO_GRADIENTS: Record<number, string> = {
  1: "from-[#C4B3D4]/30 via-[#C4B3D4]/10 to-transparent",
  2: "from-[#E8B4C8]/30 via-[#E8B4C8]/10 to-transparent",
  3: "from-[#F2C4A8]/30 via-[#F2C4A8]/10 to-transparent",
};

const ACCENT_BORDERS: Record<number, string> = {
  1: "border-[#C4B3D4]/40 hover:border-[#C4B3D4]",
  2: "border-[#E8B4C8]/40 hover:border-[#E8B4C8]",
  3: "border-[#F2C4A8]/40 hover:border-[#F2C4A8]",
};

const ACCENT_BG: Record<number, string> = {
  1: "bg-[#C4B3D4]",
  2: "bg-[#E8B4C8]",
  3: "bg-[#F2C4A8]",
};

const ACCENT_BG_LIGHT: Record<number, string> = {
  1: "bg-[#C4B3D4]/15",
  2: "bg-[#E8B4C8]/15",
  3: "bg-[#F2C4A8]/15",
};

const ACCENT_TEXT: Record<number, string> = {
  1: "text-[#C4B3D4]",
  2: "text-[#E8B4C8]",
  3: "text-[#F2C4A8]",
};

const ACCENT_BORDER_SOLID: Record<number, string> = {
  1: "border-[#C4B3D4]",
  2: "border-[#E8B4C8]",
  3: "border-[#F2C4A8]",
};

function CoreIdeasSection({ episode }: { episode: Episode }) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
      <motion.div
        className="flex items-center gap-3 mb-8"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-50px" }}
      >
        <div className={`h-px flex-1 ${ACCENT_BG[episode.number]}/30`} />
        <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-navy/40">
          Core Ideas
        </h2>
        <div className={`h-px flex-1 ${ACCENT_BG[episode.number]}/30`} />
      </motion.div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {episode.coreIdeas.map((idea, idx) => {
          const isActive = activeIdx === idx;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ delay: idx * 0.08, duration: 0.4 }}
              layout
            >
              <motion.button
                onClick={() => setActiveIdx(isActive ? null : idx)}
                className={`w-full text-left rounded-2xl p-5 transition-all duration-300 border-2 relative overflow-hidden ${
                  isActive
                    ? `bg-navy ${ACCENT_BORDER_SOLID[episode.number]} shadow-xl`
                    : "bg-white border-gray-100 hover:border-gray-200 hover:shadow-lg"
                }`}
                layout
              >
                {/* Decorative corner accent */}
                <div
                  className={`absolute top-0 right-0 w-16 h-16 rounded-bl-[2rem] transition-opacity duration-300 ${
                    isActive ? `${ACCENT_BG[episode.number]}/20` : `${ACCENT_BG[episode.number]}/8`
                  }`}
                />

                {/* Number */}
                <motion.div
                  className={`relative z-10 w-9 h-9 rounded-xl flex items-center justify-center mb-4 font-bold text-sm transition-all duration-300 ${
                    isActive
                      ? `${ACCENT_BG[episode.number]} text-navy`
                      : `${ACCENT_BG_LIGHT[episode.number]} text-navy/70`
                  }`}
                  layout="position"
                >
                  {idx + 1}
                </motion.div>

                {/* Title */}
                <motion.h3
                  className={`relative z-10 text-base font-bold mb-2 transition-colors duration-300 ${
                    isActive ? "text-white" : "text-navy"
                  }`}
                  layout="position"
                >
                  {idea.title}
                </motion.h3>

                {/* Description — always visible but styled differently */}
                <AnimatePresence mode="wait">
                  {isActive ? (
                    <motion.p
                      key="active"
                      className="relative z-10 text-sm text-white/70 leading-relaxed"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      {idea.description}
                    </motion.p>
                  ) : (
                    <motion.p
                      key="inactive"
                      className="relative z-10 text-sm text-gray-400 leading-relaxed line-clamp-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {idea.description}
                    </motion.p>
                  )}
                </AnimatePresence>

                {/* Expand hint */}
                <div
                  className={`relative z-10 mt-3 flex items-center gap-1 text-[10px] font-semibold tracking-wide uppercase transition-colors duration-300 ${
                    isActive ? ACCENT_TEXT[episode.number] : "text-gray-300"
                  }`}
                >
                  <span>{isActive ? "Tap to close" : "Tap to read"}</span>
                  <motion.span
                    animate={{ rotate: isActive ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="inline-block"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </motion.span>
                </div>
              </motion.button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export default function EpisodePage() {
  const params = useParams();
  const slug = params.slug as string;
  const episode = getEpisode(slug);
  if (!episode) notFound();

  return (
    <div className="overflow-hidden">
      {/* Hero — compact but striking */}
      <div className="bg-navy text-white relative overflow-hidden">
        <div
          className={`absolute inset-0 bg-gradient-to-b ${HERO_GRADIENTS[episode.number]}`}
        />
        {/* Floating accent orbs */}
        <div
          className={`absolute -top-20 -right-20 w-72 h-72 rounded-full ${ACCENT_BG[episode.number]}/10 blur-3xl`}
        />
        <div
          className={`absolute -bottom-32 -left-20 w-56 h-56 rounded-full ${ACCENT_BG[episode.number]}/5 blur-3xl`}
        />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-14 sm:py-20 relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="flex items-center gap-3 mb-4"
          >
            <div className={`w-1.5 h-10 rounded-full ${ACCENT_BG[episode.number]}`} />
            <span className="text-xs font-bold tracking-[0.2em] uppercase text-white/40">
              Episode {episode.number}
            </span>
          </motion.div>
          <motion.h1
            className="text-4xl sm:text-6xl font-bold tracking-tight mb-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {episode.title}
          </motion.h1>
          <motion.p
            className="text-lg sm:text-xl text-white/50 font-medium mb-6"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {episode.subtitle}
          </motion.p>
          <motion.p
            className="text-sm sm:text-base text-white/40 leading-relaxed max-w-2xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {episode.description}
          </motion.p>
        </div>
      </div>

      {/* AI Tools — horizontal scroll cards, overlapping the hero */}
      <div className="relative z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8">
          <motion.h2
            className="text-xs font-bold tracking-[0.15em] uppercase text-navy/40 mb-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            AI Tools
          </motion.h2>
        </div>
        <div className="flex gap-4 overflow-x-auto sm:overflow-visible pb-4 sm:pb-0 px-4 sm:px-0 snap-x snap-mandatory scrollbar-hide sm:max-w-5xl sm:mx-auto sm:px-6 sm:grid sm:grid-cols-2">
          {episode.tools.map((tool, idx) => {
            const Icon = ICONS[tool.icon] || Lightbulb;
            return (
              <motion.div
                key={tool.id}
                className="min-w-[300px] sm:min-w-0 snap-center"
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + idx * 0.1, duration: 0.4 }}
              >
                <Link
                  href={tool.href}
                  className={`group block h-full rounded-2xl border-2 ${ACCENT_BORDERS[episode.number]} bg-white p-6 sm:p-8 transition-all duration-300 hover:shadow-xl hover:-translate-y-1`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={`w-12 h-12 rounded-xl ${ACCENT_BG_LIGHT[episode.number]} flex items-center justify-center`}
                    >
                      <Icon className="w-6 h-6 text-navy" />
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-navy group-hover:translate-x-1 transition-all" />
                  </div>
                  <h3 className="text-lg font-bold text-navy mb-2">
                    {tool.title}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {tool.description}
                  </p>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Core Ideas — interactive accordion cards */}
      <CoreIdeasSection episode={episode} />

      {/* Downloads — fade in from bottom */}
      <div className="bg-gray-50/50 border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <motion.div
            className="flex items-center gap-2 mb-5"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <Download className="w-4 h-4 text-navy/30" />
            <h2 className="text-xs font-bold tracking-[0.15em] uppercase text-navy/40">
              Downloads
            </h2>
          </motion.div>
          <div className="grid sm:grid-cols-2 gap-3">
            {episode.downloads.map((dl, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.3 }}
              >
                <DownloadCard download={dl} />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
