NEO ILMA V3.2 — KELAS ANAK SAYA

SCOPE
V3.2 intentionally focuses only on the family class profile layer.
It does NOT yet enforce the V3.3 empty state or V3.4 Subject Home.
This makes regression testing easier.

NEW FEATURES
1. "Kelas Anak Saya" panel appears on the dashboard.
2. A family can save more than one class.
3. Exactly one saved class can be active at a time.
4. Switching the active class updates the existing V2 class filter.
5. Add class with "Tambah Kelas".
6. Remove a saved class with the X button.
7. If the active class is removed, the first remaining saved class becomes active.
8. Preferences are stored only on the current device using localStorage.
9. Returning users restore their saved classes and last active class automatically.
10. Existing Browse by Program / Resource Finder class selection remains compatible:
    choosing a valid class there also remembers it in "Kelas Anak Saya".
11. Clearing the old V2 class filter clears the active class but does NOT delete
    the saved family-class list.

LOCAL STORAGE
Key:
neo_ilma_family_classes_v1

Shape:
{
  "savedClasses": ["3 Inter", "5 Inter"],
  "activeClass": "5 Inter"
}

PRIVACY
No student name or account is required. The class preference remains local to
that browser/device and is not written to Google Sheets or the NEO ILMA server.

UNCHANGED IN V3.2
- Existing resource loading
- Existing V2 Resource Finder
- Academic Year filter
- Semester foundation / Smart Context from V3.1
- Multi-keyword search
- Uploader search
- Pagination
- Resource cards
- Existing dashboard statistics

NEXT
V3.3 — Initial Empty State
When no active class exists, resources will no longer be shown and NEO ILMA
will explicitly guide the parent to choose a class first.

MANUAL VERIFICATION
1. Open NEO ILMA with clean localStorage.
   Expected: Kelas Anak Saya panel says no class saved.
2. Click Tambah Kelas -> choose 5 Inter -> Simpan & Aktifkan.
   Expected: chip 5 Inter appears as active and existing resource filter becomes 5 Inter.
3. Add 3 Inter.
   Expected: both chips exist; 3 Inter becomes active.
4. Click 5 Inter chip.
   Expected: active switches to 5 Inter and resource filter follows.
5. Reload browser.
   Expected: both saved classes remain and 5 Inter stays active.
6. Remove 5 Inter.
   Expected: 3 Inter becomes active automatically.
7. Select a class from existing Browse-by-Program / old filter.
   Expected: selected class is also remembered as a saved family class.
8. Reset old class filter to All.
   Expected: active class becomes empty, but saved chips remain.
