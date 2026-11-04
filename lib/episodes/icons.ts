import {
  Lightbulb, BarChart3, BookOpen, RefreshCw, Target, Mic, FlipHorizontal, Megaphone, Compass, MessagesSquare,
} from "lucide-react";

// Maps the icon names used in lib/episodes/data.ts to their components.
export const TOOL_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Lightbulb, BarChart3, BookOpen, RefreshCw, Target, Mic, FlipHorizontal, Megaphone, Compass, MessagesSquare,
};

export const FallbackToolIcon = Lightbulb;
