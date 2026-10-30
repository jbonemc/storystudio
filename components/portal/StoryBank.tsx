"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bookmark, Copy, Check, Download, Trash2, Loader2 } from "lucide-react";
import { listSaved, deleteSaved, toAIError, type AIRequestError, type SavedItem } from "@/lib/aiClient";
import { AIErrorNotice } from "@/components/portal/AIErrorNotice";
import { TOOL_LABELS, savedItemText } from "@/lib/savedText";

function download(filename: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const date = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IE", { day: "numeric", month: "short", year: "numeric" });

export function StoryBank() {
  const [items, setItems] = useState<SavedItem[] | null>(null);
  const [error, setError] = useState<AIRequestError | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setItems(await listSaved());
    } catch (err) {
      setError(toAIError(err));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const groups = useMemo(() => {
    const g = new Map<string, SavedItem[]>();
    (items || []).forEach((it) => g.set(it.tool, [...(g.get(it.tool) || []), it]));
    return [...g.entries()];
  }, [items]);

  const handleCopy = async (it: SavedItem) => {
    await navigator.clipboard.writeText(`${it.title}\n\n${savedItemText(it.tool, it.data)}`);
    setCopied(it.id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDelete = async (it: SavedItem) => {
    if (!window.confirm(`Delete "${it.title}" from your Story Bank? This cannot be undone.`)) return;
    setDeleting(it.id);
    try {
      await deleteSaved(it.id);
      setItems((prev) => (prev || []).filter((x) => x.id !== it.id));
    } catch (err) {
      setError(toAIError(err));
    } finally {
      setDeleting(null);
    }
  };

  const downloadAll = () => {
    const text = (items || [])
      .map((it) => `${TOOL_LABELS[it.tool] || it.tool}: ${it.title} (${date(it.updated_at)})\n${"-".repeat(40)}\n${savedItemText(it.tool, it.data)}`)
      .join("\n\n\n");
    download("story-bank.txt", `MY STORY BANK\nStory Studio, storystudio.ie\n\n${text}\n`);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-navy/10 flex items-center justify-center">
              <Bookmark className="w-4 h-4 text-navy" />
            </div>
            <h1 className="text-2xl font-bold text-navy">My Story Bank</h1>
          </div>
          <p className="text-sm text-gray-500 leading-relaxed max-w-xl">
            Everything you have saved from the tools: your plans, metaphors, stories and practice
            sessions. &ldquo;Note down good lines when you hear them.&rdquo; This is where they live.
          </p>
        </div>
        {items && items.length > 0 && (
          <button
            type="button"
            onClick={downloadAll}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-navy border border-gray-200 hover:border-navy/40 rounded-md px-3 py-2"
          >
            <Download className="w-4 h-4" /> Download everything
          </button>
        )}
      </div>

      {error && <AIErrorNotice error={error} onRetry={load} />}

      {!items && !error && (
        <p className="text-sm text-gray-500 inline-flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading your saved work...
        </p>
      )}

      {items && items.length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-300 p-6 text-sm text-gray-600">
          Nothing saved yet. Use the <strong>Save to Story Bank</strong> button in any tool, or start
          with the{" "}
          <Link href="/episode/3-audience/content-tool" className="underline underline-offset-2 text-navy">
            Content Tool
          </Link>
          , which saves your plan as you go.
        </div>
      )}

      {groups.map(([tool, list]) => (
        <section key={tool} className="space-y-2">
          <h2 className="text-sm font-semibold text-navy">
            {TOOL_LABELS[tool] || tool} <span className="text-gray-400 font-normal">({list.length})</span>
          </h2>
          {list.map((it) => {
            const isOpen = open === it.id;
            return (
              <div key={it.id} className="rounded-lg border border-gray-200 bg-white">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : it.id)}
                  className="w-full text-left px-4 py-3 flex items-center justify-between gap-3"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm font-medium text-navy line-clamp-1">{it.title}</span>
                  <span className="text-xs text-gray-400 shrink-0">{date(it.updated_at)}</span>
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 space-y-3">
                    <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-md p-3">
                      {savedItemText(it.tool, it.data)}
                    </pre>
                    <div className="flex gap-2 flex-wrap">
                      {it.tool === "content-tool" && (
                        <Link
                          href={`/episode/3-audience/content-tool?plan=${it.id}`}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-white bg-navy rounded-md px-2.5 py-1.5"
                        >
                          Open in Content Tool
                        </Link>
                      )}
                      <button type="button" onClick={() => handleCopy(it)} className="inline-flex items-center gap-1.5 text-xs font-medium text-navy/70 hover:text-navy border border-gray-200 rounded-md px-2.5 py-1.5">
                        {copied === it.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied === it.id ? "Copied" : "Copy"}
                      </button>
                      <button
                        type="button"
                        onClick={() => download(`${it.title.slice(0, 40).replace(/[^\w ]+/g, "").trim() || "story-bank-item"}.txt`, `${it.title}\n\n${savedItemText(it.tool, it.data)}\n`)}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-navy/70 hover:text-navy border border-gray-200 rounded-md px-2.5 py-1.5"
                      >
                        <Download className="w-3.5 h-3.5" /> Download
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(it)}
                        disabled={deleting === it.id}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-red-700/80 hover:text-red-700 border border-gray-200 rounded-md px-2.5 py-1.5 disabled:opacity-60"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> {deleting === it.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </section>
      ))}
    </div>
  );
}
