import React from "react";
import { BookOpen } from "lucide-react";
import { OptionWithCount } from "../utils/resourceFilters";

interface SubjectQuickAccessProps {
  selectedClass: string;
  selectedSubject: string;
  subjectData: {
    list: OptionWithCount[];
    total: number;
  };
  onSubjectSelect: (subject: string) => void;
}

export default function SubjectQuickAccess({
  selectedClass,
  selectedSubject,
  subjectData,
  onSubjectSelect,
}: SubjectQuickAccessProps) {
  if (!selectedClass || selectedClass === "All" || subjectData.list.length === 0) {
    return null;
  }

  return (
    <div
      id="quick-subject-bar"
      className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-slate-50 p-3.5 space-y-2.5"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-extrabold text-blue-900">
          <BookOpen className="h-3.5 w-3.5 text-blue-600" />
          <span>Mata Pelajaran di Kelas {selectedClass}</span>
        </div>
        <span className="text-[11px] font-semibold text-slate-500">
          {subjectData.list.length} Mapel ({subjectData.total} items)
        </span>
      </div>

      <div
        className="flex items-center flex-wrap gap-2"
        role="group"
        aria-label={`Pilihan cepat mata pelajaran kelas ${selectedClass}`}
      >
        <button
          type="button"
          aria-pressed={selectedSubject === "All"}
          aria-label={`Tampilkan semua mata pelajaran (${subjectData.total} resources)`}
          onClick={() => onSubjectSelect("All")}
          className={`group flex items-center gap-1.5 min-h-[40px] rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer shadow-3xs active:scale-97 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none ${
            selectedSubject === "All"
              ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
              : "bg-white border border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-blue-50/50"
          }`}
        >
          <span>Semua Mapel</span>
          <span
            className={`rounded-full px-1.5 py-0.2 text-[10px] font-extrabold ${
              selectedSubject === "All" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
            }`}
          >
            {subjectData.total}
          </span>
        </button>

        {subjectData.list.map((item) => {
          const isActive = selectedSubject === item.name;
          return (
            <button
              key={item.name}
              type="button"
              aria-pressed={isActive}
              aria-label={`Filter mata pelajaran ${item.name} (${item.count} resources)`}
              onClick={() => onSubjectSelect(item.name)}
              className={`group flex items-center gap-1.5 min-h-[40px] rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer shadow-3xs active:scale-97 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none ${
                isActive
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-200 ring-2 ring-blue-600 ring-offset-1"
                  : "bg-white border border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-blue-50/50"
              }`}
            >
              <span>{item.name}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-extrabold ${
                  isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                {item.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
