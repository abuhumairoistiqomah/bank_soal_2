import React from "react";
import { Filter, X, RotateCcw } from "lucide-react";

interface ActiveFilterBreadcrumbProps {
  filters: {
    class: string;
    subject: string;
    chapter: string;
    topic: string;
    type: string;
  };
  searchQuery: string;
  onClearClass: () => void;
  onClearSubject: () => void;
  onClearChapter: () => void;
  onClearTopic: () => void;
  onClearType: () => void;
  onClearSearch: () => void;
  onResetAll: () => void;
}

export default function ActiveFilterBreadcrumb({
  filters,
  searchQuery,
  onClearClass,
  onClearSubject,
  onClearChapter,
  onClearTopic,
  onClearType,
  onClearSearch,
  onResetAll,
}: ActiveFilterBreadcrumbProps) {
  const isClassSelected = filters.class !== "All" && filters.class !== "";
  const isSubjectSelected = filters.subject !== "All" && filters.subject !== "";
  const isChapterSelected = filters.chapter !== "All" && filters.chapter !== "";
  const isTopicSelected = filters.topic !== "All" && filters.topic !== "";
  const isTypeSelected = filters.type !== "All" && filters.type !== "";
  const isSearchActive = searchQuery.trim() !== "";

  const hasActiveFilters =
    isClassSelected ||
    isSubjectSelected ||
    isChapterSelected ||
    isTopicSelected ||
    isTypeSelected ||
    isSearchActive;

  if (!hasActiveFilters) return null;

  return (
    <div
      id="active-filters-bar"
      className="flex flex-wrap items-center gap-2 rounded-2xl bg-slate-50 border border-slate-200/80 p-3 text-xs"
      role="region"
      aria-label="Filter aktif"
    >
      <div className="flex items-center gap-1.5 font-bold text-slate-500 mr-1 shrink-0">
        <Filter className="h-3.5 w-3.5 text-blue-600" />
        <span>Active:</span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 flex-1">
        {/* Class Chip */}
        {isClassSelected && (
          <span className="inline-flex items-center gap-1 rounded-xl bg-blue-50 border border-blue-200 px-2.5 py-1 text-xs font-bold text-blue-800 shadow-3xs">
            <span>Kelas {filters.class}</span>
            <button
              type="button"
              aria-label={`Hapus filter Kelas ${filters.class}`}
              onClick={onClearClass}
              className="ml-0.5 rounded-full p-0.5 text-blue-400 hover:bg-blue-100 hover:text-blue-700 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
              title={`Hapus filter Kelas ${filters.class}`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        )}

        {/* Subject Chip */}
        {isSubjectSelected && (
          <span className="inline-flex items-center gap-1 rounded-xl bg-blue-50 border border-blue-200 px-2.5 py-1 text-xs font-bold text-blue-800 shadow-3xs">
            <span>{filters.subject}</span>
            <button
              type="button"
              aria-label={`Hapus filter Mata Pelajaran ${filters.subject}`}
              onClick={onClearSubject}
              className="ml-0.5 rounded-full p-0.5 text-blue-400 hover:bg-blue-100 hover:text-blue-700 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
              title={`Hapus filter Mapel ${filters.subject}`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        )}

        {/* Chapter Chip */}
        {isChapterSelected && (
          <span className="inline-flex items-center gap-1 rounded-xl bg-blue-50 border border-blue-200 px-2.5 py-1 text-xs font-bold text-blue-800 shadow-3xs max-w-[200px]">
            <span className="truncate">{filters.chapter}</span>
            <button
              type="button"
              aria-label={`Hapus filter Bab ${filters.chapter}`}
              onClick={onClearChapter}
              className="ml-0.5 rounded-full p-0.5 text-blue-400 hover:bg-blue-100 hover:text-blue-700 transition-colors cursor-pointer shrink-0 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
              title={`Hapus filter Bab ${filters.chapter}`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        )}

        {/* Topic Chip */}
        {isTopicSelected && (
          <span className="inline-flex items-center gap-1 rounded-xl bg-indigo-50 border border-indigo-200 px-2.5 py-1 text-xs font-bold text-indigo-800 shadow-3xs max-w-[200px]">
            <span className="truncate">{filters.topic}</span>
            <button
              type="button"
              aria-label={`Hapus filter Sub-Bab ${filters.topic}`}
              onClick={onClearTopic}
              className="ml-0.5 rounded-full p-0.5 text-indigo-400 hover:bg-indigo-100 hover:text-indigo-700 transition-colors cursor-pointer shrink-0 focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:outline-none"
              title={`Hapus filter Sub-Bab ${filters.topic}`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        )}

        {/* File Type Chip */}
        {isTypeSelected && (
          <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-bold text-emerald-800 shadow-3xs">
            <span>{filters.type}</span>
            <button
              type="button"
              aria-label={`Hapus filter Jenis File ${filters.type}`}
              onClick={onClearType}
              className="ml-0.5 rounded-full p-0.5 text-emerald-400 hover:bg-emerald-100 hover:text-emerald-700 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-none"
              title={`Hapus filter Jenis File ${filters.type}`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        )}

        {/* Search Query Chip */}
        {isSearchActive && (
          <span className="inline-flex items-center gap-1 rounded-xl bg-amber-50 border border-amber-200 px-2.5 py-1 text-xs font-bold text-amber-800 shadow-3xs">
            <span className="italic">"{searchQuery}"</span>
            <button
              type="button"
              aria-label="Hapus filter pencarian kata kunci"
              onClick={onClearSearch}
              className="ml-0.5 rounded-full p-0.5 text-amber-400 hover:bg-amber-100 hover:text-amber-700 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:outline-none"
              title="Hapus kata kunci pencarian"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        )}
      </div>

      {/* Clear All Action */}
      <button
        type="button"
        id="btn-reset-all-chips"
        aria-label="Reset semua filter ke kondisi awal"
        onClick={onResetAll}
        className="ml-auto inline-flex items-center gap-1.5 rounded-xl bg-white border border-slate-300 hover:border-slate-400 hover:bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 transition-all cursor-pointer shadow-3xs active:scale-97 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
        title="Reset semua filter ke kondisi awal"
      >
        <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
        <span>Clear All</span>
      </button>
    </div>
  );
}
