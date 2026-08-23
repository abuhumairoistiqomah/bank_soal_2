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
} from "../src/utils/resourceFilters";
import {
  resolveClassName,
  THREE_PROGRAMS,
  PROGRAM_GROUPS,
  CLASS_ORDER,
  ALL_SCHOOL_CLASSES,
} from "../src/utils/classConfig";
import { Worksheet } from "../src/types";

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

console.log("\n==================================================");
console.log(`TEST SUMMARY: ${passed} passed, ${failed} failed.`);
console.log("==================================================");

if (failed > 0) {
  process.exit(1);
}
