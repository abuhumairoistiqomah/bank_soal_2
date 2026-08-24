import React, { useEffect, useMemo, useState } from "react";
import { Worksheet, THREE_PROGRAMS, resolveClassName } from "../types";
import { getClassCounts } from "../utils/resourceFilters";
import { GraduationCap, Layers, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";

interface BrowseByProgramProps {
  worksheets: Worksheet[];
  selectedClass?: string;
  onSelectClass: (className: string) => void;
}

const BROWSE_VISIBILITY_KEY = "neo_ilma_browse_program_expanded_v1";

export default function BrowseByProgram({
  worksheets,
  selectedClass,
  onSelectClass,
}: BrowseByProgramProps) {
  // Default collapsed on first visit to save vertical space.
  // The user's last choice is remembered in this browser.
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(BROWSE_VISIBILITY_KEY);
      if (saved !== null) {
        setIsExpanded(saved === "true");
      }
    } catch {
      // Ignore storage errors and keep the safe default: collapsed.
    }
  }, []);

  const toggleExpanded = () => {
    setIsExpanded((current) => {
      const next = !current;

      try {
        window.localStorage.setItem(BROWSE_VISIBILITY_KEY, String(next));
      } catch {
        // UI still works even if storage is unavailable.
      }

      return next;
    });
  };

  // Pre-calculate class counts in a single pass with useMemo (Rule 35: Avoid recalculating large arrays repeatedly)
  const { counts: classCounts } = useMemo(() => {
    return getClassCounts(worksheets);
  }, [worksheets]);

  // Fast O(1) lookup
  const getClassCount = (className: string) => {
    return classCounts[className] || 0;
  };

  // Pre-calculate total worksheet count per program
  const programCounts = useMemo(() => {
    const map: Record<string, number> = {};
    THREE_PROGRAMS.forEach((prog) => {
      map[prog.id] = prog.allClasses.reduce((acc, cls) => acc + (classCounts[cls] || 0), 0);
    });
    return map;
  }, [classCounts]);

  const getProgramCount = (programId: string) => {
    return programCounts[programId] || 0;
  };


  return (
    <section id="browse-by-program-section" className="space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center flex-wrap gap-2">
            <h2 className="font-display text-lg sm:text-xl font-extrabold tracking-tight text-slate-900">
              Browse by Program
            </h2>
            <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-extrabold text-blue-700 border border-blue-100">
              3 Programs • 24 Classes
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Pilih program dan jenjang kelas untuk langsung memfilter bank sumber belajar.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:justify-end">
          {selectedClass && (
            <>
              <span className="text-xs text-slate-500 font-medium">Active:</span>
              <span className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1 text-xs font-bold text-white shadow-xs">
                <GraduationCap className="h-3.5 w-3.5" />
                Kelas {selectedClass}
              </span>
              <button
                type="button"
                onClick={() => onSelectClass("")}
                aria-label="Reset pilihan kelas aktif"
                className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors underline cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none rounded-sm"
              >
                Reset
              </button>
            </>
          )}

          <button
            type="button"
            onClick={toggleExpanded}
            aria-expanded={isExpanded}
            aria-controls="browse-program-cards"
            className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-extrabold text-slate-700 shadow-xs transition-all hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            {isExpanded ? "Sembunyikan Program" : "Tampilkan Program"}
            {isExpanded ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Program cards are collapsed by default to save vertical space. */}
      {isExpanded && (
      <div
        id="browse-program-cards"
        className="grid grid-cols-1 lg:grid-cols-3 gap-5"
      >
        {THREE_PROGRAMS.map((program) => {
          const programTotalFiles = getProgramCount(program.id);
          const isInter = program.id === "INTER";
          const isAe = program.id === "AE";

          // Theme styling per program
          const theme = isInter
            ? {
                cardBorder: "border-blue-200 hover:border-blue-400",
                badgeBg: "bg-blue-50 text-blue-700 border-blue-100",
                accentText: "text-blue-600",
                buttonHover: "hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700",
                buttonActive: "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-100",
                headerGradient: "from-blue-600/10 via-transparent to-transparent",
              }
            : isAe
            ? {
                cardBorder: "border-indigo-200 hover:border-indigo-400",
                badgeBg: "bg-indigo-50 text-indigo-700 border-indigo-100",
                accentText: "text-indigo-600",
                buttonHover: "hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700",
                buttonActive: "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100",
                headerGradient: "from-indigo-600/10 via-transparent to-transparent",
              }
            : {
                cardBorder: "border-emerald-200 hover:border-emerald-400",
                badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-100",
                accentText: "text-emerald-600",
                buttonHover: "hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700",
                buttonActive: "bg-emerald-700 border-emerald-700 text-white shadow-md shadow-emerald-100",
                headerGradient: "from-emerald-600/10 via-transparent to-transparent",
              };

          return (
            <div
              key={program.id}
              id={`program-card-${program.id.toLowerCase()}`}
              className={`relative overflow-hidden rounded-3xl border bg-white p-5 sm:p-6 transition-all duration-200 shadow-xs hover:shadow-md flex flex-col justify-between ${theme.cardBorder}`}
            >
              {/* Subtle decorative glow */}
              <div
                className={`absolute top-0 right-0 left-0 h-24 bg-gradient-to-b ${theme.headerGradient} pointer-events-none`}
              />

              <div className="relative space-y-4">
                {/* Program Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-display text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                        {program.name}
                      </span>
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${theme.badgeBg}`}
                      >
                        {program.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      {program.fullName}
                    </p>
                  </div>

                  <span className="rounded-xl bg-slate-100 border border-slate-200/80 px-2.5 py-1 text-xs font-bold text-slate-700">
                    {programTotalFiles} Files
                  </span>
                </div>

                {/* Interactive Grade Selector Rows (Rule 22: Natural flex wrapping with large touch targets) */}
                <div className="space-y-3.5 pt-2">
                  {program.levelGroups.map((group, groupIdx) => (
                    <div key={groupIdx} className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <span>{group.label}</span>
                        <span className="text-slate-400 font-medium text-[10px]">Pilih Kelas</span>
                      </div>

                      {/* Natural Wrapping Class Buttons (Rule 22 & 34: Semantic buttons, clear aria states & keyboard navigation) */}
                      <div className="flex flex-wrap gap-2" role="group" aria-label={`Pilihan kelas untuk ${group.label}`}>
                        {group.grades.map((gradeNum) => {
                          const fullClassName = resolveClassName(gradeNum, program.id);
                          const count = getClassCount(fullClassName);
                          const isSelected =
                            selectedClass?.trim().toLowerCase() === fullClassName.toLowerCase();

                          return (
                            <button
                              key={gradeNum}
                              id={`btn-class-${fullClassName.toLowerCase().replace(/\s+/g, "-")}`}
                              type="button"
                              aria-label={`Pilih Kelas ${fullClassName}, ${count} sumber belajar`}
                              aria-pressed={isSelected}
                              onClick={() => {
                                onSelectClass(fullClassName);
                                // Scroll smoothly to resource finder
                                const el = document.getElementById("worksheet-list-section");
                                if (el) {
                                  el.scrollIntoView({ behavior: "smooth", block: "start" });
                                }
                              }}
                              className={`group relative flex flex-col items-center justify-center min-w-[48px] min-h-[48px] sm:min-w-[52px] sm:min-h-[52px] px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer select-none active:scale-95 shadow-3xs focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 focus-visible:outline-none ${
                                isSelected
                                  ? `${theme.buttonActive}`
                                  : `bg-slate-50 border-slate-200 text-slate-800 ${theme.buttonHover}`
                              }`}
                            >
                              <span className="font-display text-base font-black leading-none">
                                {gradeNum}
                              </span>
                              <span
                                className={`text-[10px] font-bold mt-1 px-1 rounded-sm leading-tight ${
                                  isSelected
                                    ? "bg-white/20 text-white"
                                    : "text-slate-400 group-hover:text-slate-600"
                                }`}
                              >
                                {count}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Program Card Footer */}
              <div className="relative pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-600">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <Layers className="h-3.5 w-3.5" />
                  {program.totalClasses} Classes
                </span>

                <button
                  type="button"
                  aria-label={`Jelajahi seluruh program ${program.name}`}
                  onClick={() => {
                    onSelectClass(program.allClasses[0]);
                    const el = document.getElementById("worksheet-list-section");
                    if (el) {
                      el.scrollIntoView({ behavior: "smooth", block: "start" });
                    }
                  }}
                  className={`inline-flex items-center gap-1 font-bold ${theme.accentText} hover:underline cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none rounded-md px-1 py-0.5`}
                >
                  <span>Explore {program.name}</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
      )}
    </section>
  );
}