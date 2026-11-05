/**
 * Smart learning context for NEO ILMA V3.
 *
 * School calendar rule:
 * - July–December  -> Semester 1, Academic Year YYYY-(YYYY+1)
 * - January–June   -> Semester 2, Academic Year (YYYY-1)-YYYY
 *
 * A blank Semester on a resource means GENERAL / UNIVERSAL material and
 * therefore remains visible in either Semester 1 or Semester 2.
 */

import type { Worksheet } from "../types";
import { resourceMatchesClass } from "./classTargets";

export type CanonicalSemester = "1" | "2";

export interface SmartLearningContext {
  academicYear: string;
  semester: CanonicalSemester;
  selectedClass?: string;
}

export function normalizeSemester(value: unknown): "" | CanonicalSemester {
  const text = String(value ?? "").trim().toLowerCase();

  if (!text) return "";

  if (
    text === "1" ||
    text === "semester 1" ||
    text === "semester1" ||
    text === "sem 1" ||
    text === "sem1" ||
    text === "ganjil" ||
    text === "odd"
  ) {
    return "1";
  }

  if (
    text === "2" ||
    text === "semester 2" ||
    text === "semester2" ||
    text === "sem 2" ||
    text === "sem2" ||
    text === "genap" ||
    text === "even"
  ) {
    return "2";
  }

  return "";
}

export function getAcademicYearForDate(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;

  return month >= 7
    ? `${year}-${year + 1}`
    : `${year - 1}-${year}`;
}

export function getSemesterForDate(date: Date = new Date()): CanonicalSemester {
  const month = date.getMonth() + 1;
  return month >= 7 ? "1" : "2";
}

export function getSmartLearningContext(date: Date = new Date()): SmartLearningContext {
  return {
    academicYear: getAcademicYearForDate(date),
    semester: getSemesterForDate(date),
  };
}

/**
 * Blank semester = general material, so it matches either active semester.
 */
export function resourceMatchesSemester(
  resourceSemester: unknown,
  selectedSemester: unknown,
): boolean {
  const selected = normalizeSemester(selectedSemester);

  // No valid semester constraint means "all semesters".
  if (!selected) return true;

  const resource = normalizeSemester(resourceSemester);
  return resource === "" || resource === selected;
}

export function filterWorksheetsBySmartContext(
  worksheets: Worksheet[],
  context: SmartLearningContext,
): Worksheet[] {
  const academicYear = String(context.academicYear ?? "").trim().toLowerCase();
  const selectedClass = String(context.selectedClass ?? "").trim();

  return worksheets.filter((worksheet) => {
    const worksheetYear = String(worksheet.academicYear ?? "").trim().toLowerCase();

    if (academicYear && worksheetYear !== academicYear) {
      return false;
    }

    if (
      selectedClass &&
      !resourceMatchesClass(worksheet.grade, selectedClass)
    ) {
      return false;
    }

    return resourceMatchesSemester(worksheet.semester, context.semester);
  });
}
