"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { episodes } from "@/lib/episodes/data";

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
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="flex gap-1">
              <div className="w-3 h-4 bg-ep1 rounded-sm -rotate-6" />
              <div className="w-3 h-4 bg-ep2 rounded-sm -rotate-6" />
              <div className="w-3 h-4 bg-ep3 rounded-sm -rotate-6" />
            </div>
            <span className="text-sm font-bold tracking-[0.2em] uppercase">
              Story Studio
            </span>
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
          </nav>
        </div>
      </div>
    </header>
  );
}
