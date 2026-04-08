import type { CoreIdea } from "@/lib/episodes/data";

interface Props {
  idea: CoreIdea;
  index: number;
  accentColour: string;
}

export function CoreIdeaCard({ idea, index, accentColour }: Props) {
  return (
    <div className="bg-white rounded-lg border border-gray-100 p-5">
      <div className="flex items-start gap-3">
        <span
          className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-navy shrink-0 mt-0.5"
          style={{ backgroundColor: accentColour + "44" }}
        >
          {index + 1}
        </span>
        <div>
          <h3 className="text-sm font-semibold text-navy">{idea.title}</h3>
          <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">
            {idea.description}
          </p>
        </div>
      </div>
    </div>
  );
}
