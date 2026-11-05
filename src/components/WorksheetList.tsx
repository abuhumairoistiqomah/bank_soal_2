import React, { useState, useMemo, useEffect } from "react";
import { Worksheet } from "../types";
import {
  getAcademicYearCounts,
  filterWorksheetsByAcademicYear,
  getClassCounts,
  getSubjectCounts,
  getChapterCounts,
  getTopicCounts,
  getTypeCounts,
  filterAndSearchWorksheets,
  sortWorksheetsByMode,
  type ResourceSortMode,
  FilterCriteria,
} from "../utils/resourceFilters";
import SubjectHome from "./SubjectHome";
import MaterialFilterPanel from "./MaterialFilterPanel";
import ResourceCard from "./ResourceCard";
import EmptyState from "./EmptyState";
import {
  ArrowLeft,
  ArrowDownUp,
  ChevronLeft,
  ChevronRight,
  Filter,
  GraduationCap,
  Layers,
  Search,
  X,
} from "lucide-react";
import { getSmartLearningContext } from "../utils/smartContext";
import { getSubjectHomeData } from "../utils/subjectHome";

interface WorksheetListProps {
  worksheets: Worksheet[];
  selectedGrade?: string; // e.g. "3 INTER", "8 MQ", or undefined/"" for all
  initialSubject?: string;
  onGradeChange?: (className: string) => void;
}

interface FilterState {
  academicYear: string;
  class: string;
  subject: string;
  chapter: string;
  topic: string;
  type: string;
}

export default function WorksheetList({
  worksheets,
  selectedGrade,
  initialSubject = "All",
  onGradeChange,
}: WorksheetListProps) {
  // Read initial filter values from URL query parameters (Rule 27)
  const getInitialFiltersFromUrl = (): FilterState => {
    if (typeof window !== "undefined") {
      try {
        const params = new URLSearchParams(window.location.search);
        const urlAcademicYear = params.get("year");
        const urlClass = params.get("class");
        const urlSubject = params.get("subject");
        const urlChapter = params.get("chapter");
        const urlTopic = params.get("topic");
        const urlType = params.get("type");

        const normalizedClass = urlClass ? urlClass.replace(/-/g, " ") : "";
        const initialClass = normalizedClass || (selectedGrade && selectedGrade.trim() !== "" ? selectedGrade : "All");
        const initialSubj = urlSubject || (initialSubject && initialSubject !== "All" ? initialSubject : "All");

        const guidedAcademicYear =
          initialClass !== "All"
            ? getSmartLearningContext().academicYear
            : "All";

        return {
          academicYear:
            urlAcademicYear ||
            guidedAcademicYear,
          class: initialClass,
          subject: initialSubj,
          chapter: urlChapter || "All",
          topic: urlTopic || "All",
          type: urlType || "All",
        };
      } catch (e) {
        console.warn("Could not read filters from URL params:", e);
      }
    }

    const initialClass =
      selectedGrade &&
      selectedGrade.trim() !== ""
        ? selectedGrade
        : "All";

    return {
      academicYear:
        initialClass !== "All"
          ? getSmartLearningContext().academicYear
          : "All",
      class: initialClass,
      subject: initialSubject && initialSubject !== "All" ? initialSubject : "All",
      chapter: "All",
      topic: "All",
      type: "All",
    };
  };

  // Cohesive filter state management
  const [filters, setFilters] = useState<FilterState>(getInitialFiltersFromUrl);

  const [searchQuery, setSearchQuery] = useState<string>(() => {
    if (typeof window !== "undefined") {
      try {
        const params = new URLSearchParams(window.location.search);
        return params.get("q") || params.get("search") || "";
      } catch (e) {
        return "";
      }
    }
    return "";
  });

  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 24;

  const [sortMode, setSortMode] =
    useState<ResourceSortMode>(() => {
      if (typeof window === "undefined") {
        return "newest";
      }

      try {
        const params =
          new URLSearchParams(
            window.location.search,
          );

        const value =
          params.get("sort");

        if (
          value === "oldest" ||
          value === "title" ||
          value === "hierarchy"
        ) {
          return value;
        }
      } catch {
        // Use the parent-friendly newest-first default.
      }

      return "newest";
    });

  const [
    showMaterialFilters,
    setShowMaterialFilters,
  ] = useState(false);

  // V3.4 guided parent context.
  // Current Academic Year + Semester are resolved automatically.
  const smartContext = useMemo(
    () => getSmartLearningContext(),
    [],
  );

  // Reset to page 1 whenever filters or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, searchQuery, sortMode]);

  // Synchronize filter state into URL query parameters without page reload (Rule 27)
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const params = new URLSearchParams(window.location.search);

      // Preserve independent Academic Year filter
      if (filters.academicYear && filters.academicYear !== "All") {
        params.set("year", filters.academicYear);
      } else {
        params.delete("year");
      }

      // Preserve class
      if (filters.class && filters.class !== "All") {
        params.set("class", filters.class);
      } else {
        params.delete("class");
      }

      // Preserve subject
      if (filters.subject && filters.subject !== "All") {
        params.set("subject", filters.subject);
      } else {
        params.delete("subject");
      }

      // Preserve chapter
      if (filters.chapter && filters.chapter !== "All") {
        params.set("chapter", filters.chapter);
      } else {
        params.delete("chapter");
      }

      // Preserve topic
      if (filters.topic && filters.topic !== "All") {
        params.set("topic", filters.topic);
      } else {
        params.delete("topic");
      }

      // Preserve type
      if (filters.type && filters.type !== "All") {
        params.set("type", filters.type);
      } else {
        params.delete("type");
      }

      // Preserve search query
      if (searchQuery && searchQuery.trim() !== "") {
        params.set("q", searchQuery.trim());
      } else {
        params.delete("q");
        params.delete("search");
      }

      if (sortMode !== "newest") {
        params.set("sort", sortMode);
      } else {
        params.delete("sort");
      }

      const queryString = params.toString();
      const newUrl = queryString ? `${window.location.pathname}?${queryString}` : window.location.pathname;

      // Update URL safely with window.history.replaceState
      window.history.replaceState(null, "", newUrl);
    } catch (e) {
      console.warn("Could not sync filters to URL:", e);
    }
  }, [filters, searchQuery, sortMode]);

  // Sync external selectedGrade prop (from Browse by Program or Header)
  useEffect(() => {
    if (selectedGrade !== undefined) {
      const targetClass = selectedGrade && selectedGrade.trim() !== "" ? selectedGrade : "All";
      setFilters(() => ({
        academicYear:
          targetClass !== "All"
            ? smartContext.academicYear
            : "All",
        class: targetClass,
        subject: "All",
        chapter: "All",
        topic: "All",
        type: "All",
      }));
    }
  }, [selectedGrade]);

  // Sync external initialSubject prop if passed
  useEffect(() => {
    if (initialSubject && initialSubject !== "All") {
      setFilters((prev) => ({
        ...prev,
        subject: initialSubject,
        chapter: "All",
        topic: "All",
        type: "All",
      }));
    }
  }, [initialSubject]);

  // === Progressive Enablement Flags ===
  const isClassSelected = filters.class !== "All" && filters.class !== "";
  const isSubjectSelected = isClassSelected && filters.subject !== "All" && filters.subject !== "";
  const isChapterSelected = isSubjectSelected && filters.chapter !== "All" && filters.chapter !== "";
  const isTopicSelected = isChapterSelected && filters.topic !== "All" && filters.topic !== "";

  const subjectHomeData = useMemo(
    () =>
      getSubjectHomeData(
        worksheets,
        isClassSelected
          ? filters.class
          : "",
      ),
    [
      worksheets,
      filters.class,
      isClassSelected,
    ],
  );

  // ============================================================
  // PERFORMANCE MEMOIZATIONS (RULE 35)
  // Use memoization for filtered materi, available subjects,
  // available chapters, available topics, available file types & stats.
  // ============================================================

  // Global Academic Year options are derived dynamically from MASTER.
  // No year values are hardcoded in the frontend.
  const academicYearData = useMemo(() => {
    return getAcademicYearCounts(worksheets);
  }, [worksheets]);

  // Hierarchy counts are scoped by the selected year while the hierarchy
  // itself remains unchanged: Kelas -> Mapel -> Bab -> Topik -> Jenis File.
  const yearScopedWorksheets = useMemo(() => {
    return filterWorksheetsByAcademicYear(
      worksheets,
      filters.academicYear
    );
  }, [worksheets, filters.academicYear]);

  // 1. Classes with counts
  const classData = useMemo(() => {
    return getClassCounts(yearScopedWorksheets);
  }, [yearScopedWorksheets]);

  // 2. Subjects with counts for selected class
  const subjectData = useMemo(() => {
    if (!isClassSelected) {
      return {
        list: [],
        total: yearScopedWorksheets.length,
      };
    }

    if (
      filters.academicYear ===
      smartContext.academicYear
    ) {
      return {
        list: subjectHomeData.list,
        total: subjectHomeData.total,
      };
    }

    return getSubjectCounts(
      yearScopedWorksheets,
      filters.class,
    );
  }, [
    yearScopedWorksheets,
    filters.class,
    filters.academicYear,
    isClassSelected,
    smartContext.academicYear,
    subjectHomeData,
  ]);

  // 3. Chapters with counts for selected class & subject
  const chapterData = useMemo(() => {
    if (!isSubjectSelected) return { list: [], total: 0 };
    return getChapterCounts(yearScopedWorksheets, filters.class, filters.subject);
  }, [yearScopedWorksheets, filters.class, filters.subject, isSubjectSelected]);

  // 4. Topics with counts for selected class, subject & chapter
  const topicData = useMemo(() => {
    if (!isChapterSelected) return { list: [], total: 0 };
    return getTopicCounts(yearScopedWorksheets, filters.class, filters.subject, filters.chapter);
  }, [yearScopedWorksheets, filters.class, filters.subject, filters.chapter, isChapterSelected]);

  // 5. Types with counts for selected class, subject, chapter & topic
  const typeData = useMemo(() => {
    if (!isTopicSelected) return { list: [], total: 0 };
    return getTypeCounts(yearScopedWorksheets, filters.class, filters.subject, filters.chapter, filters.topic);
  }, [yearScopedWorksheets, filters.class, filters.subject, filters.chapter, filters.topic, isTopicSelected]);

  // ============================================================
  // STRICT ATOMIC FILTER RESET HANDLERS
  // Changing a parent filter strictly resets all child filters to "All"
  // ============================================================

  // Independent global dimension: changing year keeps the content hierarchy.
  const handleAcademicYearChange = (newAcademicYear: string) => {
    setFilters((prev) => ({
      ...prev,
      academicYear: newAcademicYear,
    }));
  };

  // Level 1: Kelas change -> resets Subject, Chapter, Topic, Type
  const handleClassChange = (newClass: string) => {
    setFilters({
      academicYear:
        newClass !== "All"
          ? smartContext.academicYear
          : "All",
      class: newClass,
      subject: "All",
      chapter: "All",
      topic: "All",
      type: "All",
    });

    setSearchQuery("");

    if (onGradeChange) {
      onGradeChange(
        newClass === "All"
          ? ""
          : newClass,
      );
    }
  };

  // Level 2: Subject change -> resets Chapter, Topic, Type
  const handleSubjectChange = (newSubject: string) => {
    setFilters((prev) => ({
      ...prev,
      subject: newSubject,
      chapter: "All",
      topic: "All",
      type: "All",
    }));

    setSearchQuery("");
    setSortMode("newest");
    setShowMaterialFilters(false);
  };

  // Level 3: Chapter change -> resets Topic, Type
  const handleChapterChange = (newChapter: string) => {
    setFilters((prev) => ({
      ...prev,
      chapter: newChapter,
      topic: "All",
      type: "All",
    }));
  };

  // Level 4: Topic change -> resets Type
  const handleTopicChange = (newTopic: string) => {
    setFilters((prev) => ({
      ...prev,
      topic: newTopic,
      type: "All",
    }));
  };

  // Level 5: Type change
  const handleTypeChange = (newType: string) => {
    setFilters((prev) => ({
      ...prev,
      type: newType,
    }));
  };

  const handleResetMaterialFilters = () => {
    setFilters((prev) => ({
      ...prev,
      chapter: "All",
      topic: "All",
      type: "All",
    }));

    setSearchQuery("");
    setSortMode("newest");
  };

  // ============================================================
  // FILTERING ENGINE & DATA MEMOIZATION (RULE 35)
  // ============================================================
  const filterCriteria: FilterCriteria = useMemo(
    () => ({
      selectedAcademicYear: filters.academicYear,
      selectedSemester:
        filters.academicYear === smartContext.academicYear
          ? smartContext.semester
          : undefined,
      selectedClass: filters.class,
      selectedSubject: filters.subject,
      selectedChapter: filters.chapter,
      selectedTopic: filters.topic,
      selectedType: filters.type,
      searchQuery,
    }),
    [filters, searchQuery, smartContext]
  );

  const filteredWorksheets = useMemo(() => {
    return filterAndSearchWorksheets(worksheets, filterCriteria);
  }, [worksheets, filterCriteria]);

  // V3.5 default = newest material first.
  // Resource IDs are sequential (e.g. Q-002297), so the highest numeric
  // ID is treated as the newest database entry when no explicit created_at exists.
  const sortedWorksheets = useMemo(() => {
    return sortWorksheetsByMode(
      filteredWorksheets,
      sortMode,
      filters.class,
    );
  }, [
    filteredWorksheets,
    filters.class,
    sortMode,
  ]);

  // Controlled Pagination: avoids rendering thousands dari cards simultaneously
  const totalPages = Math.max(1, Math.ceil(sortedWorksheets.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedWorksheets = useMemo(() => {
    return sortedWorksheets.slice(startIndex, startIndex + pageSize);
  }, [sortedWorksheets, startIndex, pageSize]);

  const handlePageChange = (page: number) => {
    const targetPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(targetPage);
    const element = document.getElementById("resource-library-section");
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (
    isClassSelected &&
    !isSubjectSelected
  ) {
    return (
      <div
        id="worksheet-list-section"
        className="space-y-6"
      >
        <SubjectHome
          data={subjectHomeData}
          onSelectSubject={
            handleSubjectChange
          }
        />
      </div>
    );
  }

  const materialFiltersActive =
    filters.chapter !== "All" ||
    filters.topic !== "All" ||
    filters.type !== "All" ||
    searchQuery.trim() !== "";

  return (
    <div id="worksheet-list-section" className="space-y-5">
      <section
        id="parent-resource-context"
        className="overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-br from-white via-blue-50/50 to-indigo-50/40 shadow-xs"
      >
        <div className="p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <button
                type="button"
                onClick={() =>
                  handleSubjectChange("All")
                }
                className="mb-2 inline-flex min-h-[38px] cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-black text-slate-600 transition-colors hover:border-blue-300 hover:text-blue-700"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Ganti Mata Pelajaran
              </button>

              <div className="flex flex-wrap items-center gap-1.5 text-sm font-black text-slate-900 sm:text-base">
                <span className="inline-flex items-center gap-1 text-blue-700">
                  <GraduationCap className="h-4 w-4" />
                  {filters.class}
                </span>
                <span className="text-slate-300">›</span>
                <span className="text-indigo-700">
                  {filters.subject}
                </span>
              </div>

              <p className="mt-1 text-[11px] font-bold text-slate-500">
                {filters.academicYear} • Semester {smartContext.semester}
              </p>
            </div>

            <div className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-black text-white shadow-xs">
              <Layers className="h-4 w-4 text-blue-200" />
              {sortedWorksheets.length} materi
            </div>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto]">
            <div>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  type="text"
                  id="parent-resource-search"
                  value={searchQuery}
                  onChange={(event) =>
                    setSearchQuery(
                      event.target.value,
                    )
                  }
                  placeholder={`Cari materi di ${filters.subject}...`}
                  className="min-h-[46px] w-full rounded-xl border border-slate-300 bg-white pl-10 pr-10 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 sm:text-sm"
                />

                {searchQuery && (
                  <button
                    type="button"
                    onClick={() =>
                      setSearchQuery("")
                    }
                    aria-label="Hapus kata kunci"
                    className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <p className="mt-1.5 pl-1 text-[10px] font-medium leading-relaxed text-slate-500 sm:text-[11px]">
                Bisa memakai beberapa kata kunci dengan titik koma (;), misalnya <b>review; Sony</b>.
              </p>
            </div>

            <label className="flex min-w-[210px] flex-col gap-1">
              <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wide text-slate-500">
                <ArrowDownUp className="h-3.5 w-3.5" />
                Urutkan
              </span>

              <select
                id="resource-sort-select"
                value={sortMode}
                onChange={(event) =>
                  setSortMode(
                    event.target.value as ResourceSortMode,
                  )
                }
                className="min-h-[46px] cursor-pointer rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="newest">
                  Terbaru
                </option>
                <option value="oldest">
                  Terlama
                </option>
                <option value="title">
                  Judul A–Z
                </option>
                <option value="hierarchy">
                  Bab & Topik
                </option>
              </select>
            </label>

            <button
              type="button"
              onClick={() =>
                setShowMaterialFilters(
                  (current) => !current,
                )
              }
              aria-expanded={showMaterialFilters}
              aria-controls="material-filter-panel"
              className={[
                "mt-auto inline-flex min-h-[46px] cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-black transition-colors",
                showMaterialFilters ||
                materialFiltersActive
                  ? "border-blue-300 bg-blue-50 text-blue-700"
                  : "border-slate-300 bg-white text-slate-700 hover:border-blue-300 hover:text-blue-700",
              ].join(" ")}
            >
              <Filter className="h-4 w-4" />
              Saring Materi
              {materialFiltersActive && (
                <span className="rounded-full bg-blue-600 px-1.5 py-0.5 text-[9px] text-white">
                  Aktif
                </span>
              )}
            </button>
          </div>

          {showMaterialFilters && (
            <div className="mt-4">
              <MaterialFilterPanel
                chapter={filters.chapter}
                topic={filters.topic}
                type={filters.type}
                chapterData={chapterData}
                topicData={topicData}
                typeData={typeData}
                onChapterChange={
                  handleChapterChange
                }
                onTopicChange={
                  handleTopicChange
                }
                onTypeChange={
                  handleTypeChange
                }
                onReset={
                  handleResetMaterialFilters
                }
              />
            </div>
          )}
        </div>
      </section>

      {/* Resource Library Grid & Pagination */}
      <div id="resource-library-section" className="space-y-4">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2">
            <h3 className="font-display text-base font-extrabold text-slate-900 tracking-tight">
              Materi {filters.subject}
            </h3>
            <span className="rounded-full bg-slate-200/80 px-2.5 py-0.5 text-xs font-extrabold text-slate-700">
              {sortedWorksheets.length} tersedia
            </span>
          </div>

          {/* Pagination Counter Info */}
          {sortedWorksheets.length > 0 && (
            <div className="text-xs font-semibold text-slate-500">
              {totalPages > 1 ? (
                <span>
                  Showing{" "}
                  <strong className="text-slate-800">
                    {startIndex + 1}–{Math.min(startIndex + pageSize, sortedWorksheets.length)}
                  </strong>{" "}
                  of <strong className="text-slate-800">{sortedWorksheets.length}</strong> resources
                  (Halaman {currentPage} of {totalPages})
                </span>
              ) : (
                <span>
                  Menampilkan all <strong className="text-slate-800">{sortedWorksheets.length}</strong>{" "}
                  resources
                </span>
              )}
            </div>
          )}
        </div>

        {/* Resource Cards Display Container */}
        <div id="worksheets-display-container">
          {sortedWorksheets.length === 0 ? (
            <EmptyState
              onReset={handleResetMaterialFilters}
              message="Tidak ada sumber belajar yang cocok dengan filter atau kata kunci saat ini. Coba ubah jenjang kelas, bab, mata pelajaran, atau reset filter."
              hasActiveFilters={true}
            />
          ) : (
            <div className="space-y-6">
              {/* Responsive Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paginatedWorksheets.map((worksheet) => (
                  <ResourceCard
                    key={worksheet.id}
                    worksheet={worksheet}
                    selectedClass={isClassSelected ? filters.class : undefined}
                  />
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <nav
                  id="pagination-controls"
                  aria-label="Navigasi halaman sumber belajar"
                  className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs"
                >
                  <div className="text-xs font-semibold text-slate-600">
                    Page <strong className="text-slate-900">{currentPage}</strong> of{" "}
                    <strong className="text-slate-900">{totalPages}</strong>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Previous Button */}
                    <button
                      type="button"
                      id="btn-pagination-prev"
                      aria-label="Ke halaman sebelumnya"
                      disabled={currentPage === 1}
                      onClick={() => handlePageChange(currentPage - 1)}
                      className={`inline-flex items-center gap-1 min-h-[40px] px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none ${
                        currentPage === 1
                          ? "bg-slate-100 text-slate-400 cursor-not-allowed opacity-60"
                          : "bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300 active:scale-97"
                      }`}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span>Prev</span>
                    </button>

                    {/* Page Numbers */}
                    <div className="flex items-center gap-1" role="group" aria-label="Nomor halaman">
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter((p) => {
                          if (totalPages <= 7) return true;
                          if (p === 1 || p === totalPages) return true;
                          if (Math.abs(p - currentPage) <= 1) return true;
                          return false;
                        })
                        .map((page, idx, arr) => {
                          const prevPage = arr[idx - 1];
                          const hasGap = prevPage && page - prevPage > 1;

                          return (
                            <React.Fragment key={page}>
                              {hasGap && (
                                <span className="px-1 text-xs font-bold text-slate-400" aria-hidden="true">
                                  ...
                                </span>
                              )}
                              <button
                                type="button"
                                aria-label={`Halaman ${page}`}
                                aria-current={currentPage === page ? "page" : undefined}
                                onClick={() => handlePageChange(page)}
                                className={`min-h-[40px] min-w-[40px] rounded-xl px-3 py-2 text-xs font-bold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none ${
                                  currentPage === page
                                    ? "bg-blue-600 text-white shadow-xs font-black ring-2 ring-blue-600 ring-offset-1"
                                    : "bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300"
                                }`}
                              >
                                {page}
                              </button>
                            </React.Fragment>
                          );
                        })}
                    </div>

                    {/* Next Button */}
                    <button
                      type="button"
                      id="btn-pagination-next"
                      aria-label="Ke halaman selanjutnya"
                      disabled={currentPage === totalPages}
                      onClick={() => handlePageChange(currentPage + 1)}
                      className={`inline-flex items-center gap-1 min-h-[40px] px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none ${
                        currentPage === totalPages
                          ? "bg-slate-100 text-slate-400 cursor-not-allowed opacity-60"
                          : "bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300 active:scale-97"
                      }`}
                    >
                      <span>Next</span>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </nav>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
