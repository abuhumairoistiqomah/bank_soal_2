import React from "react";
import {
  Filter,
  GraduationCap,
  Library,
  BookOpen,
  Layers,
  FileText,
  Search,
  X,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";
import { OptionWithCount } from "../utils/resourceFilters";
import { CLASS_ORDER } from "../utils/classConfig";

interface ResourceFinderProps {
  filters: {
    class: string;
    subject: string;
    chapter: string;
    topic: string;
    type: string;
  };
  searchQuery: string;
  classData: {
    counts: Record<string, number>;
    total: number;
  };
  subjectData: {
    list: OptionWithCount[];
    total: number;
  };
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
  onClassChange: (className: string) => void;
  onSubjectChange: (subject: string) => void;
  onChapterChange: (chapter: string) => void;
  onTopicChange: (topic: string) => void;
  onTypeChange: (type: string) => void;
  onSearchChange: (query: string) => void;
  onResetFilters: () => void;
}

export default function ResourceFinder({
  filters,
  searchQuery,
  classData,
  subjectData,
  chapterData,
  topicData,
  typeData,
  onClassChange,
  onSubjectChange,
  onChapterChange,
  onTopicChange,
  onTypeChange,
  onSearchChange,
  onResetFilters,
}: ResourceFinderProps) {
  const isClassSelected = filters.class !== "All" && filters.class !== "";
  const isSubjectSelected = isClassSelected && filters.subject !== "All" && filters.subject !== "";
  const isChapterSelected = isSubjectSelected && filters.chapter !== "All" && filters.chapter !== "";
  const isTopicSelected = isChapterSelected && filters.topic !== "All" && filters.topic !== "";

  const activeFiltersCount = [
    isClassSelected,
    isSubjectSelected,
    isChapterSelected,
    isTopicSelected,
    filters.type !== "All" && filters.type !== "",
    searchQuery.trim() !== "",
  ].filter(Boolean).length;

  return (
    <div
      id="main-resource-finder"
      className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-md shadow-slate-100 space-y-5"
    >
      {/* Finder Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs shrink-0">
            <Filter className="h-4.5 w-4.5" />
          </div>
          <div>
            <h2 className="font-display text-lg sm:text-xl font-extrabold tracking-tight text-slate-900">
              RESOURCE FINDER
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Filter bertingkat hierarkis dan pencarian kata kunci dengan pembaruan instan.
            </p>
          </div>
        </div>

        {/* Reset Filters Quick Button */}
        {activeFiltersCount > 0 && (
          <button
            type="button"
            id="btn-reset-filters-top"
            aria-label={`Reset ${activeFiltersCount} filter yang aktif`}
            onClick={onResetFilters}
            className="inline-flex items-center gap-1.5 min-h-[44px] sm:min-h-0 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 px-3 py-1.5 text-xs font-bold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Filters ({activeFiltersCount})</span>
          </button>
        )}
      </div>

      {/* 5-Column Progressive Filter Grid (Rule 21: Stack vertically on mobile, 2-3 on tablet, 5 on desktop) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* ============================================================
            STEP 1: KELAS (GRADE / CLASS)
           ============================================================ */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="filter-class-select"
              className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-700"
            >
              <GraduationCap className="h-3.5 w-3.5 text-blue-600" />
              <span>1. Kelas</span>
            </label>
            {isClassSelected && (
              <span className="flex items-center gap-0.5 text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded-md">
                <CheckCircle2 className="h-3 w-3" />
                <span>Dipilih</span>
              </span>
            )}
          </div>

          <div className="relative">
            <select
              id="filter-class-select"
              aria-label="Filter berdasarkan Jenjang Kelas"
              value={filters.class}
              onChange={(e) => onClassChange(e.target.value)}
              className={`w-full min-h-[44px] appearance-none rounded-xl border px-3.5 py-2.5 text-xs sm:text-sm font-bold transition-all focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none cursor-pointer ${
                isClassSelected
                  ? "border-blue-500 bg-blue-50/50 text-blue-900"
                  : "border-slate-300 bg-slate-50 text-slate-800 focus:border-blue-500 focus:bg-white"
              }`}
            >
              <option value="All">Semua Kelas ({classData.total} items)</option>
              {CLASS_ORDER.map((cls) => {
                const count = classData.counts[cls] || 0;
                return (
                  <option key={cls} value={cls}>
                    Kelas {cls} ({count} items)
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* ============================================================
            STEP 2: MATA PELAJARAN (SUBJECT)
           ============================================================ */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="filter-subject-select"
              className={`flex items-center gap-1.5 text-xs font-black uppercase tracking-wider ${
                !isClassSelected ? "text-slate-400" : "text-slate-700"
              }`}
            >
              <Library className={`h-3.5 w-3.5 ${!isClassSelected ? "text-slate-400" : "text-blue-600"}`} />
              <span>2. Mata Pelajaran</span>
            </label>
            {isSubjectSelected && (
              <span className="flex items-center gap-0.5 text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded-md">
                <CheckCircle2 className="h-3 w-3" />
                <span>Dipilih</span>
              </span>
            )}
          </div>

          <div className="relative">
            <select
              id="filter-subject-select"
              aria-label="Filter berdasarkan Mata Pelajaran"
              aria-disabled={!isClassSelected}
              disabled={!isClassSelected}
              value={filters.subject}
              onChange={(e) => onSubjectChange(e.target.value)}
              className={`w-full min-h-[44px] appearance-none rounded-xl border px-3.5 py-2.5 text-xs sm:text-sm font-bold transition-all focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none ${
                !isClassSelected
                  ? "border-slate-200 bg-slate-100/70 text-slate-400 cursor-not-allowed opacity-75"
                  : isSubjectSelected
                  ? "border-blue-500 bg-blue-50/50 text-blue-900"
                  : "border-slate-300 bg-slate-50 text-slate-800 focus:border-blue-500 focus:bg-white cursor-pointer"
              }`}
            >
              <option value="All">
                {!isClassSelected
                  ? "Pilih Kelas Dulu..."
                  : `Semua Mapel (${subjectData.total} items)`}
              </option>
              {isClassSelected &&
                subjectData.list.map((item) => (
                  <option key={item.name} value={item.name}>
                    {item.name} ({item.count})
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* ============================================================
            STEP 3: BAB (CHAPTER)
           ============================================================ */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="filter-chapter-select"
              className={`flex items-center gap-1.5 text-xs font-black uppercase tracking-wider ${
                !isSubjectSelected ? "text-slate-400" : "text-slate-700"
              }`}
            >
              <BookOpen className={`h-3.5 w-3.5 ${!isSubjectSelected ? "text-slate-400" : "text-blue-600"}`} />
              <span>3. Bab</span>
            </label>
            {isChapterSelected && (
              <span className="flex items-center gap-0.5 text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded-md">
                <CheckCircle2 className="h-3 w-3" />
                <span>Dipilih</span>
              </span>
            )}
          </div>

          <div className="relative">
            <select
              id="filter-chapter-select"
              aria-label="Filter berdasarkan Bab"
              aria-disabled={!isSubjectSelected}
              disabled={!isSubjectSelected}
              value={filters.chapter}
              onChange={(e) => onChapterChange(e.target.value)}
              className={`w-full min-h-[44px] appearance-none rounded-xl border px-3.5 py-2.5 text-xs sm:text-sm font-bold transition-all focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none ${
                !isSubjectSelected
                  ? "border-slate-200 bg-slate-100/70 text-slate-400 cursor-not-allowed opacity-75"
                  : isChapterSelected
                  ? "border-blue-500 bg-blue-50/50 text-blue-900"
                  : "border-slate-300 bg-slate-50 text-slate-800 focus:border-blue-500 focus:bg-white cursor-pointer"
              }`}
            >
              <option value="All">
                {!isSubjectSelected
                  ? "Pilih Mapel Dulu..."
                  : `Semua Bab (${chapterData.total} items)`}
              </option>
              {isSubjectSelected &&
                chapterData.list.map((item) => (
                  <option key={item.name} value={item.name}>
                    {item.name} ({item.count})
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* ============================================================
            STEP 4: SUB-BAB / TOPIK (TOPIC)
           ============================================================ */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="filter-topic-select"
              className={`flex items-center gap-1.5 text-xs font-black uppercase tracking-wider ${
                !isChapterSelected ? "text-slate-400" : "text-slate-700"
              }`}
            >
              <Layers className={`h-3.5 w-3.5 ${!isChapterSelected ? "text-slate-400" : "text-blue-600"}`} />
              <span>4. Sub-Bab</span>
            </label>
            {isTopicSelected && (
              <span className="flex items-center gap-0.5 text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded-md">
                <CheckCircle2 className="h-3 w-3" />
                <span>Dipilih</span>
              </span>
            )}
          </div>

          <div className="relative">
            <select
              id="filter-topic-select"
              aria-label="Filter berdasarkan Sub-Bab"
              aria-disabled={!isChapterSelected}
              disabled={!isChapterSelected}
              value={filters.topic}
              onChange={(e) => onTopicChange(e.target.value)}
              className={`w-full min-h-[44px] appearance-none rounded-xl border px-3.5 py-2.5 text-xs sm:text-sm font-bold transition-all focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none ${
                !isChapterSelected
                  ? "border-slate-200 bg-slate-100/70 text-slate-400 cursor-not-allowed opacity-75"
                  : isTopicSelected
                  ? "border-blue-500 bg-blue-50/50 text-blue-900"
                  : "border-slate-300 bg-slate-50 text-slate-800 focus:border-blue-500 focus:bg-white cursor-pointer"
              }`}
            >
              <option value="All">
                {!isChapterSelected
                  ? "Pilih Bab Dulu..."
                  : `Semua Sub-Bab (${topicData.total} items)`}
              </option>
              {isChapterSelected &&
                topicData.list.map((item) => (
                  <option key={item.name} value={item.name}>
                    {item.name} ({item.count})
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* ============================================================
            STEP 5: JENIS FILE (FILE TYPE)
           ============================================================ */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="filter-type-select"
              className={`flex items-center gap-1.5 text-xs font-black uppercase tracking-wider ${
                !isTopicSelected ? "text-slate-400" : "text-slate-700"
              }`}
            >
              <FileText className={`h-3.5 w-3.5 ${!isTopicSelected ? "text-slate-400" : "text-blue-600"}`} />
              <span>5. Jenis File</span>
            </label>
            {filters.type !== "All" && filters.type !== "" && isTopicSelected && (
              <span className="flex items-center gap-0.5 text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded-md">
                <CheckCircle2 className="h-3 w-3" />
                <span>Dipilih</span>
              </span>
            )}
          </div>

          <div className="relative">
            <select
              id="filter-type-select"
              aria-label="Filter berdasarkan Jenis File"
              aria-disabled={!isTopicSelected}
              disabled={!isTopicSelected}
              value={filters.type}
              onChange={(e) => onTypeChange(e.target.value)}
              className={`w-full min-h-[44px] appearance-none rounded-xl border px-3.5 py-2.5 text-xs sm:text-sm font-bold transition-all focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none ${
                !isTopicSelected
                  ? "border-slate-200 bg-slate-100/70 text-slate-400 cursor-not-allowed opacity-75"
                  : filters.type !== "All"
                  ? "border-blue-500 bg-blue-50/50 text-blue-900"
                  : "border-slate-300 bg-slate-50 text-slate-800 focus:border-blue-500 focus:bg-white cursor-pointer"
              }`}
            >
              <option value="All">
                {!isTopicSelected
                  ? "Pilih Sub-Bab Dulu..."
                  : `Semua Format (${typeData.total} items)`}
              </option>
              {isTopicSelected &&
                typeData.list.map((item) => (
                  <option key={item.name} value={item.name}>
                    {item.name} ({item.count})
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {/* ============================================================
          KEYWORD SEARCH BAR & RESET BAR (RULE 23)
         ============================================================ */}
      <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            id="search-input"
            aria-label="Cari lembar kerja atau materi berdasarkan kata kunci, topik, mata pelajaran, atau bab"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search resources by keyword, topic, subject, or chapter..."
            className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-slate-50/70 pl-10 pr-10 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 transition-colors focus-visible:border-blue-500 focus-visible:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              aria-label="Hapus kata kunci pencarian"
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-all cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
              title="Hapus kata kunci"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <button
          type="button"
          id="btn-reset-filters"
          aria-label="Reset semua filter pencarian"
          onClick={onResetFilters}
          className="flex items-center justify-center gap-1.5 w-full sm:w-auto min-h-[44px] rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-slate-400 text-slate-700 px-4 py-2.5 text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer active:scale-98 shadow-3xs focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
        >
          <RotateCcw className="h-4 w-4 text-slate-500" />
          <span>Reset Filters</span>
        </button>
      </div>
    </div>
  );
}
