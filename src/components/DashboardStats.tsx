import React, { useMemo } from "react";
import {
  Worksheet,
  ALL_SCHOOL_CLASSES,
} from "../types";
import {
  normalizeSubject,
  normalizeTopic,
  normalizeChapter,
  parseClassesFromGrade,
} from "../utils/resourceFilters";
import BrowseByProgram from "./BrowseByProgram";
import {
  Sparkles,
  Library,
  GraduationCap,
  BookOpen,
  Layers,
  CheckCircle2,
  Clock3,
  RefreshCw,
} from "lucide-react";

interface DashboardStatsProps {
  worksheets: Worksheet[];
  selectedClass?: string;
  onGradeClick: (className: string) => void;
  onSubjectClick?: (subject: string) => void;
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
  return date.toLocaleTimeString(
    "id-ID",
    {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    },
  ).replace(/\./g, ":");
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

function isCurrentLocalHour(
  timestamp?: number | null,
): boolean {
  if (!timestamp) return false;

  const updated = new Date(timestamp);
  const now = new Date();

  return (
    updated.getFullYear() === now.getFullYear() &&
    updated.getMonth() === now.getMonth() &&
    updated.getDate() === now.getDate() &&
    updated.getHours() === now.getHours()
  );
}

export default function DashboardStats({
  worksheets,
  selectedClass,
  onGradeClick,
  lastUpdatedAt,
  isRefreshing = false,
}: DashboardStatsProps) {
  const totalResources =
    worksheets.length;

  const totalSchoolClasses =
    ALL_SCHOOL_CLASSES.length;

  const activeClasses =
    useMemo(() => {
      const classSet =
        new Set<string>();

      worksheets.forEach((w) => {
        const classes =
          parseClassesFromGrade(
            w.grade,
          );

        classes.forEach((c) =>
          classSet.add(c),
        );
      });

      return Array.from(classSet);
    }, [worksheets]);

  const activeClassesCount =
    activeClasses.length;

  const uniqueSubjectsList =
    useMemo(() => {
      const map =
        new Map<
          string,
          {
            display: string;
            count: number;
          }
        >();

      worksheets.forEach((w) => {
        const subject =
          normalizeSubject(
            w.subject,
          );

        if (!subject) return;

        const key =
          subject.toLowerCase();

        const existing =
          map.get(key);

        if (existing) {
          existing.count += 1;

          if (
            subject !==
              subject.toLowerCase() &&
            existing.display ===
              existing.display.toLowerCase()
          ) {
            existing.display =
              subject;
          }
        } else {
          map.set(key, {
            display: subject,
            count: 1,
          });
        }
      });

      return Array.from(
        map.values(),
      )
        .map(
          ({
            display,
            count,
          }) => ({
            name: display,
            count,
          }),
        )
        .sort((a, b) =>
          a.name.localeCompare(
            b.name,
            "id",
            {
              numeric: true,
            },
          ),
        );
    }, [worksheets]);

  const totalSubjectsCount =
    uniqueSubjectsList.length;

  const totalTopicsCount =
    useMemo(() => {
      const topicSet =
        new Set<string>();

      worksheets.forEach((w) => {
        const topic =
          normalizeTopic(
            w.topic,
          );

        if (topic) {
          topicSet.add(
            topic.toLowerCase(),
          );
        }
      });

      return topicSet.size;
    }, [worksheets]);

  const totalChaptersCount =
    useMemo(() => {
      const chapterSet =
        new Set<string>();

      worksheets.forEach((w) => {
        const chapter =
          normalizeChapter(
            w.chapter,
          );

        if (chapter) {
          chapterSet.add(
            chapter.toLowerCase(),
          );
        }
      });

      return chapterSet.size;
    }, [worksheets]);

  const updateIsFresh =
    isCurrentLocalHour(
      lastUpdatedAt,
    );

  const updateLabel =
    formatLastUpdated(
      lastUpdatedAt,
    );

  return (
    <div
      id="dashboard-stats-container"
      className="space-y-4"
    >
      {/* =====================================================
          HERO
         ===================================================== */}
      <div
        id="dashboard-hero-banner"
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 p-6 text-white shadow-xl sm:p-8"
      >
        <div className="pointer-events-none absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-blue-500/15 blur-3xl" />

        <div className="pointer-events-none absolute bottom-0 left-0 -mb-20 -ml-20 h-80 w-80 rounded-full bg-indigo-500/15 blur-3xl" />

        <div className="relative z-10 max-w-2xl space-y-2.5">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-3.5 py-1 text-xs font-semibold tracking-wider text-blue-200 backdrop-blur-xs">
            <Sparkles className="h-3.5 w-3.5 text-blue-400" />

            <span>
              School-Wide Learning Resource Bank
            </span>
          </div>

          <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl">
            Resources for all classes and subjects
          </h1>

          <p className="text-xs font-normal leading-relaxed text-slate-300 sm:text-sm">
            Pusat lembar kerja, materi ajar, dan kuis digital terintegrasi untuk seluruh jenjang sekolah (Inter, AE, MQ) dengan pencarian dan filter bertingkat instan.
          </p>
        </div>
      </div>

      {/* =====================================================
          ULTRA-COMPACT STATS
          Row 1: Total resources + last update
          Row 2: Classes | Subjects | Topics
         ===================================================== */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
        {/* Main resource row */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
              <Layers className="h-4 w-4" />
            </div>

            <div className="flex min-w-0 items-baseline gap-2.5">
              <span className="font-display text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                {totalResources.toLocaleString("id-ID")}
              </span>

              <span className="truncate text-[11px] font-semibold text-slate-500 sm:text-xs">
                Worksheets & learning materials
              </span>
            </div>
          </div>

          <div
            className={[
              "flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-right",
              isRefreshing
                ? "bg-blue-50 text-blue-700"
                : updateIsFresh
                  ? "bg-emerald-50 text-emerald-700"
                  : lastUpdatedAt
                    ? "bg-amber-50 text-amber-700"
                    : "bg-slate-50 text-slate-500",
            ].join(" ")}
          >
            {isRefreshing ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Clock3 className="h-3.5 w-3.5" />
            )}

            <div className="leading-tight">
              <p className="hidden text-[8px] font-extrabold uppercase tracking-wider opacity-70 sm:block">
                {isRefreshing ? "Memperbarui" : "Terakhir diperbarui"}
              </p>

              <p className="whitespace-nowrap text-[10px] font-bold sm:text-[11px]">
                {isRefreshing ? "Updating..." : updateLabel}
              </p>
            </div>
          </div>
        </div>

        {/* Secondary compact strip */}
        <div className="grid grid-cols-3 divide-x divide-slate-200 border-t border-slate-200">
          <div className="flex min-w-0 items-center justify-center gap-2 px-2 py-2.5 sm:px-4">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <GraduationCap className="h-3.5 w-3.5" />
            </div>

            <div className="min-w-0">
              <div className="flex items-baseline gap-1">
                <span className="font-display text-lg font-black tracking-tight text-slate-900 sm:text-xl">
                  {activeClassesCount}
                </span>

                <span className="text-[9px] font-bold text-slate-400 sm:text-[10px]">
                  /{totalSchoolClasses}
                </span>
              </div>

              <p className="truncate text-[9px] font-extrabold uppercase tracking-wide text-slate-600 sm:text-[10px]">
                Classes
              </p>
            </div>
          </div>

          <div className="flex min-w-0 items-center justify-center gap-2 px-2 py-2.5 sm:px-4">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Library className="h-3.5 w-3.5" />
            </div>

            <div className="min-w-0">
              <div className="font-display text-lg font-black tracking-tight text-slate-900 sm:text-xl">
                {totalSubjectsCount}
              </div>

              <p className="truncate text-[9px] font-extrabold uppercase tracking-wide text-slate-600 sm:text-[10px]">
                Subjects
              </p>
            </div>
          </div>

          <div className="flex min-w-0 items-center justify-center gap-2 px-2 py-2.5 sm:px-4">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <BookOpen className="h-3.5 w-3.5" />
            </div>

            <div className="min-w-0">
              <div className="font-display text-lg font-black tracking-tight text-slate-900 sm:text-xl">
                {totalTopicsCount}
              </div>

              <p className="truncate text-[9px] font-extrabold uppercase tracking-wide text-slate-600 sm:text-[10px]">
                Topics
                <span className="ml-1 hidden font-medium normal-case text-slate-400 sm:inline">
                  · {totalChaptersCount} Bab
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          BROWSE BY PROGRAM
          Uses the existing collapsible BrowseByProgram component.
         ===================================================== */}
      <BrowseByProgram
        worksheets={worksheets}
        selectedClass={selectedClass}
        onSelectClass={onGradeClick}
      />
    </div>
  );
}