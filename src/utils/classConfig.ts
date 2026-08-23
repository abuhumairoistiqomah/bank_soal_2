/**
 * Canonical School Configuration for NEO ILMA Learning Resources Bank
 * Centralizes all school structure constants, class orders, and program definitions.
 */

// ============================================================
// 37. PROGRAM CONFIG
// Centralized configuration for all programs and their classes.
// Used for UI grouping and validation without duplication.
// ============================================================
export const PROGRAM_GROUPS = {
  INTER: [
    "1 Inter",
    "2 Inter",
    "3 Inter",
    "4 Inter",
    "5 Inter",
    "6 Inter",
  ],

  AE: [
    "7 AE",
    "8 AE",
    "9 AE",
    "10 AE",
    "11 AE",
    "12 AE",
  ],

  MQ: [
    "1 MQ",
    "2 MQ",
    "3 MQ",
    "4 MQ",
    "5 MQ",
    "6 MQ",
    "7 MQ",
    "8 MQ",
    "9 MQ",
    "10 MQ",
    "11 MQ",
    "12 MQ",
  ],
} as const;

export type ProgramId = keyof typeof PROGRAM_GROUPS;

// Canonical School Class Order across all 24 real classes
export const CLASS_ORDER = [
  "1 Inter",
  "2 Inter",
  "3 Inter",
  "4 Inter",
  "5 Inter",
  "6 Inter",

  "1 MQ",
  "2 MQ",
  "3 MQ",
  "4 MQ",
  "5 MQ",
  "6 MQ",

  "7 AE",
  "8 AE",
  "9 AE",
  "10 AE",
  "11 AE",
  "12 AE",

  "7 MQ",
  "8 MQ",
  "9 MQ",
  "10 MQ",
  "11 MQ",
  "12 MQ",
] as const;

export const ALL_SCHOOL_CLASSES = CLASS_ORDER;
import {
  getTargetClasses,
  normalizeClassName,
  resourceMatchesClass,
} from "./classTargets";

export {
  getTargetClasses,
  normalizeClassName,
  resourceMatchesClass,
  getTargetClasses as parseClassesFromGrade,
  resourceMatchesClass as isWorksheetInClass,
};

// Program Definitions & Level Groupings
export interface ProgramLevelGroup {
  label: string;
  grades: number[];
}

export interface ProgramDefinition {
  id: ProgramId;
  name: string;
  fullName: string;
  badge: string;
  totalClasses: number;
  levelGroups: ProgramLevelGroup[];
  allClasses: readonly string[];
}

export const THREE_PROGRAMS: ProgramDefinition[] = [
  {
    id: "INTER",
    name: "Inter",
    fullName: "Program Inter",
    badge: "Kelas 1 - 6",
    totalClasses: PROGRAM_GROUPS.INTER.length,
    levelGroups: [
      {
        label: "Kelas 1 - 6",
        grades: [1, 2, 3, 4, 5, 6]
      }
    ],
    allClasses: PROGRAM_GROUPS.INTER
  },
  {
    id: "AE",
    name: "AE",
    fullName: "Program AE",
    badge: "Kelas 7 - 12",
    totalClasses: PROGRAM_GROUPS.AE.length,
    levelGroups: [
      {
        label: "Kelas 7 - 12",
        grades: [7, 8, 9, 10, 11, 12]
      }
    ],
    allClasses: PROGRAM_GROUPS.AE
  },
  {
    id: "MQ",
    name: "MQ",
    fullName: "Program MQ",
    badge: "12 Kelas (1-6, 7-12)",
    totalClasses: PROGRAM_GROUPS.MQ.length,
    levelGroups: [
      {
        label: "Kelas 1 - 6",
        grades: [1, 2, 3, 4, 5, 6]
      },
      {
        label: "Kelas 7 - 12",
        grades: [7, 8, 9, 10, 11, 12]
      }
    ],
    allClasses: PROGRAM_GROUPS.MQ
  }
];

export function resolveClassName(gradeNumber: number | string, programId: string): string {
  const p = programId.toUpperCase();
  const progName = p === "INTER" ? "Inter" : p;
  return `${gradeNumber} ${progName}`;
}

export function normalizeSingleClass(raw: string): string {
  const str = String(raw ?? "").trim();
  if (!str) return "";
  
  const upper = str.toUpperCase().replace(/\s+/g, " ");
  for (const canonical of CLASS_ORDER) {
    if (canonical.toUpperCase() === upper) {
      return canonical;
    }
  }
  
  const match = upper.match(/^(\d{1,2})\s*(INTER|AE|MQ)$/i);
  if (match) {
    const num = match[1];
    const progCode = match[2].toUpperCase();
    const prog = progCode === "INTER" ? "Inter" : progCode;
    return `${num} ${prog}`;
  }
  
  return str;
}

export function isValidSchoolClass(className: string): boolean {
  const norm = normalizeSingleClass(className);
  return (ALL_SCHOOL_CLASSES as readonly string[]).includes(norm as any);
}

export function getProgramForClass(className: string): ProgramId | null {
  const norm = normalizeSingleClass(className);
  if ((PROGRAM_GROUPS.INTER as readonly string[]).includes(norm as any)) return "INTER";
  if ((PROGRAM_GROUPS.AE as readonly string[]).includes(norm as any)) return "AE";
  if ((PROGRAM_GROUPS.MQ as readonly string[]).includes(norm as any)) return "MQ";
  return null;
}
