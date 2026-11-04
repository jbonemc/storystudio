"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { episodes } from "@/lib/episodes/data";
import { FileText, Download } from "lucide-react";
import { TOOL_ICONS as ICONS, FallbackToolIcon } from "@/lib/episodes/icons";
import Walkthrough, { useWalkthrough } from "@/components/portal/Walkthrough";
import { createClient } from "@/lib/supabase/client";

const RESOURCES = [
  { name: "Story Studio Handbook", file: "story-studio-handbook.pdf", description: "The complete Story Studio reference guide" },
  { name: "Episode 1: Language", file: "episode-1-language.pdf", description: "Building blocks: visual, emotional, and logical language" },
  { name: "Episode 2: Story", file: "episode-2--story.pdf", description: "Story structures: PIP, setup-conflict-resolution, past-event-present" },
  { name: "Episode 3: Audience", file: "episode-3--audience-.pdf", description: "Sharing your story: delivery, interviews, and adaptation" },
  { name: "Content Tool", file: "content-tool.pdf", description: "The 13-item communication planning template" },
];

// Flat episode colours from the theme tokens, so all three cards read as one set.
const CARD_COLOURS: Record<number, string> = {
  1: "bg-ep1",
  2: "bg-ep2",
  3: "bg-ep3",
};

const SWATCH_FLOAT = [
  { x: [0, 15, -10, 0], y: [0, -20, 10, 0], rotate: [-6, -2, -8, -6], duration: 8 },
  { x: [0, -12, 8, 0], y: [0, 12, -15, 0], rotate: [-6, -10, -3, -6], duration: 10 },
  { x: [0, 10, -15, 0], y: [0, -10, 18, 0], rotate: [-6, -4, -9, -6], duration: 9 },
];

export default function DashboardPage() {
  const tour = useWalkthrough();

  return (
    <div className="overflow-hidden">
      <Walkthrough open={tour.open} onClose={tour.close} />
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
          <motion.button
            onClick={tour.show}
            className="mt-6 text-sm font-medium text-white/70 underline underline-offset-4 decoration-ep2 hover:text-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            Take the tour
          </motion.button>
        </div>
      </div>

      {/* Episode cards: horizontal scroll on mobile, grid on desktop */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-12 relative z-10">
        <div className="flex sm:grid sm:grid-cols-3 gap-5 overflow-x-auto sm:overflow-visible pb-4 sm:pb-0 snap-x snap-mandatory scrollbar-hide">
          {episodes.map((ep, idx) => (
            <motion.div
              key={ep.slug}
              className="min-w-[280px] sm:min-w-0 snap-center h-full"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * idx }}
            >
              <Link
                href={`/episode/${ep.slug}`}
                className="group flex flex-col h-full relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300"
              >
                <div
                  className={`${CARD_COLOURS[ep.number]} flex flex-col flex-1 p-7 pb-6`}
                >
                  <span className="text-[10px] font-bold text-navy/60 uppercase tracking-[0.2em]">
                    Episode {ep.number}
                  </span>
                  <h2 className="text-3xl font-bold text-navy mt-2 mb-1 tracking-tight">
                    {ep.title}
                  </h2>
                  <p className="text-sm text-navy/70 mb-6">
                    {ep.subtitle}
                  </p>

                  {/* Tool previews */}
                  <div className="space-y-2">
                    {ep.tools.map((tool) => {
                      const Icon = ICONS[tool.icon] || FallbackToolIcon;
                      return (
                        <div
                          key={tool.id}
                          className="flex items-center gap-2.5 bg-white/50 rounded-lg px-3 py-2 group-hover:bg-white/70 transition-colors"
                        >
                          <Icon className="w-3.5 h-3.5 text-navy/70" />
                          <span className="text-xs font-medium text-navy">
                            {tool.title}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-auto pt-4 flex items-center gap-2">
                    <span className="text-[10px] font-medium text-navy/60">
                      {ep.coreIdeas.length} ideas
                    </span>
                    <span className="text-navy/30">&middot;</span>
                    <span className="text-[10px] font-medium text-navy/60">
                      {ep.downloads.length} download{ep.downloads.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* How it works: animated steps */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-50px" }}
        >
          <h2 className="text-2xl font-bold text-navy">
            Three episodes. Ten AI tools. Unlimited practice.
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-3 gap-8">
          {[
            {
              step: "1",
              title: "Review",
              desc: "Revisit core ideas from each episode: visual, emotional, and logical language; story structure; audience adaptation.",
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

      {/* Resources: downloadable PDFs */}
      <ResourcesSection />
    </div>
  );
}

function ResourcesSection() {
  const supabase = createClient();

  async function handleDownload(file: string, name: string) {
    const { data, error } = await supabase.storage
      .from("resources")
      .createSignedUrl(file, 60);

    if (error || !data?.signedUrl) {
      alert("Unable to download. Please try again.");
      return;
    }

    const a = document.createElement("a");
    a.href = data.signedUrl;
    a.download = name + ".pdf";
    a.click();
  }

  return (
    <div className="bg-gray-50/50 border-t border-gray-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
        <motion.div
          className="flex items-center gap-3 mb-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-50px" }}
        >
          <div className="h-px flex-1 bg-gray-200" />
          <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-navy/40 flex items-center gap-2">
            <FileText className="w-3.5 h-3.5" />
            Resources
          </h2>
          <div className="h-px flex-1 bg-gray-200" />
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {RESOURCES.map((resource, idx) => (
            <motion.button
              key={resource.file}
              onClick={() => handleDownload(resource.file, resource.name)}
              className="group text-left bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-lg p-5 transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ delay: idx * 0.06, duration: 0.35 }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-navy/5 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-navy/40" />
                </div>
                <Download className="w-4 h-4 text-gray-300 group-hover:text-navy transition-colors" />
              </div>
              <h3 className="text-sm font-bold text-navy mb-1">
                {resource.name}
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                {resource.description}
              </p>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
