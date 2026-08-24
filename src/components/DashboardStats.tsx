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
      className="space-y-6"
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
          PRIMARY METRIC — TOTAL RESOURCES
          Kept intentionally larger because this number reflects
          the growth/update of the resource bank.
         ===================================================== */}
      <div
        id="stat-card-resources"
        className="relative overflow-hidden rounded-2xl border border-blue-200/90 bg-white px-5 py-4 shadow-xs sm:px-6 sm:py-5"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
                <Layers className="h-4.5 w-4.5" />
              </div>

              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                Total Resources
              </span>
            </div>

            <div className="mt-2 flex items-end gap-3">
              <span className="font-display text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                {totalResources.toLocaleString(
                  "id-ID",
                )}
              </span>

              <span className="pb-1 text-[11px] font-medium text-slate-500 sm:text-xs">
                Worksheets & learning materials
              </span>
            </div>
          </div>

          <div
            className={[
              "flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2",
              isRefreshing
                ? "border-blue-200 bg-blue-50 text-blue-700"
                : updateIsFresh
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : lastUpdatedAt
                    ? "border-amber-200 bg-amber-50 text-amber-700"
                    : "border-slate-200 bg-slate-50 text-slate-500",
            ].join(" ")}
          >
            {isRefreshing ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Clock3 className="h-4 w-4" />
            )}

            <div>
              <p className="text-[9px] font-extrabold uppercase tracking-wider opacity-70">
                {isRefreshing
                  ? "Memperbarui data"
                  : "Terakhir diperbarui"}
              </p>

              <p className="text-[11px] font-bold sm:text-xs">
                {isRefreshing
                  ? "Mengambil data terbaru..."
                  : updateLabel}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          COMPACT SECONDARY METRICS
          Classes / Subjects / Topics in one small strip.
         ===================================================== */}
      <div
        id="secondary-stats-strip"
        className="grid grid-cols-3 divide-x divide-slate-200 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs"
      >
        <div className="min-w-0 px-3 py-3.5 text-center sm:px-5">
          <div className="mx-auto mb-1.5 flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <GraduationCap className="h-3.5 w-3.5" />
          </div>

          <div className="flex items-baseline justify-center gap-1">
            <span className="font-display text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
              {activeClassesCount}
            </span>

            <span className="hidden text-[10px] font-bold text-slate-400 sm:inline">
              / {totalSchoolClasses}
            </span>
          </div>

          <p className="mt-0.5 text-[10px] font-extrabold uppercase tracking-wide text-slate-600 sm:text-[11px]">
            Classes
          </p>

          <div className="mt-1 flex items-center justify-center gap-1 text-[9px] font-medium text-indigo-600 sm:text-[10px]">
            <CheckCircle2 className="hidden h-2.5 w-2.5 sm:block" />
            <span>
              {activeClassesCount} active
            </span>
          </div>
        </div>

        <div className="min-w-0 px-3 py-3.5 text-center sm:px-5">
          <div className="mx-auto mb-1.5 flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <Library className="h-3.5 w-3.5" />
          </div>

          <div className="font-display text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
            {totalSubjectsCount}
          </div>

          <p className="mt-0.5 text-[10px] font-extrabold uppercase tracking-wide text-slate-600 sm:text-[11px]">
            Subjects
          </p>

          <p className="mt-1 truncate text-[9px] font-medium text-slate-400 sm:text-[10px]">
            Mata pelajaran
          </p>
        </div>

        <div className="min-w-0 px-3 py-3.5 text-center sm:px-5">
          <div className="mx-auto mb-1.5 flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <BookOpen className="h-3.5 w-3.5" />
          </div>

          <div className="font-display text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
            {totalTopicsCount}
          </div>

          <p className="mt-0.5 text-[10px] font-extrabold uppercase tracking-wide text-slate-600 sm:text-[11px]">
            Topics
          </p>

          <p className="mt-1 truncate text-[9px] font-medium text-slate-400 sm:text-[10px]">
            {totalChaptersCount} Bab
          </p>
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