import React from "react";
import { BookOpen, RotateCcw } from "lucide-react";

interface EmptyStateProps {
  onReset: () => void;
  message?: string;
  hasActiveFilters?: boolean;
}

export default function EmptyState({
  onReset,
  message,
  hasActiveFilters = true,
}: EmptyStateProps) {
  return (
    <div
      id="resource-empty-state"
      className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white p-8 sm:p-12 text-center"
      role="status"
      aria-live="polite"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-inner mb-4">
        <BookOpen className="h-7 w-7 text-blue-500" />
      </div>

      <h3 className="font-display text-lg sm:text-xl font-black text-slate-900 mb-1.5">
        Tidak Ada Sumber Belajar Ditemukan
      </h3>

      <p className="max-w-md text-xs sm:text-sm text-slate-500 font-medium mb-6 leading-relaxed">
        {message ||
          "Tidak ada sumber belajar yang cocok dengan filter atau kata kunci saat ini. Coba ubah jenjang kelas, bab, mata pelajaran, atau reset filter."}
      </p>

      {hasActiveFilters && (
        <button
          type="button"
          id="btn-empty-state-reset"
          onClick={onReset}
          aria-label="Reset semua filter pencarian"
          className="inline-flex items-center gap-2 min-h-[44px] rounded-xl bg-blue-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-blue-700 transition-all shadow-md shadow-blue-100 cursor-pointer active:scale-98 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Reset Filters</span>
        </button>
      )}
    </div>
  );
}
