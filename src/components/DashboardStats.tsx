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
  BarChart3,
  BookOpen,
  GraduationCap,
  Layers,
  Library,
} from "lucide-react";

interface DashboardStatsProps {
  worksheets: Worksheet[];
  selectedClass?: string;
  onGradeClick: (className: string) => void;
}

export default function DashboardStats({
  worksheets,
  selectedClass,
  onGradeClick,
}: DashboardStatsProps) {
  const totalResources =
    worksheets.length;

  const totalSchoolClasses =
    ALL_SCHOOL_CLASSES.length;

  const activeClassesCount =
    useMemo(() => {
      const classSet =
        new Set<string>();

      worksheets.forEach((w) => {
        parseClassesFromGrade(
          w.grade,
        ).forEach((c) =>
          classSet.add(c),
        );
      });

      return classSet.size;
    }, [worksheets]);

  const totalSubjectsCount =
    useMemo(() => {
      const set =
        new Set<string>();

      worksheets.forEach((w) => {
        const subject =
          normalizeSubject(
            w.subject,
          );

        if (subject) {
          set.add(
            subject.toLowerCase(),
          );
        }
      });

      return set.size;
    }, [worksheets]);

  const totalTopicsCount =
    useMemo(() => {
      const set =
        new Set<string>();

      worksheets.forEach((w) => {
        const topic =
          normalizeTopic(
            w.topic,
          );

        if (topic) {
          set.add(
            topic.toLowerCase(),
          );
        }
      });

      return set.size;
    }, [worksheets]);

  const totalChaptersCount =
    useMemo(() => {
      const set =
        new Set<string>();

      worksheets.forEach((w) => {
        const chapter =
          normalizeChapter(
            w.chapter,
          );

        if (chapter) {
          set.add(
            chapter.toLowerCase(),
          );
        }
      });

      return set.size;
    }, [worksheets]);

  return (
    <section
      id="dashboard-stats-container"
      className="space-y-4 border-t border-slate-200/80 pt-8"
      aria-labelledby="bank-stats-title"
    >
      <div className="flex items-center gap-2 px-1">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
          <BarChart3 className="h-4 w-4" />
        </div>

        <div>
          <h2
            id="bank-stats-title"
            className="text-sm font-black text-slate-900"
          >
            Statistik Bank Materi
          </h2>

          <p className="text-[10px] font-medium text-slate-500 sm:text-[11px]">
            Informasi koleksi NEO ILMA untuk yang ingin melihatnya.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs sm:grid-cols-4">
        <div className="flex items-center gap-3 border-b border-r border-slate-200 p-4 sm:border-b-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <div className="font-display text-xl font-black text-slate-950">
              {totalResources.toLocaleString("id-ID")}
            </div>
            <div className="text-[9px] font-black uppercase tracking-wide text-slate-500">
              Materi
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 border-b border-slate-200 p-4 sm:border-b-0 sm:border-r">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <GraduationCap className="h-4 w-4" />
          </div>
          <div>
            <div className="font-display text-xl font-black text-slate-950">
              {activeClassesCount}
              <span className="ml-1 text-xs font-bold text-slate-400">
                /{totalSchoolClasses}
              </span>
            </div>
            <div className="text-[9px] font-black uppercase tracking-wide text-slate-500">
              Kelas
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 border-r border-slate-200 p-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <Library className="h-4 w-4" />
          </div>
          <div>
            <div className="font-display text-xl font-black text-slate-950">
              {totalSubjectsCount}
            </div>
            <div className="text-[9px] font-black uppercase tracking-wide text-slate-500">
              Mapel
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <BookOpen className="h-4 w-4" />
          </div>
          <div>
            <div className="font-display text-xl font-black text-slate-950">
              {totalTopicsCount}
            </div>
            <div className="text-[9px] font-black uppercase tracking-wide text-slate-500">
              Topik
              <span className="ml-1 font-medium normal-case text-slate-400">
                · {totalChaptersCount} Bab
              </span>
            </div>
          </div>
        </div>
      </div>

      <BrowseByProgram
        worksheets={worksheets}
        selectedClass={selectedClass}
        onSelectClass={onGradeClick}
      />
    </section>
  );
}
