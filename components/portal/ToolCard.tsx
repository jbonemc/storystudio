import Link from "next/link";
import {
  Lightbulb,
  BarChart3,
  BookOpen,
  RefreshCw,
  Target,
  Mic,
} from "lucide-react";
import type { EpisodeTool } from "@/lib/episodes/data";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Lightbulb,
  BarChart3,
  BookOpen,
  RefreshCw,
  Target,
  Mic,
};

interface Props {
  tool: EpisodeTool;
  accentColour: string;
}

export function ToolCard({ tool, accentColour }: Props) {
  const Icon = ICONS[tool.icon] || Lightbulb;

  return (
    <Link
      href={tool.href}
      className="group block bg-white rounded-lg border border-gray-200 p-5 hover:border-navy/30 hover:shadow-md transition-all"
    >
      <div className="flex items-start gap-4">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: accentColour + "33" }}
        >
          <Icon className="w-5 h-5 text-navy" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-navy group-hover:text-navy/80 transition-colors">
            {tool.title}
          </h3>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">
            {tool.description}
          </p>
        </div>
      </div>
    </Link>
  );
}
