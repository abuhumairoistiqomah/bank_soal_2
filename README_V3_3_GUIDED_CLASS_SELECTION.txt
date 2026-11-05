NEO ILMA V3.3 — GUIDED CLASS SELECTION

Scope
-----
V3.3 changes the initial parent journey without yet introducing Subject Home.

New behavior
------------
1. If no active class exists:
   - Resource Finder is NOT rendered.
   - Worksheet cards are NOT rendered.
   - The resource area shows a neutral "Materi belum ditampilkan" state.
   - A required class-selection dialog opens automatically.

2. Guided class dialog:
   - If the family already saved classes, those appear as large quick choices.
   - A full grouped class dropdown remains available for choosing another class.
   - Selecting a class also saves/activates it through the V3.2 family preference engine.
   - There is intentionally no dismiss button on the dashboard:
     class selection is required before learning resources are shown.

3. Settings remain reachable.
   The class-selection gate is only active on the dashboard.

4. Existing ?class=... links remain compatible.
   A valid class in the URL is promoted to the family active class during first load,
   so shared/deep links do not get blocked by the V3.3 gate.

5. Multi-class behavior from V3.2 is preserved:
   saved classes, active class, quick switch, add/remove, localStorage.

Not included yet
----------------
- Subject Home / subject cards (V3.4)
- Hide worksheets until subject is selected (V3.4+)
- Contextual fetch / reduced network payload
- Historical view
- Statistics relocation

Manual verification
-------------------
A. First visit
1. Clear localStorage key: neo_ilma_family_classes_v1
2. Reload dashboard.
3. Expected:
   - class dialog opens
   - no Resource Finder / resource cards are visible
   - resource area says "Materi belum ditampilkan"
4. Choose 5 Inter.
5. Expected:
   - dialog closes
   - 5 Inter becomes active
   - normal V2 Resource Finder appears for 5 Inter

B. Returning family
1. Save 3 Inter and 5 Inter.
2. Reload.
3. Expected:
   - active saved class is restored
   - no dialog

C. Gate after clearing class
1. Use the old V2 reset-all filter.
2. Expected:
   - active class becomes empty
   - guided dialog returns
   - saved family classes remain available in the dialog

D. Deep link
Open a URL containing ?class=5%20Inter
Expected:
- 5 Inter becomes active
- dialog does not block the shared link
