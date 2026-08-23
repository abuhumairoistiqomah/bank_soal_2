import { Worksheet } from "../types";
import {
  CLASS_ORDER,
  normalizeSingleClass,
} from "./classConfig";
import {
  getTargetClasses,
  normalizeClassName,
  resourceMatchesClass,
  formatGradeDisplay,
} from "./classTargets";

// Direct alias references for internal & external compatibility
export const parseClassesFromGrade = getTargetClasses;
export const isWorksheetInClass = resourceMatchesClass;

export {
  getTargetClasses,
  normalizeClassName,
  resourceMatchesClass,
  formatGradeDisplay,
  normalizeSingleClass,
};

/**
 * ============================================================
 * 38. DATA NORMALIZATION HELPERS
 * Normalize values safely before filter comparison while
 * strictly preserving original capitalization for UI display.
 * ============================================================
 */

export function normalizeGrade(grade: unknown): string {
  return formatGradeDisplay(grade, " · ");
}

export function normalizeSubject(subject: unknown): string {
  return String(subject ?? "").trim();
}

export function normalizeChapter(chapter: unknown): string {
  return String(chapter ?? "").trim();
}

export function normalizeTopic(topic: unknown): string {
  return String(topic ?? "").trim();
}

export function normalizeType(type: unknown): string {
  return String(type ?? "").trim();
}

/**
 * Case-insensitive normalized string for comparisons
 */
export function normalizeCompare(val: unknown): string {
  return String(val ?? "").trim().toLowerCase();
}

/**
 * Robust cascading filter helper functions for NEO ILMA Learning Resource Bank.
 * - Subjects, Chapters, Topics, and Types are derived dynamically from the loaded dataset.
 * - Classes are sorted strictly by canonical CLASS_ORDER.
 */

export interface FilterCriteria {
  selectedClass: string; // "All" or e.g. "3 INTER", "6 MQ", "8 MQ"
  selectedSubject: string; // "All" or string
  selectedChapter: string; // "All" or string
  selectedTopic: string; // "All" or string
  selectedType: string; // "All" or string
  searchQuery: string;
}

export interface OptionWithCount {
  name: string;
  count: number;
}

/**
 * Sort classes according to the school's canonical CLASS_ORDER
 */
export function sortClassesCanonical(classes: string[]): string[] {
  return [...classes].sort((a, b) => {
    const idxA = CLASS_ORDER.indexOf(a as any);
    const idxB = CLASS_ORDER.indexOf(b as any);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.localeCompare(b, "id", { numeric: true });
  });
}

/**
 * Extract unique individual real classes from active dataset, sorted strictly by canonical CLASS_ORDER
 */
export function getUniqueClasses(worksheets: Worksheet[]): string[] {
  const set = new Set<string>();
  worksheets.forEach((w) => {
    const classes = parseClassesFromGrade(w.grade);
    classes.forEach((c) => set.add(c));
  });
  return sortClassesCanonical(Array.from(set));
}

/**
 * Get count of worksheets per real class
 */
export function getClassCounts(worksheets: Worksheet[]): {
  counts: Record<string, number>;
  total: number;
} {
  const counts: Record<string, number> = {};
  CLASS_ORDER.forEach((cls) => {
    counts[cls] = 0;
  });

  worksheets.forEach((w) => {
    const classes = parseClassesFromGrade(w.grade);
    classes.forEach((cls) => {
      counts[cls] = (counts[cls] || 0) + 1;
    });
  });

  return { counts, total: worksheets.length };
}

/**
 * Helper to build case-insensitive deduplicated OptionWithCount list
 * while preserving the best clean original display name and avoiding duplicates like
 * "Math", "Math ", " math".
 * Preserves legitimate punctuation: "Al-Qur'an", "Arabic / Native Arabic", "Akidah Akhlak".
 */
function buildUniqueOptionsWithCount(
  items: string[],
  sortFn?: (a: OptionWithCount, b: OptionWithCount) => number
): OptionWithCount[] {
  const map = new Map<string, { display: string; count: number }>();

  items.forEach((item) => {
    const raw = String(item ?? "").trim();
    if (!raw) return;

    const key = raw.toLowerCase();
    const existing = map.get(key);

    if (existing) {
      existing.count += 1;
      // Prefer the version with better casing / fewer all-lowercase if possible
      if (raw !== raw.toLowerCase() && existing.display === existing.display.toLowerCase()) {
        existing.display = raw;
      }
    } else {
      map.set(key, { display: raw, count: 1 });
    }
  });

  const list: OptionWithCount[] = Array.from(map.values()).map((v) => ({
    name: v.display,
    count: v.count,
  }));

  if (sortFn) {
    list.sort(sortFn);
  } else {
    list.sort((a, b) => a.name.localeCompare(b.name, "id", { numeric: true }));
  }

  return list;
}

/**
 * Get subjects with counts for selected class
 * Deduplicates case-insensitively while preserving original display capitalization.
 */
export function getSubjectCounts(
  worksheets: Worksheet[],
  selectedClass: string
): { list: OptionWithCount[]; total: number } {
  let pool = worksheets;
  if (selectedClass && selectedClass !== "All" && selectedClass.trim() !== "") {
    pool = pool.filter((w) => isWorksheetInClass(w.grade, selectedClass));
  }

  const subjectStrings: string[] = [];
  pool.forEach((w) => {
    const subj = normalizeSubject(w.subject);
    if (subj) subjectStrings.push(subj);
  });

  const list = buildUniqueOptionsWithCount(subjectStrings, (a, b) =>
    a.name.localeCompare(b.name, "id", { numeric: true })
  );

  return { list, total: pool.length };
}

/**
 * Get chapters with counts for selected class & subject
 * Deduplicates case-insensitively while preserving original display capitalization.
 */
export function getChapterCounts(
  worksheets: Worksheet[],
  selectedClass: string,
  selectedSubject: string
): { list: OptionWithCount[]; total: number } {
  let pool = worksheets;
  if (selectedClass && selectedClass !== "All" && selectedClass.trim() !== "") {
    pool = pool.filter((w) => isWorksheetInClass(w.grade, selectedClass));
  }
  if (selectedSubject && selectedSubject !== "All" && selectedSubject.trim() !== "") {
    const subjNormalized = normalizeCompare(selectedSubject);
    pool = pool.filter((w) => normalizeCompare(w.subject) === subjNormalized);
  }

  const chapterStrings: string[] = [];
  pool.forEach((w) => {
    const chap = normalizeChapter(w.chapter);
    if (chap) chapterStrings.push(chap);
  });

  const list = buildUniqueOptionsWithCount(chapterStrings, (a, b) =>
    a.name.localeCompare(b.name, "id", { numeric: true })
  );

  return { list, total: pool.length };
}

/**
 * Get topics with counts for selected class, subject & chapter
 * Deduplicates case-insensitively while preserving original display capitalization.
 */
export function getTopicCounts(
  worksheets: Worksheet[],
  selectedClass: string,
  selectedSubject: string,
  selectedChapter: string
): { list: OptionWithCount[]; total: number } {
  let pool = worksheets;
  if (selectedClass && selectedClass !== "All" && selectedClass.trim() !== "") {
    pool = pool.filter((w) => isWorksheetInClass(w.grade, selectedClass));
  }
  if (selectedSubject && selectedSubject !== "All" && selectedSubject.trim() !== "") {
    const subjNormalized = normalizeCompare(selectedSubject);
    pool = pool.filter((w) => normalizeCompare(w.subject) === subjNormalized);
  }
  if (selectedChapter && selectedChapter !== "All" && selectedChapter.trim() !== "") {
    const chapNormalized = normalizeCompare(selectedChapter);
    pool = pool.filter((w) => normalizeCompare(w.chapter) === chapNormalized);
  }

  const topicStrings: string[] = [];
  pool.forEach((w) => {
    const top = normalizeTopic(w.topic);
    if (top) topicStrings.push(top);
  });

  const list = buildUniqueOptionsWithCount(topicStrings, (a, b) =>
    a.name.localeCompare(b.name, "id", { numeric: true })
  );

  return { list, total: pool.length };
}

/**
 * Get file types with counts for selected class, subject, chapter & topic
 * Deduplicates case-insensitively while preserving original display capitalization.
 */
export function getTypeCounts(
  worksheets: Worksheet[],
  selectedClass: string,
  selectedSubject: string,
  selectedChapter: string,
  selectedTopic: string
): { list: OptionWithCount[]; total: number } {
  let pool = worksheets;
  if (selectedClass && selectedClass !== "All" && selectedClass.trim() !== "") {
    pool = pool.filter((w) => isWorksheetInClass(w.grade, selectedClass));
  }
  if (selectedSubject && selectedSubject !== "All" && selectedSubject.trim() !== "") {
    const subjNormalized = normalizeCompare(selectedSubject);
    pool = pool.filter((w) => normalizeCompare(w.subject) === subjNormalized);
  }
  if (selectedChapter && selectedChapter !== "All" && selectedChapter.trim() !== "") {
    const chapNormalized = normalizeCompare(selectedChapter);
    pool = pool.filter((w) => normalizeCompare(w.chapter) === chapNormalized);
  }
  if (selectedTopic && selectedTopic !== "All" && selectedTopic.trim() !== "") {
    const topNormalized = normalizeCompare(selectedTopic);
    pool = pool.filter((w) => normalizeCompare(w.topic) === topNormalized);
  }

  const typeStrings: string[] = [];
  pool.forEach((w) => {
    const tp = normalizeType(w.type);
    if (tp) typeStrings.push(tp);
  });

  const list = buildUniqueOptionsWithCount(typeStrings, (a, b) =>
    a.name.localeCompare(b.name, "id", { numeric: true })
  );

  return { list, total: pool.length };
}

/**
 * Convenience helper to get array of available subject names for selected class
 * Uses resourceMatchesClass for membership.
 */
export function getAvailableSubjects(
  worksheets: Worksheet[],
  selectedClass: string
): string[] {
  return getSubjectCounts(worksheets, selectedClass).list.map((item) => item.name);
}

/**
 * Convenience helper to get array of available chapter names for selected class and subject
 * Uses resourceMatchesClass for membership.
 */
export function getAvailableChapters(
  worksheets: Worksheet[],
  selectedClass: string,
  selectedSubject: string
): string[] {
  return getChapterCounts(worksheets, selectedClass, selectedSubject).list.map((item) => item.name);
}

/**
 * Convenience helper to get array of available topic names for selected class, subject and chapter
 * Uses resourceMatchesClass for membership.
 */
export function getAvailableTopics(
  worksheets: Worksheet[],
  selectedClass: string,
  selectedSubject: string,
  selectedChapter: string
): string[] {
  return getTopicCounts(worksheets, selectedClass, selectedSubject, selectedChapter).list.map((item) => item.name);
}

/**
 * Convenience helper to get array of available file types for selected class, subject, chapter and topic
 * Uses resourceMatchesClass for membership.
 */
export function getAvailableTypes(
  worksheets: Worksheet[],
  selectedClass: string,
  selectedSubject: string,
  selectedChapter: string,
  selectedTopic: string
): string[] {
  return getTypeCounts(worksheets, selectedClass, selectedSubject, selectedChapter, selectedTopic).list.map((item) => item.name);
}

/**
 * ============================================================
 * 40. RESOURCE SORTING HELPER
 * Default sorting hierarchy:
 * If no specific class selected:
 *   Class canonical order -> Subject A-Z -> Chapter natural order -> Topic natural order
 * If class is already selected:
 *   Subject A-Z -> Chapter natural order -> Topic natural order
 * Uses localeCompare with { numeric: true } for natural alphanumeric order
 * (e.g. Chapter 2 before Chapter 10).
 * ============================================================
 */
export function sortWorksheetsHierarchically(
  worksheets: Worksheet[],
  selectedClass?: string
): Worksheet[] {
  const isSpecificClassSelected =
    selectedClass && selectedClass !== "All" && selectedClass.trim() !== "";

  return [...worksheets].sort((a, b) => {
    // 1. If viewing all classes, sort by Canonical Class Order first
    if (!isSpecificClassSelected) {
      const classesA = parseClassesFromGrade(a.grade);
      const classesB = parseClassesFromGrade(b.grade);
      const firstClassA = classesA[0] || normalizeGrade(a.grade);
      const firstClassB = classesB[0] || normalizeGrade(b.grade);

      if (firstClassA !== firstClassB) {
        const idxA = CLASS_ORDER.indexOf(firstClassA as any);
        const idxB = CLASS_ORDER.indexOf(firstClassB as any);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        const classComp = firstClassA.localeCompare(firstClassB, "id", { numeric: true });
        if (classComp !== 0) return classComp;
      }
    }

    // 2. Subject A-Z
    const subjA = normalizeSubject(a.subject);
    const subjB = normalizeSubject(b.subject);
    const subjCompare = subjA.localeCompare(subjB, "id", { numeric: true });
    if (subjCompare !== 0) return subjCompare;

    // 3. Chapter natural order (e.g. "Chapter 2" before "Chapter 10")
    const chapA = normalizeChapter(a.chapter);
    const chapB = normalizeChapter(b.chapter);
    const chapCompare = chapA.localeCompare(chapB, "id", { numeric: true });
    if (chapCompare !== 0) return chapCompare;

    // 4. Topic natural order
    const topA = normalizeTopic(a.topic);
    const topB = normalizeTopic(b.topic);
    return topA.localeCompare(topB, "id", { numeric: true });
  });
}

/**
 * Filter worksheets based on all criteria
 * All comparisons are case-insensitive and safe against null/undefined.
 */
export function filterAndSearchWorksheets(
  worksheets: Worksheet[],
  criteria: FilterCriteria
): Worksheet[] {
  const query = normalizeCompare(criteria.searchQuery);
  const sClass = criteria.selectedClass;
  const sSubject = normalizeCompare(criteria.selectedSubject);
  const sChapter = normalizeCompare(criteria.selectedChapter);
  const sTopic = normalizeCompare(criteria.selectedTopic);
  const sType = normalizeCompare(criteria.selectedType);

  return worksheets.filter((w) => {
    // 1. Class filter: matches if target class is one of the assigned classes in w.grade
    if (sClass && sClass !== "All" && sClass.trim() !== "") {
      if (!isWorksheetInClass(w.grade, sClass)) return false;
    }

    // 2. Subject filter
    if (sSubject && sSubject !== "all") {
      const wSubj = normalizeCompare(w.subject);
      if (wSubj !== sSubject) return false;
    }

    // 3. Chapter filter
    if (sChapter && sChapter !== "all") {
      const wChap = normalizeCompare(w.chapter);
      if (wChap !== sChapter) return false;
    }

    // 4. Topic filter
    if (sTopic && sTopic !== "all") {
      const wTop = normalizeCompare(w.topic);
      if (wTop !== sTopic) return false;
    }

    // 5. Type filter (Case-insensitive comparison)
    if (sType && sType !== "all") {
      const wType = normalizeCompare(w.type);
      if (wType !== sType) return false;
    }

    // 6. Search Query (Case-insensitive across all searchable fields)
    if (query) {
      const sSubjectText = normalizeCompare(w.subject);
      const sChapterText = normalizeCompare(w.chapter);
      const sTopicText = normalizeCompare(w.topic);
      const sGradeText = normalizeCompare(w.grade);
      const sTypeText = normalizeCompare(w.type);
      const sIdText = normalizeCompare(w.id);

      const match =
        sSubjectText.includes(query) ||
        sChapterText.includes(query) ||
        sTopicText.includes(query) ||
        sGradeText.includes(query) ||
        sTypeText.includes(query) ||
        sIdText.includes(query);

      if (!match) return false;
    }

    return true;
  });
}
