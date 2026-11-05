import {
  resourceMatchesClass,
  getTargetClasses,
  normalizeClassName,
  formatGradeDisplay,
} from "../src/utils/classTargets";
import {
  filterAndSearchWorksheets,
  getAvailableSubjects,
  getAvailableChapters,
  getAvailableTopics,
  getClassCounts,
  getWorksheetNumericId,
  sortWorksheetsByMode,
} from "../src/utils/resourceFilters";
import {
  resolveClassName,
  THREE_PROGRAMS,
  PROGRAM_GROUPS,
  CLASS_ORDER,
  ALL_SCHOOL_CLASSES,
} from "../src/utils/classConfig";
import { Worksheet } from "../src/types";
import {
  getAcademicYearForDate,
  getSemesterForDate,
  getSmartLearningContext,
  filterWorksheetsBySmartContext,
  resourceMatchesSemester,
} from "../src/utils/smartContext";
import {
  activateClassPreference,
  addClassPreference,
  normalizeSavedClasses,
  removeClassPreference,
  sanitizeClassPreferences,
} from "../src/utils/classPreferences";
import {
  getGuidedDefaultClass,
  shouldShowClassSelectionGate,
} from "../src/utils/classSelection";
import {
  getSubjectHomeData,
} from "../src/utils/subjectHome";

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, details?: string) {
  if (condition) {
    console.log(`✅ [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`❌ [FAIL] ${testName}${details ? ` -> ${details}` : ""}`);
    failed++;
  }
}

console.log("==================================================");
console.log("RUNNING REVISED 6 MQ & TEST SUITE (TESTS A - G)");
console.log("==================================================\n");

// TEST A — 6 MQ SINGLE
console.log("--- TEST A: 6 MQ SINGLE ---");
const testA_db: Worksheet[] = [
  {
    id: "001",
    grade: "6 MQ",
    subject: "Math",
    chapter: "Fractions",
    topic: "Equivalent Fractions",
    type: "PDF",
    link: "https://example.com/001",
  },
];

const testA_results = filterAndSearchWorksheets(testA_db, {
  selectedClass: "6 MQ",
  selectedSubject: "All",
  selectedChapter: "All",
  selectedTopic: "All",
  selectedType: "All",
  searchQuery: "",
});

assert(
  testA_results.some((r) => r.id === "001"),
  "TEST A — 6 MQ Single: 001 appears when Class = 6 MQ is selected",
  `Found: ${JSON.stringify(testA_results.map((r) => r.id))}`
);

// TEST B — 6 INTER SHOULD NOT MATCH SINGLE 6 MQ
console.log("\n--- TEST B: 6 INTER SHOULD NOT MATCH SINGLE 6 MQ ---");
const testB_results = filterAndSearchWorksheets(testA_db, {
  selectedClass: "6 Inter",
  selectedSubject: "All",
  selectedChapter: "All",
  selectedTopic: "All",
  selectedType: "All",
  searchQuery: "",
});

assert(
  !testB_results.some((r) => r.id === "001") && testB_results.length === 0,
  "TEST B — 6 Inter should NOT match single 6 MQ: 001 does NOT appear",
  `Found: ${JSON.stringify(testB_results.map((r) => r.id))}`
);

// TEST C — SHARED 6 INTER / 6 MQ
console.log("\n--- TEST C: SHARED 6 INTER / 6 MQ ---");
const testC_db: Worksheet[] = [
  {
    id: "002",
    grade: "6 Inter - 6 MQ",
    subject: "Science",
    chapter: "Energy",
    topic: "Heat",
    type: "PDF",
    link: "https://example.com/002",
  },
];

const testC_interResults = filterAndSearchWorksheets(testC_db, {
  selectedClass: "6 Inter",
  selectedSubject: "All",
  selectedChapter: "All",
  selectedTopic: "All",
  selectedType: "All",
  searchQuery: "",
});

const testC_mqResults = filterAndSearchWorksheets(testC_db, {
  selectedClass: "6 MQ",
  selectedSubject: "All",
  selectedChapter: "All",
  selectedTopic: "All",
  selectedType: "All",
  searchQuery: "",
});

assert(
  testC_interResults.some((r) => r.id === "002"),
  "TEST C (Part 1) — Shared 6 Inter / 6 MQ: 002 appears when Class = 6 Inter is selected",
  `Found: ${JSON.stringify(testC_interResults.map((r) => r.id))}`
);

assert(
  testC_mqResults.some((r) => r.id === "002"),
  "TEST C (Part 2) — Shared 6 Inter / 6 MQ: 002 appears when Class = 6 MQ is selected",
  `Found: ${JSON.stringify(testC_mqResults.map((r) => r.id))}`
);

// TEST D — SUBJECT CASCADE FOR 6 MQ
console.log("\n--- TEST D: SUBJECT CASCADE FOR 6 MQ ---");
const testD_db: Worksheet[] = [
  {
    id: "003",
    grade: "6 Inter - 6 MQ",
    subject: "Science",
    chapter: "Energy",
    topic: "Heat",
    type: "PDF",
    link: "https://example.com/003",
  },
];

const testD_subjects = getAvailableSubjects(testD_db, "6 MQ");
assert(
  testD_subjects.includes("Science"),
  "TEST D — Subject cascade for 6 MQ: 'Science' is available in Subject dropdown for 6 MQ",
  `Available subjects: ${JSON.stringify(testD_subjects)}`
);

// TEST E — CHAPTER CASCADE FOR 6 MQ
console.log("\n--- TEST E: CHAPTER CASCADE FOR 6 MQ ---");
const testE_db: Worksheet[] = [
  {
    id: "004",
    grade: "6 Inter - 6 MQ",
    subject: "Science",
    chapter: "Energy",
    topic: "Heat",
    type: "PDF",
    link: "https://example.com/004",
  },
];

const testE_chapters = getAvailableChapters(testE_db, "6 MQ", "Science");
assert(
  testE_chapters.includes("Energy"),
  "TEST E — Chapter cascade for 6 MQ: 'Energy' is available in Chapter dropdown for 6 MQ -> Science",
  `Available chapters: ${JSON.stringify(testE_chapters)}`
);

// TEST F — COUNTING
console.log("\n--- TEST F: COUNTING ---");
const testF_db: Worksheet[] = [
  {
    id: "A",
    grade: "6 MQ",
    subject: "Math",
    chapter: "Ch1",
    topic: "T1",
    type: "PDF",
    link: "#",
  },
  {
    id: "B",
    grade: "6 Inter - 6 MQ",
    subject: "Math",
    chapter: "Ch2",
    topic: "T2",
    type: "PDF",
    link: "#",
  },
  {
    id: "C",
    grade: "6 Inter",
    subject: "Math",
    chapter: "Ch3",
    topic: "T3",
    type: "PDF",
    link: "#",
  },
];

const { counts: testF_counts, total: testF_total } = getClassCounts(testF_db);
assert(
  testF_counts["6 MQ"] === 2,
  "TEST F — 6 MQ count is 2",
  `Expected: 2, Got: ${testF_counts["6 MQ"]}`
);
assert(
  testF_counts["6 Inter"] === 2,
  "TEST F — 6 Inter count is 2",
  `Expected: 2, Got: ${testF_counts["6 Inter"]}`
);
assert(
  testF_total === 3,
  "TEST F — Total Resources is 3",
  `Expected: 3, Got: ${testF_total}`
);

// TEST G — CLASS NAVIGATION
console.log("\n--- TEST G: CLASS NAVIGATION ---");
const mqProgram = THREE_PROGRAMS.find((p) => p.id === "MQ");
assert(
  !!mqProgram,
  "TEST G — MQ Program definition exists in THREE_PROGRAMS"
);

if (mqProgram) {
  const group1 = mqProgram.levelGroups.find((g) => g.label.includes("1 - 6") || g.grades.includes(1));
  const group2 = mqProgram.levelGroups.find((g) => g.label.includes("7 - 12") || g.grades.includes(7));
  
  assert(
    !!group1 && JSON.stringify(group1.grades) === JSON.stringify([1, 2, 3, 4, 5, 6]),
    "TEST G — MQ Program visibly includes grades 1 2 3 4 5 6 in group 1",
    `Got: ${JSON.stringify(group1?.grades)}`
  );
  
  assert(
    !!group2 && JSON.stringify(group2.grades) === JSON.stringify([7, 8, 9, 10, 11, 12]),
    "TEST G — MQ Program visibly includes grades 7 8 9 10 11 12 in group 2",
    `Got: ${JSON.stringify(group2?.grades)}`
  );

  const resolved6MQ = resolveClassName(6, "MQ");
  assert(
    resolved6MQ === "6 MQ",
    "TEST G — Clicking MQ -> 6 sets selectedClass = '6 MQ'",
    `Expected: '6 MQ', Got: '${resolved6MQ}'`
  );
}

// EXTRA TEST: SEARCH WITH 6 MQ AND SHARED RESOURCE
console.log("\n--- EXTRA TEST: SEARCH & SHARED RESOURCE ---");
const searchTest_db: Worksheet[] = [
  {
    id: "005",
    grade: "6 Inter - 6 MQ",
    subject: "Math",
    chapter: "Fractions",
    topic: "Equivalent Fractions",
    type: "PDF",
    link: "https://example.com/005",
  },
  {
    id: "006",
    grade: "6 Inter",
    subject: "Math",
    chapter: "Fractions",
    topic: "Equivalent Fractions",
    type: "PDF",
    link: "https://example.com/006",
  },
];

const search_results = filterAndSearchWorksheets(searchTest_db, {
  selectedClass: "6 MQ",
  selectedSubject: "All",
  selectedChapter: "All",
  selectedTopic: "All",
  selectedType: "All",
  searchQuery: "fractions",
});

assert(
  search_results.some((r) => r.id === "005"),
  "Search Test — Selecting Class = 6 MQ and searching 'fractions' includes shared resource 005 (6 Inter - 6 MQ)",
  `Results: ${JSON.stringify(search_results.map((r) => r.id))}`
);

assert(
  !search_results.some((r) => r.id === "006"),
  "Search Test — Selecting Class = 6 MQ and searching 'fractions' excludes 006 (6 Inter only)",
  `Results: ${JSON.stringify(search_results.map((r) => r.id))}`
);

// EXTRA TEST: DISPLAY FORMAT
console.log("\n--- EXTRA TEST: DISPLAY FORMAT ---");
const formattedMulti = formatGradeDisplay("6 Inter - 6 MQ");
assert(
  formattedMulti === "6 Inter · 6 MQ",
  "Display Format — '6 Inter - 6 MQ' formats as '6 Inter · 6 MQ'",
  `Got: ${formattedMulti}`
);

// ==================================================
// V3.1 — SEMESTER + SMART CONTEXT FOUNDATION
// ==================================================
console.log("\n--- V3.1: SMART CONTEXT FOUNDATION ---");

assert(
  getAcademicYearForDate(new Date(2026, 9, 18)) === "2026-2027",
  "V3.1 — October 2026 resolves Academic Year 2026-2027"
);

assert(
  getAcademicYearForDate(new Date(2027, 1, 10)) === "2026-2027",
  "V3.1 — February 2027 remains Academic Year 2026-2027"
);

assert(
  getSemesterForDate(new Date(2026, 9, 18)) === "1",
  "V3.1 — July-December resolves Semester 1"
);

assert(
  getSemesterForDate(new Date(2027, 1, 10)) === "2",
  "V3.1 — January-June resolves Semester 2"
);

assert(
  resourceMatchesSemester("", "1") &&
    resourceMatchesSemester("", "2"),
  "V3.1 — Blank Semester is universal in both semesters"
);

assert(
  resourceMatchesSemester("1", "1") &&
    !resourceMatchesSemester("2", "1"),
  "V3.1 — Semester 1 context excludes Semester 2"
);

const v31ContextDb: Worksheet[] = [
  {
    id: "V31-1",
    grade: "5 Inter",
    subject: "Math",
    chapter: "A",
    topic: "A",
    type: "PDF",
    link: "#1",
    academicYear: "2026-2027",
    semester: "1",
  },
  {
    id: "V31-2",
    grade: "5 Inter",
    subject: "Science",
    chapter: "B",
    topic: "B",
    type: "PDF",
    link: "#2",
    academicYear: "2026-2027",
    semester: "2",
  },
  {
    id: "V31-3",
    grade: "5 Inter",
    subject: "English",
    chapter: "C",
    topic: "C",
    type: "PDF",
    link: "#3",
    academicYear: "2026-2027",
    semester: "",
  },
  {
    id: "V31-4",
    grade: "4 Inter",
    subject: "Math",
    chapter: "D",
    topic: "D",
    type: "PDF",
    link: "#4",
    academicYear: "2026-2027",
    semester: "1",
  },
  {
    id: "V31-5",
    grade: "5 Inter",
    subject: "Math",
    chapter: "E",
    topic: "E",
    type: "PDF",
    link: "#5",
    academicYear: "2025-2026",
    semester: "1",
  },
];

const v31Context = getSmartLearningContext(new Date(2026, 9, 18));
const v31Filtered = filterWorksheetsBySmartContext(v31ContextDb, {
  ...v31Context,
  selectedClass: "5 Inter",
});

assert(
  JSON.stringify(v31Filtered.map((item) => item.id).sort()) ===
    JSON.stringify(["V31-1", "V31-3"]),
  "V3.1 — Smart Context = Year + Class + active Semester + universal blank",
  `Found: ${JSON.stringify(v31Filtered.map((item) => item.id))}`
);

const v31FilterCriteriaResult = filterAndSearchWorksheets(v31ContextDb, {
  selectedAcademicYear: "2026-2027",
  selectedSemester: "1",
  selectedClass: "5 Inter",
  selectedSubject: "All",
  selectedChapter: "All",
  selectedTopic: "All",
  selectedType: "All",
  searchQuery: "",
});

assert(
  JSON.stringify(v31FilterCriteriaResult.map((item) => item.id).sort()) ===
    JSON.stringify(["V31-1", "V31-3"]),
  "V3.1 — Existing filter engine accepts optional Semester without breaking V2",
  `Found: ${JSON.stringify(v31FilterCriteriaResult.map((item) => item.id))}`
);




// ============================================================
// V3.2 — KELAS ANAK SAYA / MULTI-CLASS PREFERENCES
// ============================================================
console.log("\n--- V3.2: KELAS ANAK SAYA ---");

const v32Normalized = normalizeSavedClasses([
  "5 inter",
  "5 Inter",
  "7 MQ",
  "NOT A CLASS",
]);

assert(
  JSON.stringify(v32Normalized) ===
    JSON.stringify(["5 Inter", "7 MQ"]),
  "V3.2 — saved classes are canonical, unique, and reject invalid classes",
  `Got: ${JSON.stringify(v32Normalized)}`
);

const v32Added = addClassPreference(
  { savedClasses: ["3 Inter"], activeClass: "3 Inter" },
  "5 Inter",
  true,
);

assert(
  JSON.stringify(v32Added.savedClasses) ===
    JSON.stringify(["3 Inter", "5 Inter"]) &&
    v32Added.activeClass === "5 Inter",
  "V3.2 — adding a class saves and activates it",
  `Got: ${JSON.stringify(v32Added)}`
);

const v32Activated = activateClassPreference(
  v32Added,
  "7 MQ",
);

assert(
  v32Activated.savedClasses.includes("7 MQ") &&
    v32Activated.activeClass === "7 MQ",
  "V3.2 — activating a valid new class also remembers it",
  `Got: ${JSON.stringify(v32Activated)}`
);

const v32Removed = removeClassPreference(
  v32Activated,
  "7 MQ",
);

assert(
  !v32Removed.savedClasses.includes("7 MQ") &&
    v32Removed.activeClass === "3 Inter",
  "V3.2 — removing the active class falls back to the first saved class",
  `Got: ${JSON.stringify(v32Removed)}`
);

const v32Sanitized = sanitizeClassPreferences({
  savedClasses: ["4 Inter", "6 MQ"],
  activeClass: "12 AE",
});

assert(
  v32Sanitized.activeClass === "4 Inter",
  "V3.2 — invalid/non-saved active class safely falls back to a saved class",
  `Got: ${JSON.stringify(v32Sanitized)}`
);



// ============================================================
// V3.3 — GUIDED CLASS SELECTION / RESOURCE GATE
// ============================================================
console.log("\n--- V3.3: GUIDED CLASS SELECTION ---");

assert(
  shouldShowClassSelectionGate(undefined) &&
    shouldShowClassSelectionGate("") &&
    !shouldShowClassSelectionGate("5 Inter"),
  "V3.3 — resource gate is active only while no class is selected",
);

assert(
  getGuidedDefaultClass(["5 inter", "7 MQ"]) ===
    "5 Inter",
  "V3.3 — guided dialog prefers the first saved family class",
  `Got: ${getGuidedDefaultClass(["5 inter", "7 MQ"])}`
);

assert(
  getGuidedDefaultClass([]) === "1 Inter",
  "V3.3 — first visit falls back to the first canonical school class",
  `Got: ${getGuidedDefaultClass([])}`
);



// ============================================================
// V3.4 — SUBJECT HOME
// ============================================================
console.log("\n--- V3.4: SUBJECT HOME ---");

const v34Worksheets = [
  {
    id: "Q-900001",
    grade: "5 Inter",
    subject: "MATH",
    chapter: "Fractions",
    topic: "Fractions",
    taskName: "Math S1",
    type: "Worksheets PDF",
    link: "https://example.com/math-s1",
    academicYear: "2026-2027",
    semester: "1",
  },
  {
    id: "Q-900002",
    grade: "5 Inter",
    subject: "SCIENCE",
    chapter: "Matter",
    topic: "Matter",
    taskName: "Science General",
    type: "Ringkasan Materi",
    link: "https://example.com/science-general",
    academicYear: "2026-2027",
    semester: "",
  },
  {
    id: "Q-900003",
    grade: "5 Inter",
    subject: "ARABIC",
    chapter: "Vocabulary",
    topic: "Vocabulary",
    taskName: "Arabic S2",
    type: "Worksheets PDF",
    link: "https://example.com/arabic-s2",
    academicYear: "2026-2027",
    semester: "2",
  },
  {
    id: "Q-900004",
    grade: "5 Inter",
    subject: "ENGLISH",
    chapter: "Review",
    topic: "Review",
    taskName: "Old English",
    type: "Worksheets PDF",
    link: "https://example.com/old-english",
    academicYear: "2025-2026",
    semester: "1",
  },
  {
    id: "Q-900005",
    grade: "4 Inter",
    subject: "MATH",
    chapter: "Time",
    topic: "Time",
    taskName: "Other Class",
    type: "Worksheets PDF",
    link: "https://example.com/other-class",
    academicYear: "2026-2027",
    semester: "1",
  },
] as any;

const v34SubjectHome =
  getSubjectHomeData(
    v34Worksheets,
    "5 Inter",
    new Date("2026-10-18T12:00:00"),
  );

assert(
  v34SubjectHome.context.academicYear ===
    "2026-2027" &&
    v34SubjectHome.context.semester === "1",
  "V3.4 — Subject Home resolves the active Academic Year and Semester",
  JSON.stringify(v34SubjectHome.context)
);

assert(
  v34SubjectHome.total === 2,
  "V3.4 — Subject Home includes current Semester + blank Semester only",
  `Got total: ${v34SubjectHome.total}`
);

assert(
  v34SubjectHome.list
    .map((item) => item.name)
    .sort()
    .join("|") ===
    ["MATH", "SCIENCE"].sort().join("|"),
  "V3.4 — only subjects with resources in the active learning context are shown",
  JSON.stringify(v34SubjectHome.list)
);

assert(
  !v34SubjectHome.list.some(
    (item) =>
      item.name === "ARABIC" ||
      item.name === "ENGLISH"
  ),
  "V3.4 — wrong Semester and old Academic Year subjects stay hidden from current Subject Home",
  JSON.stringify(v34SubjectHome.list)
);



// ============================================================
// V3.5 — PARENT RESOURCE VIEW / NEWEST-FIRST SORT
// ============================================================
console.log("\n--- V3.5: PARENT RESOURCE VIEW SORTING ---");

const v35SortRows = [
  {
    id: "Q-000381",
    grade: "4 Inter",
    subject: "SCIENCE",
    chapter: "Matter",
    topic: "Matter",
    taskName: "Matter",
    type: "PDF",
    link: "#381",
  },
  {
    id: "Q-002297",
    grade: "4 Inter",
    subject: "SCIENCE",
    chapter: "Animals",
    topic: "Animals",
    taskName: "Animals",
    type: "PDF",
    link: "#2297",
  },
  {
    id: "Q-001418",
    grade: "4 Inter",
    subject: "SCIENCE",
    chapter: "Energy",
    topic: "Energy",
    taskName: "Energy",
    type: "PDF",
    link: "#1418",
  },
] as any;

assert(
  getWorksheetNumericId("Q-002297") === 2297,
  "V3.5 — numeric resource ID parser reads the final sequence correctly",
  `Got: ${getWorksheetNumericId("Q-002297")}`
);

assert(
  sortWorksheetsByMode(
    v35SortRows,
    "newest",
    "4 Inter",
  )
    .map((item) => item.id)
    .join("|") ===
    "Q-002297|Q-001418|Q-000381",
  "V3.5 — default newest sort uses highest resource ID first",
);

assert(
  sortWorksheetsByMode(
    v35SortRows,
    "oldest",
    "4 Inter",
  )
    .map((item) => item.id)
    .join("|") ===
    "Q-000381|Q-001418|Q-002297",
  "V3.5 — manual oldest sort uses lowest resource ID first",
);

assert(
  sortWorksheetsByMode(
    v35SortRows,
    "title",
    "4 Inter",
  )
    .map((item) => item.taskName)
    .join("|") ===
    "Animals|Energy|Matter",
  "V3.5 — manual title sort orders resource titles A-Z",
);

console.log("\n==================================================");
console.log(`TEST SUMMARY: ${passed} passed, ${failed} failed.`);
console.log("==================================================");

if (failed > 0) {
  process.exit(1);
}
