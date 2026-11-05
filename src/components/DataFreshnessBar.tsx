import React from "react";
import {
  CheckCircle2,
  Clock3,
  RefreshCw,
} from "lucide-react";

interface DataFreshnessBarProps {
  lastUpdatedAt?: number | null;
  isRefreshing?: boolean;
}

function isSameLocalDay(
  a: Date,
  b: Date,
): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isYesterday(
  date: Date,
  now: Date,
): boolean {
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  return isSameLocalDay(
    date,
    yesterday,
  );
}

function formatClock(
  date: Date,
): string {
  return date
    .toLocaleTimeString(
      "id-ID",
      {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      },
    )
    .replace(/\./g, ":");
}

function formatLastUpdated(
  timestamp?: number | null,
): string {
  if (!timestamp) {
    return "Belum ada pembaruan";
  }

  const date = new Date(timestamp);
  const now = new Date();

  if (isSameLocalDay(date, now)) {
    return `Hari ini, ${formatClock(date)}`;
  }

  if (isYesterday(date, now)) {
    return `Kemarin, ${formatClock(date)}`;
  }

  const datePart =
    date.toLocaleDateString(
      "id-ID",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      },
    );

  return `${datePart}, ${formatClock(date)}`;
}

export default function DataFreshnessBar({
  lastUpdatedAt,
  isRefreshing = false,
}: DataFreshnessBarProps) {
  const updateLabel =
    formatLastUpdated(
      lastUpdatedAt,
    );

  return (
    <div
      id="data-freshness-bar"
      className="flex flex-col gap-2 rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-blue-50 px-4 py-3 shadow-xs sm:flex-row sm:items-center sm:justify-between sm:px-5"
    >
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
          {isRefreshing ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
        </div>

        <div>
          <p className="text-xs font-black text-slate-900">
            {isRefreshing
              ? "Memperbarui data NEO ILMA..."
              : "Data tersambung"}
          </p>

          <p className="mt-0.5 text-[10px] font-medium text-slate-500 sm:text-[11px]">
            Materi akan diperbarui otomatis ketika sumber data berubah.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 pl-10 text-[11px] font-bold text-slate-600 sm:pl-0">
        <Clock3 className="h-3.5 w-3.5 text-slate-400" />
        <span>
          {isRefreshing
            ? "Sedang memperbarui..."
            : `Terakhir diperbarui: ${updateLabel}`}
        </span>
      </div>
    </div>
  );
}
