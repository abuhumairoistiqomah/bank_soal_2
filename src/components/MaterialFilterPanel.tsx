import React from "react";
import {
  BookOpen,
  FileText,
  Layers,
  RotateCcw,
} from "lucide-react";
import type {
  OptionWithCount,
} from "../utils/resourceFilters";

interface MaterialFilterPanelProps {
  chapter: string;
  topic: string;
  type: string;
  chapterData: {
    list: OptionWithCount[];
    total: number;
  };
  topicData: {
    list: OptionWithCount[];
    total: number;
  };
  typeData: {
    list: OptionWithCount[];
    total: number;
  };
  onChapterChange: (chapter: string) => void;
  onTopicChange: (topic: string) => void;
  onTypeChange: (type: string) => void;
  onReset: () => void;
}

export default function MaterialFilterPanel({
  chapter,
  topic,
  type,
  chapterData,
  topicData,
  typeData,
  onChapterChange,
  onTopicChange,
  onTypeChange,
  onReset,
}: MaterialFilterPanelProps) {
  const chapterSelected =
    chapter !== "All" &&
    chapter !== "";

  const topicSelected =
    chapterSelected &&
    topic !== "All" &&
    topic !== "";

  const activeCount = [
    chapterSelected,
    topicSelected,
    type !== "All" &&
      type !== "",
  ].filter(Boolean).length;

  return (
    <div
      id="material-filter-panel"
      className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
            Saring Materi
          </h3>
          <p className="mt-0.5 text-[10px] font-medium text-slate-500 sm:text-[11px]">
            Gunakan bila Abu wa Ummu ingin mencari bab, topik, atau jenis file tertentu.
          </p>
        </div>

        {activeCount > 0 && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex min-h-[38px] cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold text-slate-600 transition-colors hover:bg-slate-100"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset ({activeCount})
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <label className="space-y-1.5">
          <span className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wide text-slate-700">
            <BookOpen className="h-3.5 w-3.5 text-blue-600" />
            Bab
          </span>

          <select
            value={chapter}
            onChange={(event) =>
              onChapterChange(
                event.target.value,
              )
            }
            className="min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs font-bold text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="All">
              Semua Bab ({chapterData.total})
            </option>
            {chapterData.list.map(
              (item) => (
                <option
                  key={item.name}
                  value={item.name}
                >
                  {item.name} ({item.count})
                </option>
              ),
            )}
          </select>
        </label>

        <label className="space-y-1.5">
          <span
            className={[
              "flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wide",
              chapterSelected
                ? "text-slate-700"
                : "text-slate-400",
            ].join(" ")}
          >
            <Layers className="h-3.5 w-3.5" />
            Topik / Sub-Bab
          </span>

          <select
            value={topic}
            disabled={!chapterSelected}
            onChange={(event) =>
              onTopicChange(
                event.target.value,
              )
            }
            className="min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs font-bold text-slate-800 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="All">
              {chapterSelected
                ? `Semua Topik (${topicData.total})`
                : "Pilih Bab terlebih dahulu"}
            </option>
            {topicData.list.map(
              (item) => (
                <option
                  key={item.name}
                  value={item.name}
                >
                  {item.name} ({item.count})
                </option>
              ),
            )}
          </select>
        </label>

        <label className="space-y-1.5">
          <span
            className={[
              "flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wide",
              topicSelected
                ? "text-slate-700"
                : "text-slate-400",
            ].join(" ")}
          >
            <FileText className="h-3.5 w-3.5" />
            Jenis File
          </span>

          <select
            value={type}
            disabled={!topicSelected}
            onChange={(event) =>
              onTypeChange(
                event.target.value,
              )
            }
            className="min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs font-bold text-slate-800 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="All">
              {topicSelected
                ? `Semua Jenis (${typeData.total})`
                : "Pilih Topik terlebih dahulu"}
            </option>
            {typeData.list.map(
              (item) => (
                <option
                  key={item.name}
                  value={item.name}
                >
                  {item.name} ({item.count})
                </option>
              ),
            )}
          </select>
        </label>
      </div>
    </div>
  );
}
