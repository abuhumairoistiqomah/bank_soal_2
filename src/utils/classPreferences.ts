import {
  isValidSchoolClass,
  normalizeSingleClass,
} from "./classConfig";

export const CLASS_PREFERENCES_STORAGE_KEY =
  "neo_ilma_family_classes_v1";

export interface ClassPreferences {
  savedClasses: string[];
  activeClass?: string;
}

function normalizeValidClass(value: unknown): string {
  const normalized = normalizeSingleClass(
    String(value ?? "").trim(),
  );

  return isValidSchoolClass(normalized)
    ? normalized
    : "";
}

export function normalizeSavedClasses(
  values: unknown,
): string[] {
  if (!Array.isArray(values)) return [];

  const seen = new Set<string>();
  const result: string[] = [];

  values.forEach((value) => {
    const normalized = normalizeValidClass(value);

    if (!normalized || seen.has(normalized)) {
      return;
    }

    seen.add(normalized);
    result.push(normalized);
  });

  return result;
}

export function sanitizeClassPreferences(
  value: unknown,
): ClassPreferences {
  const raw =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};

  const savedClasses = normalizeSavedClasses(
    raw.savedClasses,
  );

  const requestedActive = normalizeValidClass(
    raw.activeClass,
  );

  const activeClass =
    requestedActive &&
    savedClasses.includes(requestedActive)
      ? requestedActive
      : savedClasses[0];

  return {
    savedClasses,
    ...(activeClass ? { activeClass } : {}),
  };
}

export function addClassPreference(
  preferences: ClassPreferences,
  className: string,
  activate = true,
): ClassPreferences {
  const normalized = normalizeValidClass(className);

  if (!normalized) {
    return sanitizeClassPreferences(preferences);
  }

  const savedClasses = normalizeSavedClasses([
    ...preferences.savedClasses,
    normalized,
  ]);

  const currentActive = normalizeValidClass(
    preferences.activeClass,
  );

  const activeClass = activate
    ? normalized
    : currentActive && savedClasses.includes(currentActive)
      ? currentActive
      : savedClasses[0];

  return {
    savedClasses,
    ...(activeClass ? { activeClass } : {}),
  };
}

export function activateClassPreference(
  preferences: ClassPreferences,
  className: string,
): ClassPreferences {
  const normalized = normalizeValidClass(className);

  if (!normalized) {
    return sanitizeClassPreferences(preferences);
  }

  // Activating a valid class also remembers it. This keeps existing
  // Browse-by-Program / Resource Finder class selection compatible with
  // the new "Kelas Anak Saya" model.
  return addClassPreference(
    preferences,
    normalized,
    true,
  );
}

export function removeClassPreference(
  preferences: ClassPreferences,
  className: string,
): ClassPreferences {
  const normalized = normalizeValidClass(className);

  if (!normalized) {
    return sanitizeClassPreferences(preferences);
  }

  const savedClasses = normalizeSavedClasses(
    preferences.savedClasses,
  ).filter((item) => item !== normalized);

  const currentActive = normalizeValidClass(
    preferences.activeClass,
  );

  const activeClass =
    currentActive &&
    currentActive !== normalized &&
    savedClasses.includes(currentActive)
      ? currentActive
      : savedClasses[0];

  return {
    savedClasses,
    ...(activeClass ? { activeClass } : {}),
  };
}

export function readClassPreferences(): ClassPreferences {
  if (typeof window === "undefined") {
    return { savedClasses: [] };
  }

  try {
    const raw = window.localStorage.getItem(
      CLASS_PREFERENCES_STORAGE_KEY,
    );

    if (!raw) {
      return { savedClasses: [] };
    }

    return sanitizeClassPreferences(
      JSON.parse(raw),
    );
  } catch (error) {
    console.warn(
      "Unable to read saved NEO ILMA class preferences:",
      error,
    );

    return { savedClasses: [] };
  }
}

export function writeClassPreferences(
  preferences: ClassPreferences,
): void {
  if (typeof window === "undefined") return;

  try {
    const sanitized = sanitizeClassPreferences(
      preferences,
    );

    window.localStorage.setItem(
      CLASS_PREFERENCES_STORAGE_KEY,
      JSON.stringify(sanitized),
    );
  } catch (error) {
    console.warn(
      "Unable to save NEO ILMA class preferences:",
      error,
    );
  }
}
