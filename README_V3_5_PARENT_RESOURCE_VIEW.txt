NEO ILMA V3.5 — PARENT RESOURCE VIEW

This release completes the first simplified post-subject parent experience.

NEW TOP-OF-PAGE DATA FRESHNESS
------------------------------
The last-update signal remains prominent at the top of the dashboard:

Data tersambung
Terakhir diperbarui: ...

The school-wide resource statistics are no longer placed before the
parent's learning journey.

STATISTICS MOVED TO THE BOTTOM
------------------------------
Statistics now appear after:
- Kelas Anak Saya
- Subject Home / Resource View
- learning resources

The bottom section is titled:
Statistik Bank Materi

Browse by Program is retained there as a supporting / advanced navigation tool.

PARENT RESOURCE VIEW
--------------------
After choosing a subject, the parent now sees:

5 Inter > MATH
2026-2027 • Semester 1

[Ganti Mata Pelajaran]

Search:
Cari materi di MATH...

Sort:
- Terbaru — ID terbesar (DEFAULT)
- Terlama — ID terkecil
- Judul A-Z
- Bab & Topik

[Saring Materi]

The old full Resource Finder is no longer placed directly in the main
parent flow.

CONTENT FILTERS
---------------
"Saring Materi" reveals only content-level filters:

Bab
-> Topik / Sub-Bab
-> Jenis File

Class, Academic Year, and Subject are treated as learning CONTEXT,
not everyday content filters.

SEARCH
------
The existing search engine is preserved:
- normal keywords
- uploader
- Academic Year metadata
- multi-keyword AND search with semicolon

Example:
review; Sony

NEWEST-FIRST DEFAULT
--------------------
NEO ILMA has no reliable created_at for every historical resource.

Therefore the default freshness proxy is the numeric part of the resource ID:

Q-002297 > Q-001418 > Q-000381

Default mode:
newest

This fits the parent use case:
show the most recently entered / likely most recently taught resources first.

Manual sorting remains available.

COMPATIBILITY
-------------
Preserved:
- V3.1 Academic Year + Semester engine
- blank Semester = universal
- V3.2 Kelas Anak Saya
- V3.3 class-selection gate
- V3.4 Subject Home
- pagination
- ResourceCard links
- multi-keyword search
- uploader search
- URL filter state

MANUAL TEST
-----------
1. Open dashboard.
   Expected:
   - "Data tersambung / Terakhir diperbarui" visible near the top.
   - school-wide statistics NOT above the learning flow.

2. Select an active class and a subject.
   Expected:
   - simplified contextual Resource View.
   - full old Resource Finder is not shown.

3. Default resource order.
   Expected:
   - highest Q-number first.

4. Change sort to:
   Terlama — ID terkecil
   Expected:
   - lowest Q-number first.

5. Change sort to:
   Judul A-Z
   Expected:
   - alphabetical resource title order.

6. Click Saring Materi.
   Expected:
   - Bab / Topik / Jenis File appear.

7. Click Ganti Mata Pelajaran.
   Expected:
   - return to Subject Home.

8. Scroll below the learning content.
   Expected:
   - Statistik Bank Materi appears at the bottom.
