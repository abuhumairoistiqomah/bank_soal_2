import { ALL_SCHOOL_CLASSES } from "./classConfig";
import { normalizeSavedClasses } from "./classPreferences";

/**
 * V3.3 gate rule:
 * learning resources stay hidden until one active class exists.
 */
export function shouldShowClassSelectionGate(
  activeClass?: string,
): boolean {
  return String(activeClass ?? "").trim() === "";
}

/**
 * Prefer one of the family's saved classes; otherwise fall back to the
 * first canonical school class. Used only as the guided dialog default.
 */
export function getGuidedDefaultClass(
  savedClasses: unknown,
): string {
  const normalized =
    normalizeSavedClasses(savedClasses);

  return (
    normalized[0] ??
    ALL_SCHOOL_CLASSES[0] ??
    ""
  );
}
