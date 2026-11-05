NEO ILMA V3.1 — SEMESTER + SMART CONTEXT FOUNDATION
=====================================================

Baseline:
NEO ILMA V2 latest supplied as bank_soal_all (7).zip

Scope of this patch
-------------------
This is a FOUNDATION release. It intentionally does not redesign the V2 UI yet.

1. Semester is now a first-class resource field end-to-end:
   Spreadsheet / Apps Script -> API -> server -> Worksheet type -> filter engine.

2. Canonical Semester values:
   1
   2
   blank

   Blank means GENERAL / UNIVERSAL material.

3. Smart Context engine added:
   src/utils/smartContext.ts

   Calendar rules:
   July–December  -> Semester 1
   January–June   -> Semester 2

   Academic Year rules:
   July 2026–December 2026 -> 2026-2027
   January 2027–June 2027 -> 2026-2027

4. Universal Semester rule:
   Active Semester 1 -> Semester 1 + blank resources
   Active Semester 2 -> Semester 2 + blank resources
   No semester constraint / All -> all resources

5. Existing V2 filter engine now accepts OPTIONAL:
   selectedSemester

   Because the field is optional, existing V2 UI behavior remains unchanged.
   This prepares the engine for Parent Smart View without forcing the V3 UI yet.

6. Semester is searchable metadata:
   "semester 1"
   "semester 2"
   "semester umum"

7. Cache key bumped:
   neo_ilma_resource_cache_v4 -> neo_ilma_resource_cache_v5

   Older caches remain readable as fallback, while the new successful response
   is stored using the V5 schema.

Files changed / added
---------------------
src/types.ts
src/utils/smartContext.ts                 NEW
src/utils/resourceFilters.ts
api/worksheets.ts
server.ts
Code.gs
src/assets/apps-script/Code.gs
src/App.tsx
scripts/test_cases.ts

Validation performed
--------------------
PASS — TypeScript utility compile check
PASS — root Code.gs syntax check
PASS — packaged Apps Script Code.gs syntax check
PASS — runtime: October 2026 -> Academic Year 2026-2027
PASS — runtime: February 2027 -> Academic Year 2026-2027
PASS — runtime: July–December -> Semester 1
PASS — runtime: January–June -> Semester 2
PASS — runtime: blank Semester is universal
PASS — runtime: Smart Context filters Year + Class + Semester correctly
PASS — runtime: existing filter engine accepts optional Semester

Expected data example
---------------------
Q-xxxxxx | 5 Inter | MATH | ... | 2026-2027 | 1
Q-yyyyyy | 5 Inter | MATH | ... | 2026-2027 | 2
Q-zzzzzz | 5 Inter | MATH | ... | 2026-2027 | [blank]

Current context in October 2026
-------------------------------
Academic Year: 2026-2027
Semester: 1

Important
---------
V3.1 does NOT yet:
- show the Parent class-selection dialog
- save multiple child classes
- hide worksheets until a subject is selected
- create Subject Home
- change resource fetching to contextual/lazy fetching
- move statistics
- create historical journey UI

Those belong to the next V3 stages.

Apps Script deployment
----------------------
If the production resource API uses the included Code.gs, replace it and deploy:
Deploy -> Manage deployments -> Edit -> New version -> Deploy

The MASTER sheet is expected to contain a header named:
Semester

Supported header alias:
Sem
