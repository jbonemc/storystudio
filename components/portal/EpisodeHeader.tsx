import type { Episode } from "@/lib/episodes/data";

interface Props {
  episode: Episode;
}

const BG_COLOURS: Record<number, string> = {
  1: "from-[#C4B3D4]/20 to-[#C4B3D4]/5",
  2: "from-[#E8B4C8]/20 to-[#E8B4C8]/5",
  3: "from-[#F2C4A8]/20 to-[#F2C4A8]/5",
};

const ACCENT_COLOURS: Record<number, string> = {
  1: "bg-ep1",
  2: "bg-ep2",
  3: "bg-ep3",
};

export function EpisodeHeader({ episode }: Props) {
  return (
    <div className={`bg-gradient-to-b ${BG_COLOURS[episode.number]} py-10 px-4 sm:px-6`}>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-1 h-8 rounded-full ${ACCENT_COLOURS[episode.number]}`} />
          <span className="text-xs font-semibold tracking-[0.15em] uppercase text-navy/50">
            Episode {episode.number}
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-navy tracking-tight mb-2">
          {episode.title}
        </h1>
        <p className="text-sm font-medium text-navy/60 uppercase tracking-wide mb-4">
          {episode.subtitle}
        </p>
        <p className="text-base text-navy/80 leading-relaxed max-w-2xl">
          {episode.description}
        </p>
      </div>
    </div>
  );
}
