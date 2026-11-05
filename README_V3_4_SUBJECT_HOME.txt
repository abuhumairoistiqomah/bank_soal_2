NEO ILMA V3.4 — SUBJECT HOME

Goal
----
After a family selects an active class, NEO ILMA no longer immediately
shows the full Resource Finder or worksheet library.

Instead:

Active Class
    ->
Subject Home
    ->
Choose one subject
    ->
Existing Resource View / Resource Finder

Current-learning-first rules
----------------------------
Subject cards are generated from:

Active Class
+ Current Academic Year
+ Current Semester
+ blank/general Semester

Example in October 2026:

Academic Year = 2026-2027
Semester = 1

Included:
- Semester 1
- blank Semester

Excluded:
- Semester 2
- previous Academic Years

Subject Home
------------
- Shows "Pilih Mata Pelajaran"
- Displays active class
- Displays current Academic Year + Semester
- Shows only subjects that actually have resources
- Shows material count on every subject card
- Does NOT provide "Semua Mapel" on the guided parent path
- Does NOT show worksheets until one subject is selected

Selecting a subject
-------------------
Selecting MATH / SCIENCE / etc:
- opens the existing resource flow
- keeps active class
- uses current Academic Year
- applies current Semester (plus blank/general Semester)
- Chapter / Topic / Type filters remain available only after subject selection

Changing class
--------------
Changing active class:
- resets subject to All
- returns to Subject Home
- uses the current Academic Year again

Advanced year behavior
----------------------
The current Academic Year uses the hidden Smart Semester constraint.

If an advanced user explicitly changes Academic Year through the existing
Resource Finder after selecting a subject, the hidden current-Semester
constraint is removed so an old year is not silently restricted by the
current semester.

Not yet included
----------------
V3.5 will refine the post-subject Resource View:
- clearer "Ganti Mata Pelajaran"
- simplified contextual search
- newer-first resource sorting
- advanced filters moved behind "Saring Materi"

V3.6 will address contextual/lazy fetching and smaller payloads.

Manual verification
-------------------
1. Use / save active class 5 Inter.
2. Expected:
   - no worksheet cards immediately
   - no full Resource Finder immediately
   - Subject Home appears
   - current TA + semester are visible
3. Only subjects with current-period resources should appear.
4. Click a subject.
5. Expected:
   - Resource Finder / worksheet view appears
   - results are class + subject + current TA + current semester/general
6. Clear Subject in the advanced filter.
7. Expected:
   - return to Subject Home
8. Switch class using "Kelas Anak Saya".
9. Expected:
   - Subject Home resets for the new class.
