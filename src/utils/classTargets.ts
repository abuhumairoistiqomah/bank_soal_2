/**
 * Centralized Class Targets & Membership Utility
 * 
 * Handles parsing, normalization, and class-membership matching for single-class
 * and multi-class resources (e.g. "6 MQ", "6 Inter - 6 MQ", "7 AE - 7 MQ", etc.).
 */

export function normalizeClassName(value: unknown): string {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

/**
 * Returns all individual target class names specified in a Grade string.
 * Supports " - ", "-", ",", "/", "&", ";", "dan", "and".
 * 
 * Examples:
 * - "6 MQ" -> ["6 MQ"]
 * - "6 Inter - 6 MQ" -> ["6 Inter", "6 MQ"]
 * - "7 AE - 7 MQ" -> ["7 AE", "7 MQ"]
 * - "10 AE - 10 MQ" -> ["10 AE", "10 MQ"]
 */
export function getTargetClasses(grade: unknown): string[] {
  const raw = String(grade ?? "").trim();
  if (!raw) return [];

  // Split by " - " or other multi-class separators: " - ", "-", ",", "/", "&", ";" or "dan"/"and"
  const parts = raw.split(/\s*[-–—,/&;]\s*|\s+dan\s+|\s+and\s+/i);
  const classes: string[] = [];

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    // Standardize casing representation for display/matching: e.g. "6 inter" -> "6 Inter"
    const match = trimmed.match(/^(\d{1,2})\s*([a-zA-Z]+)$/);
    let formatted = trimmed;
    if (match) {
      const num = match[1];
      const code = match[2].toUpperCase();
      const progName = code === "INTER" ? "Inter" : code;
      formatted = `${num} ${progName}`;
    }

    if (!classes.some((c) => normalizeClassName(c) === normalizeClassName(formatted))) {
      classes.push(formatted);
    }
  }

  if (classes.length === 0 && raw) {
    classes.push(raw);
  }

  return classes;
}

/**
 * Formats a grade string for clear visual presentation on resource cards.
 * E.g.:
 * - "6 MQ" -> "6 MQ"
 * - "6 Inter - 6 MQ" -> "6 Inter · 6 MQ"
 * - "7 AE - 7 MQ" -> "7 AE · 7 MQ"
 * - "10 AE, 10 MQ" -> "10 AE · 10 MQ"
 */
export function formatGradeDisplay(grade: unknown, separator: string = " · "): string {
  const targets = getTargetClasses(grade);
  if (targets.length === 0) {
    return String(grade ?? "").trim();
  }
  return targets.join(separator);
}

/**
 * Checks if a resource's grade matches a selected class.
 * If selectedClass is empty, undefined, or "all" (case-insensitive), returns true.
 * Otherwise, checks if any of the parsed target classes match selectedClass.
 * 
 * Examples:
 * - resourceMatchesClass("6 MQ", "6 MQ") => true
 * - resourceMatchesClass("6 Inter - 6 MQ", "6 Inter") => true
 * - resourceMatchesClass("6 Inter - 6 MQ", "6 MQ") => true
 * - resourceMatchesClass("6 Inter - 6 MQ", "5 Inter") => false
 * - resourceMatchesClass("6 Inter - 6 MQ", "All") => true
 */
export function resourceMatchesClass(
  grade: unknown,
  selectedClass: unknown
): boolean {
  const target = normalizeClassName(selectedClass);
  if (!target || target === "all") {
    return true;
  }

  return getTargetClasses(grade).some(
    (className) => normalizeClassName(className) === target
  );
}
