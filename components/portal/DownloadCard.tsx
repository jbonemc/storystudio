import { Download } from "lucide-react";
import type { EpisodeDownload } from "@/lib/episodes/data";

interface Props {
  download: EpisodeDownload;
}

export function DownloadCard({ download }: Props) {
  return (
    <a
      href={download.href}
      download={download.filename}
      className="flex items-center gap-4 bg-gray-50 rounded-lg border border-gray-100 p-4 hover:bg-gray-100 hover:border-gray-200 transition-colors"
    >
      <div className="w-9 h-9 rounded-lg bg-navy/5 flex items-center justify-center shrink-0">
        <Download className="w-4 h-4 text-navy/60" />
      </div>
      <div>
        <h4 className="text-sm font-medium text-navy">{download.title}</h4>
        <p className="text-xs text-gray-400 mt-0.5">{download.description}</p>
      </div>
    </a>
  );
}
