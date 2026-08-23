import React, { useMemo } from "react";
import { Worksheet, ALL_SCHOOL_CLASSES } from "../types";
import {
  normalizeGrade,
  normalizeSubject,
  normalizeTopic,
  normalizeChapter,
  parseClassesFromGrade,
} from "../utils/resourceFilters";
import BrowseByProgram from "./BrowseByProgram";
import {
  FileText,
  Sparkles,
  Library,
  GraduationCap,
  BookOpen,
  Gamepad,
  Layers,
  CheckCircle2,
} from "lucide-react";

interface DashboardStatsProps {
  worksheets: Worksheet[];
  selectedClass?: string;
  onGradeClick: (className: string) => void;
  onSubjectClick?: (subject: string) => void;
}

export default function DashboardStats({
  worksheets,
  selectedClass,
  onGradeClick,
  onSubjectClick,
}: DashboardStatsProps) {
  // ============================================================
  // TOP-LEVEL DYNAMIC STATISTICS (RULE 19 & RULE 20)
  // Strictly calculated from actual database data
  // ============================================================
  const totalResources = worksheets.length;
  const totalSchoolClasses = ALL_SCHOOL_CLASSES.length; // 24

  // Active classes with worksheets
  const activeClasses = useMemo(() => {
    const classSet = new Set<string>();
    worksheets.forEach((w) => {
      const classes = parseClassesFromGrade(w.grade);
      classes.forEach((c) => classSet.add(c));
    });
    return Array.from(classSet);
  }, [worksheets]);

  const activeClassesCount = activeClasses.length;

  // Dynamic Subjects (Rule 8 & 19): unique(subjects) from database, deduplicated case-insensitively
  const uniqueSubjectsList = useMemo(() => {
    const map = new Map<string, { display: string; count: number }>();
    worksheets.forEach((w) => {
      const s = normalizeSubject(w.subject);
      if (s) {
        const key = s.toLowerCase();
        const existing = map.get(key);
        if (existing) {
          existing.count += 1;
          if (s !== s.toLowerCase() && existing.display === existing.display.toLowerCase()) {
            existing.display = s;
          }
        } else {
          map.set(key, { display: s, count: 1 });
        }
      }
    });
    return Array.from(map.values())
      .map(({ display, count }) => ({ name: display, count }))
      .sort((a, b) => a.name.localeCompare(b.name, "id", { numeric: true }));
  }, [worksheets]);

  const totalSubjectsCount = uniqueSubjectsList.length;

  // Dynamic Topics (Rule 19): unique(topics) from database, deduplicated case-insensitively
  const totalTopicsCount = useMemo(() => {
    const topicSet = new Set<string>();
    worksheets.forEach((w) => {
      const t = normalizeTopic(w.topic);
      if (t) topicSet.add(t.toLowerCase());
    });
    return topicSet.size;
  }, [worksheets]);

  // Dynamic Chapters count, deduplicated case-insensitively
  const totalChaptersCount = useMemo(() => {
    const chapSet = new Set<string>();
    worksheets.forEach((w) => {
      const c = normalizeChapter(w.chapter);
      if (c) chapSet.add(c.toLowerCase());
    });
    return chapSet.size;
  }, [worksheets]);

  return (
    <div id="dashboard-stats-container" className="space-y-8">
      
      {/* =========================================================
          HERO / SUMMARY (RULE 20)
          Resources for all classes and subjects
          [Total Resources] [Classes] [Subjects] [Topics]
         ========================================================= */}
      <div
        id="dashboard-hero-banner"
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 p-6 sm:p-8 text-white shadow-xl"
      >
        <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-blue-500/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-80 w-80 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />

        <div className="relative space-y-2.5 max-w-2xl z-10">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1 text-xs font-semibold tracking-wider text-blue-200 border border-white/10 backdrop-blur-xs">
            <Sparkles className="h-3.5 w-3.5 text-blue-400" />
            <span>School-Wide Learning Resource Bank</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
            Resources for all classes and subjects
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
            Pusat lembar kerja, materi ajar, dan kuis digital terintegrasi untuk seluruh jenjang sekolah (Inter, AE, MQ) dengan pencarian dan filter bertingkat instan.
          </p>
        </div>
      </div>

      {/* 4 TOP-LEVEL SUMMARY METRICS (RULE 20: [Total Resources] [Classes] [Subjects] [Topics]) */}
      <div 
        id="top-level-stats-grid"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5"
      >
        {/* Metric 1: Total Resources */}
        <div 
          id="stat-card-resources"
          className="group relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:border-blue-300 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Resources
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-display text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {totalResources.toLocaleString()}
            </div>
            <p className="text-[11px] font-medium text-slate-500 mt-1">
              Lembar kerja & materi terdata
            </p>
          </div>
        </div>

        {/* Metric 2: Classes */}
        <div 
          id="stat-card-classes"
          className="group relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:border-indigo-300 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Classes
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <GraduationCap className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1.5">
              <span className="font-display text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {activeClassesCount}
              </span>
              <span className="text-xs font-bold text-slate-400">
                / {totalSchoolClasses} Classes
              </span>
            </div>
            <div className="flex items-center gap-1 mt-1 text-[11px] font-medium text-indigo-700">
              <CheckCircle2 className="h-3 w-3" />
              <span>{activeClassesCount} Active Classes</span>
            </div>
          </div>
        </div>

        {/* Metric 3: Subjects */}
        <div 
          id="stat-card-subjects"
          className="group relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:border-emerald-300 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Subjects
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Library className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-display text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {totalSubjectsCount}
            </div>
            <p className="text-[11px] font-medium text-slate-500 mt-1">
              Mata pelajaran terdeteksi
            </p>
          </div>
        </div>

        {/* Metric 4: Topics */}
        <div 
          id="stat-card-topics"
          className="group relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:border-amber-300 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Topics
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <BookOpen className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-display text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {totalTopicsCount}
            </div>
            <p className="text-[11px] font-medium text-slate-500 mt-1">
              Sub-Bab dalam {totalChaptersCount} Bab
            </p>
          </div>
        </div>
      </div>

      {/* =========================================================
          BROWSE BY PROGRAM (RULE 20 & 22)
          INTER: 1 2 3 4 5 6
          AE: 7 8 9 10 11 12
          MQ: 1 2 3 4 5 / 7 8 9 10 11 12
         ========================================================= */}
      <BrowseByProgram 
        worksheets={worksheets}
        selectedClass={selectedClass}
        onSelectClass={onGradeClick}
      />
    </div>
  );
}
