"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { episodes } from "@/lib/episodes/data";
import { Lightbulb, BarChart3, BookOpen, RefreshCw, Target, Mic } from "lucide-react";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Lightbulb, BarChart3, BookOpen, RefreshCw, Target, Mic,
};

const CARD_GRADIENTS: Record<number, string> = {
  1: "from-[#C4B3D4] via-[#b8a3cc] to-[#a890c0]",
  2: "from-[#E8B4C8] via-[#dea0b8] to-[#d498b0]",
  3: "from-[#F2C4A8] via-[#ecb498] to-[#e0a888]",
};

const SWATCH_FLOAT = [
  { x: [0, 15, -10, 0], y: [0, -20, 10, 0], rotate: [-6, -2, -8, -6], duration: 8 },
  { x: [0, -12, 8, 0], y: [0, 12, -15, 0], rotate: [-6, -10, -3, -6], duration: 10 },
  { x: [0, 10, -15, 0], y: [0, -10, 18, 0], rotate: [-6, -4, -9, -6], duration: 9 },
];

export default function DashboardPage() {
  return (
    <div className="overflow-hidden">
      {/* Hero with floating swatches */}
      <div className="bg-navy text-white py-20 sm:py-28 px-4 sm:px-6 relative">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-ep1/5 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full bg-ep3/5 blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="flex justify-center gap-3 mb-8">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className={`w-7 h-10 rounded-sm ${
                  i === 0 ? "bg-ep1" : i === 1 ? "bg-ep2" : "bg-ep3"
                }`}
                animate={{
                  x: SWATCH_FLOAT[i].x,
                  y: SWATCH_FLOAT[i].y,
                  rotate: SWATCH_FLOAT[i].rotate,
                }}
                transition={{
                  duration: SWATCH_FLOAT[i].duration,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
          <motion.h1
            className="text-4xl sm:text-5xl font-bold tracking-tight mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Story Studio
          </motion.h1>
          <motion.p
            className="text-white/50 text-base sm:text-lg max-w-md mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            Your participant portal. Review, practice, download.
          </motion.p>
        </div>
      </div>

      {/* Episode cards — horizontal scroll on mobile, grid on desktop */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-12 relative z-10">
        <div className="flex sm:grid sm:grid-cols-3 gap-5 overflow-x-auto sm:overflow-visible pb-4 sm:pb-0 snap-x snap-mandatory scrollbar-hide">
          {episodes.map((ep, idx) => (
            <motion.div
              key={ep.slug}
              className="min-w-[280px] sm:min-w-0 snap-center"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * idx }}
            >
              <Link
                href={`/episode/${ep.slug}`}
                className="group block relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
              >
                <div
                  className={`bg-gradient-to-br ${CARD_GRADIENTS[ep.number]} p-7 pb-6`}
                >
                  <span className="text-[10px] font-bold text-white/60 uppercase tracking-[0.2em]">
                    Episode {ep.number}
                  </span>
                  <h2 className="text-3xl font-bold text-white mt-2 mb-1 tracking-tight">
                    {ep.title}
                  </h2>
                  <p className="text-sm text-white/70 mb-6">
                    {ep.subtitle}
                  </p>

                  {/* Tool previews */}
                  <div className="space-y-2">
                    {ep.tools.map((tool) => {
                      const Icon = ICONS[tool.icon] || Lightbulb;
                      return (
                        <div
                          key={tool.id}
                          className="flex items-center gap-2.5 bg-white/15 backdrop-blur-sm rounded-lg px-3 py-2 group-hover:bg-white/25 transition-colors"
                        >
                          <Icon className="w-3.5 h-3.5 text-white/80" />
                          <span className="text-xs font-medium text-white/90">
                            {tool.title}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <span className="text-[10px] font-medium text-white/40">
                      {ep.coreIdeas.length} ideas
                    </span>
                    <span className="text-white/20">&middot;</span>
                    <span className="text-[10px] font-medium text-white/40">
                      {ep.downloads.length} download{ep.downloads.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>

                {/* Hover shimmer */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* How it works — animated steps */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-50px" }}
        >
          <h2 className="text-2xl font-bold text-navy">
            Three episodes. Six AI tools. Unlimited practice.
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-3 gap-8">
          {[
            {
              step: "1",
              title: "Review",
              desc: "Revisit core ideas from each episode — visual, emotional, and logical language; story structure; audience adaptation.",
              colour: "bg-ep1",
            },
            {
              step: "2",
              title: "Practice",
              desc: "Use AI tools to apply what you learned. Generate metaphors, analyse language, structure stories, prep for interviews.",
              colour: "bg-ep2",
            },
            {
              step: "3",
              title: "Download",
              desc: "Take worksheets, the Content Tool template, and interview guides with you. Keep building your skills after the course.",
              colour: "bg-ep3",
            },
          ].map((item, idx) => (
            <motion.div
              key={idx}
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ delay: idx * 0.12, duration: 0.4 }}
            >
              <div
                className={`w-12 h-12 rounded-2xl ${item.colour}/25 flex items-center justify-center mx-auto mb-4`}
              >
                <span className="text-lg font-bold text-navy">
                  {item.step}
                </span>
              </div>
              <h3 className="text-base font-bold text-navy mb-1">
                {item.title}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                {item.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
