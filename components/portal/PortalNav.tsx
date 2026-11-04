"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { episodes } from "@/lib/episodes/data";
import { Bookmark } from "lucide-react";

const EPISODE_COLOURS: Record<number, string> = {
  1: "bg-ep1",
  2: "bg-ep2",
  3: "bg-ep3",
};

export function PortalNav() {
  const pathname = usePathname();

  return (
    <header className="bg-navy text-white sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between gap-3 h-16">
          <Link href="/" className="flex items-center shrink min-w-0" aria-label="Story Studio home">
            {/* Official logo (white text version for the navy bar). Phones keep it
                smaller so the episode links still fit beside it. */}
            <Image
              src="/brand/story-studio-logo-white.png"
              alt="Story Studio"
              width={1189}
              height={128}
              priority
              className="h-[18px] sm:h-9 w-auto max-w-full"
            />
          </Link>

          <nav className="flex items-center gap-1">
            {episodes.map((ep) => {
              const isActive = pathname.includes(ep.slug);
              return (
                <Link
                  key={ep.slug}
                  href={`/episode/${ep.slug}`}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-white/15 text-white"
                      : "text-white/60 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${EPISODE_COLOURS[ep.number]}`}
                  />
                  <span className="hidden sm:inline">{ep.title}</span>
                  <span className="sm:hidden">{ep.number}</span>
                </Link>
              );
            })}
            <Link
              href="/story-bank"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                pathname.startsWith("/story-bank")
                  ? "bg-white/15 text-white"
                  : "text-white/60 hover:text-white hover:bg-white/10"
              }`}
            >
              <Bookmark className="w-3 h-3" />
              <span className="hidden sm:inline">Story Bank</span>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
