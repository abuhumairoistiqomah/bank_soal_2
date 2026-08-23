import React, { useState, useMemo, useEffect } from "react";
import { Worksheet } from "../types";
import {
  getClassCounts,
  getSubjectCounts,
  getChapterCounts,
  getTopicCounts,
  getTypeCounts,
  filterAndSearchWorksheets,
  sortWorksheetsHierarchically,
  FilterCriteria,
} from "../utils/resourceFilters";
import ResourceFinder from "./ResourceFinder";
import SubjectQuickAccess from "./SubjectQuickAccess";
import ActiveFilterBreadcrumb from "./ActiveFilterBreadcrumb";
import ResourceCard from "./ResourceCard";
import EmptyState from "./EmptyState";
import { GraduationCap, Layers, ChevronLeft, ChevronRight } from "lucide-react";

interface WorksheetListProps {
  worksheets: Worksheet[];
  selectedGrade?: string; // e.g. "3 INTER", "8 MQ", or undefined/"" for all
  initialSubject?: string;
  onGradeChange?: (className: string) => void;
}

interface FilterState {
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
        const urlClass = params.get("class");
        const urlSubject = params.get("subject");
        const urlChapter = params.get("chapter");
        const urlTopic = params.get("topic");
        const urlType = params.get("type");

        const normalizedClass = urlClass ? urlClass.replace(/-/g, " ") : "";
        const initialClass = normalizedClass || (selectedGrade && selectedGrade.trim() !== "" ? selectedGrade : "All");
        const initialSubj = urlSubject || (initialSubject && initialSubject !== "All" ? initialSubject : "All");

        return {
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

    return {
      class: selectedGrade && selectedGrade.trim() !== "" ? selectedGrade : "All",
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

  // Reset to page 1 whenever filters or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, searchQuery]);

  // Synchronize filter state into URL query parameters without page reload (Rule 27)
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const params = new URLSearchParams(window.location.search);

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

      const queryString = params.toString();
      const newUrl = queryString ? `${window.location.pathname}?${queryString}` : window.location.pathname;

      // Update URL safely with window.history.replaceState
      window.history.replaceState(null, "", newUrl);
    } catch (e) {
      console.warn("Could not sync filters to URL:", e);
    }
  }, [filters, searchQuery]);

  // Sync external selectedGrade prop (from Browse by Program or Header)
  useEffect(() => {
    if (selectedGrade !== undefined) {
      const targetClass = selectedGrade && selectedGrade.trim() !== "" ? selectedGrade : "All";
      setFilters({
        class: targetClass,
        subject: "All",
        chapter: "All",
        topic: "All",
        type: "All",
      });
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

  // ============================================================
  // PERFORMANCE MEMOIZATIONS (RULE 35)
  // Use memoization for filtered resources, available subjects,
  // available chapters, available topics, available file types & stats.
  // ============================================================

  // 1. Classes with counts
  const classData = useMemo(() => {
    return getClassCounts(worksheets);
  }, [worksheets]);

  // 2. Subjects with counts for selected class
  const subjectData = useMemo(() => {
    if (!isClassSelected) return { list: [], total: worksheets.length };
    return getSubjectCounts(worksheets, filters.class);
  }, [worksheets, filters.class, isClassSelected]);

  // 3. Chapters with counts for selected class & subject
  const chapterData = useMemo(() => {
    if (!isSubjectSelected) return { list: [], total: 0 };
    return getChapterCounts(worksheets, filters.class, filters.subject);
  }, [worksheets, filters.class, filters.subject, isSubjectSelected]);

  // 4. Topics with counts for selected class, subject & chapter
  const topicData = useMemo(() => {
    if (!isChapterSelected) return { list: [], total: 0 };
    return getTopicCounts(worksheets, filters.class, filters.subject, filters.chapter);
  }, [worksheets, filters.class, filters.subject, filters.chapter, isChapterSelected]);

  // 5. Types with counts for selected class, subject, chapter & topic
  const typeData = useMemo(() => {
    if (!isTopicSelected) return { list: [], total: 0 };
    return getTypeCounts(worksheets, filters.class, filters.subject, filters.chapter, filters.topic);
  }, [worksheets, filters.class, filters.subject, filters.chapter, filters.topic, isTopicSelected]);

  // ============================================================
  // STRICT ATOMIC FILTER RESET HANDLERS
  // Changing a parent filter strictly resets all child filters to "All"
  // ============================================================

  // Level 1: Kelas change -> resets Subject, Chapter, Topic, Type
  const handleClassChange = (newClass: string) => {
    setFilters({
      class: newClass,
      subject: "All",
      chapter: "All",
      topic: "All",
      type: "All",
    });
    if (onGradeChange) onGradeChange(newClass === "All" ? "" : newClass);
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

  // Reset all filters to default
  const handleResetFilters = () => {
    setFilters({
      class: "All",
      subject: "All",
      chapter: "All",
      topic: "All",
      type: "All",
    });
    setSearchQuery("");
    if (onGradeChange) onGradeChange("");
  };

  // ============================================================
  // FILTERING ENGINE & DATA MEMOIZATION (RULE 35)
  // ============================================================
  const filterCriteria: FilterCriteria = useMemo(
    () => ({
      selectedClass: filters.class,
      selectedSubject: filters.subject,
      selectedChapter: filters.chapter,
      selectedTopic: filters.topic,
      selectedType: filters.type,
      searchQuery,
    }),
    [filters, searchQuery]
  );

  const filteredWorksheets = useMemo(() => {
    return filterAndSearchWorksheets(worksheets, filterCriteria);
  }, [worksheets, filterCriteria]);

  // Sort resources hierarchically (Rule 40):
  // When all classes selected: Class canonical order -> Subject A-Z -> Chapter natural order -> Topic natural order
  // When class selected: Subject A-Z -> Chapter natural order -> Topic natural order (natural numeric sort)
  const sortedWorksheets = useMemo(() => {
    return sortWorksheetsHierarchically(filteredWorksheets, filters.class);
  }, [filteredWorksheets, filters.class]);

  // Controlled Pagination: avoids rendering thousands of cards simultaneously
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

  return (
    <div id="worksheet-list-section" className="space-y-6">
      {/* 5-Step Progressive Resource Finder */}
      <ResourceFinder
        filters={filters}
        searchQuery={searchQuery}
        classData={classData}
        subjectData={subjectData}
        chapterData={chapterData}
        topicData={topicData}
        typeData={typeData}
        onClassChange={handleClassChange}
        onSubjectChange={handleSubjectChange}
        onChapterChange={handleChapterChange}
        onTopicChange={handleTopicChange}
        onTypeChange={handleTypeChange}
        onSearchChange={setSearchQuery}
        onResetFilters={handleResetFilters}
      />

      {/* Quick Subject Access Pills */}
      <SubjectQuickAccess
        selectedClass={filters.class}
        selectedSubject={filters.subject}
        subjectData={subjectData}
        onSubjectSelect={handleSubjectChange}
      />

      {/* Active Filter Chips & Clear Actions */}
      <ActiveFilterBreadcrumb
        filters={filters}
        searchQuery={searchQuery}
        onClearClass={() => handleClassChange("All")}
        onClearSubject={() => handleSubjectChange("All")}
        onClearChapter={() => handleChapterChange("All")}
        onClearTopic={() => handleTopicChange("All")}
        onClearType={() => handleTypeChange("All")}
        onClearSearch={() => setSearchQuery("")}
        onResetAll={handleResetFilters}
      />

      {/* Active Context Card with Results Count */}
      <div
        id="active-context-card"
        className="rounded-2xl border border-slate-200/90 bg-gradient-to-r from-white via-slate-50 to-blue-50/30 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
      >
        <div className="space-y-1">
          <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Active Context
          </div>

          {/* Breadcrumb Path */}
          <div className="flex items-center flex-wrap gap-1.5 text-xs sm:text-sm font-black text-slate-900">
            <span className="inline-flex items-center gap-1 text-blue-700">
              <GraduationCap className="h-4 w-4 text-blue-600 shrink-0" />
              {isClassSelected ? `Kelas ${filters.class}` : "Semua Kelas"}
            </span>

            <span className="text-slate-300 font-normal">›</span>

            <span className={isSubjectSelected ? "text-blue-700" : "text-slate-600"}>
              {isSubjectSelected ? filters.subject : "Semua Mapel"}
            </span>

            {isChapterSelected && (
              <>
                <span className="text-slate-300 font-normal">›</span>
                <span className="text-blue-700 max-w-[220px] truncate">{filters.chapter}</span>
              </>
            )}

            {isTopicSelected && (
              <>
                <span className="text-slate-300 font-normal">›</span>
                <span className="text-indigo-700 max-w-[220px] truncate">{filters.topic}</span>
              </>
            )}

            {filters.type !== "All" && (
              <>
                <span className="text-slate-300 font-normal">›</span>
                <span className="text-emerald-700">{filters.type}</span>
              </>
            )}

            {searchQuery && (
              <>
                <span className="text-slate-300 font-normal">›</span>
                <span className="text-amber-700 italic">"{searchQuery}"</span>
              </>
            )}
          </div>
        </div>

        {/* Immediate Result Count */}
        <div className="shrink-0 flex items-center gap-2">
          <div
            id="active-context-result-count"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs sm:text-sm font-black text-white shadow-xs"
          >
            <Layers className="h-4 w-4 text-blue-200" />
            <span>
              {sortedWorksheets.length}{" "}
              {sortedWorksheets.length === 1 ? "resource found" : "resources found"}
            </span>
          </div>
        </div>
      </div>

      {/* Resource Library Grid & Pagination */}
      <div id="resource-library-section" className="space-y-4">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2">
            <h3 className="font-display text-base font-extrabold text-slate-900 tracking-tight">
              Resource Library
            </h3>
            <span className="rounded-full bg-slate-200/80 px-2.5 py-0.5 text-xs font-extrabold text-slate-700">
              {sortedWorksheets.length} Available
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
                  (Page {currentPage} of {totalPages})
                </span>
              ) : (
                <span>
                  Showing all <strong className="text-slate-800">{sortedWorksheets.length}</strong>{" "}
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
              onReset={handleResetFilters}
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
