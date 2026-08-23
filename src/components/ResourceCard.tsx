import React from "react";
import { Worksheet } from "../types";
import {
  normalizeSubject,
  normalizeChapter,
  normalizeTopic,
  normalizeType,
  normalizeCompare,
  getTargetClasses,
} from "../utils/resourceFilters";
import {
  ExternalLink,
  FileText,
  Gamepad,
  Sparkles,
  Library,
  FolderOpen,
  GraduationCap,
  Hash,
} from "lucide-react";

interface ResourceCardProps {
  worksheet: Worksheet;
  selectedClass?: string;
  key?: React.Key;
}

export function renderFormatBadge(typeString: string) {
  const normCompare = normalizeCompare(typeString);
  const isQuiz = normCompare.includes("quiz") || normCompare.includes("quizizz") || normCompare.includes("kuis");
  const isPdf = normCompare.includes("pdf") || normCompare.includes("document") || normCompare.includes("dokumen");
  const isLearningMaterial = normCompare.includes("learning material") || normCompare.includes("materi") || normCompare.includes("slides") || normCompare.includes("presentation");

  if (isQuiz) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 border border-blue-200/80 px-2.5 py-1 text-xs font-extrabold text-blue-700 shadow-3xs tracking-tight">
        <Gamepad className="h-3.5 w-3.5 text-blue-600 shrink-0" />
        Quiz Digital
      </span>
    );
  } else if (isPdf) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 text-xs font-extrabold text-emerald-700 shadow-3xs tracking-tight">
        <FileText className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
        PDF
      </span>
    );
  } else if (isLearningMaterial) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 border border-amber-200/80 px-2.5 py-1 text-xs font-extrabold text-amber-700 shadow-3xs tracking-tight">
        <Sparkles className="h-3.5 w-3.5 text-amber-600 shrink-0" />
        Materi
      </span>
    );
  } else {
    const rawType = normalizeType(typeString);
    return (
      <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 border border-slate-200 px-2.5 py-1 text-xs font-extrabold text-slate-700 shadow-3xs tracking-tight">
        <FileText className="h-3.5 w-3.5 text-slate-500 shrink-0" />
        {rawType || "File"}
      </span>
    );
  }
}

export default function ResourceCard({ worksheet, selectedClass }: ResourceCardProps) {
  const displaySubject = normalizeSubject(worksheet.subject) || "General Subject";
  const displayChapter = normalizeChapter(worksheet.chapter);
  const displayTopic = normalizeTopic(worksheet.topic) || "Resource";
  const targetClasses = getTargetClasses(worksheet.grade);
  const visibleClasses =
    selectedClass && selectedClass !== "All"
      ? [selectedClass]
      : targetClasses;
  const lowerType = normalizeCompare(worksheet.type);
  const isLearningMaterial = lowerType.includes("learning material") || lowerType.includes("materi");
  const isQuiz = lowerType.includes("quiz") || lowerType.includes("kuis");
  const buttonText = isQuiz ? "Open Quiz →" : isLearningMaterial ? "Open Material →" : "Open →";

  return (
    <div
      id={`worksheet-card-${worksheet.id}`}
      className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-50/50 transition-all"
    >
      {/* Top Row: Subject (Left) + Format Type Badge (Right) */}
      <div>
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-1.5">
            <Library className="h-3.5 w-3.5 text-blue-600" />
            <span className="text-xs font-extrabold uppercase tracking-wider text-blue-900">
              {displaySubject}
            </span>
          </div>

          <div>
            {renderFormatBadge(worksheet.type)}
          </div>
        </div>

        {/* TOPIC / SUB-BAB (DOMINANT VISUAL ELEMENT - RULE 15) */}
        <div className="pt-3 pb-2.5">
          <h4 className="font-display text-base sm:text-lg font-black tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
            {displayTopic}
          </h4>
        </div>

        {/* CHAPTER & CLASS METADATA */}
        <div className="space-y-1.5 text-xs text-slate-600">
          {displayChapter && (
            <div className="flex items-start gap-1.5 text-slate-600 font-medium">
              <FolderOpen className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
              <span className="line-clamp-1">{displayChapter}</span>
            </div>
          )}

          <div className="flex items-center flex-wrap gap-1.5 font-bold text-slate-700">
            <GraduationCap className="h-3.5 w-3.5 text-blue-600 shrink-0" />
            <span className="text-slate-500 font-semibold">Kelas:</span>
            {visibleClasses.length > 0 ? (
              visibleClasses.map((cls, idx) => (
                <span
                  key={cls}
                  className="inline-flex items-center text-xs font-bold text-slate-800"
                >
                  {cls}
                  {idx < visibleClasses.length - 1 && (
                    <span className="mx-1 text-blue-400 font-extrabold">·</span>
                  )}
                </span>
              ))
            ) : (
              <span>{worksheet.grade || "1 Inter"}</span>
            )}
          </div>
        </div>
      </div>

      {/* BOTTOM ROW: ID (Subtle secondary) + Direct Open Action Button */}
      <div className="flex items-center justify-between gap-3 pt-4 mt-3 border-t border-slate-100">
        <div className="flex items-center gap-1 text-[11px] font-mono font-medium text-slate-400">
          <Hash className="h-3 w-3 text-slate-300" />
          <span>ID: {worksheet.id}</span>
        </div>

        <a
          href={worksheet.link}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Buka ${displayTopic}`}
          className="inline-flex items-center gap-1.5 min-h-[40px] rounded-xl bg-blue-600 px-4 py-2 text-xs font-extrabold text-white transition-all hover:bg-blue-700 shadow-xs shadow-blue-100 active:scale-97 cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
        >
          <span>{buttonText}</span>
          <ExternalLink className="h-3.5 w-3.5 text-blue-200" />
        </a>
      </div>
    </div>
  );
}
