import React from "react";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  GraduationCap,
  LibraryBig,
} from "lucide-react";
import type {
  SubjectHomeData,
} from "../utils/subjectHome";

interface SubjectHomeProps {
  data: SubjectHomeData;
  onSelectSubject: (subject: string) => void;
}

function subjectInitials(subject: string): string {
  const parts = String(subject ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return "?";

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return (
    parts[0].charAt(0) +
    parts[1].charAt(0)
  ).toUpperCase();
}

export default function SubjectHome({
  data,
  onSelectSubject,
}: SubjectHomeProps) {
  const {
    context,
    list,
    total,
  } = data;

  return (
    <section
      id="subject-home"
      className="space-y-5"
      aria-labelledby="subject-home-title"
    >
      <div className="overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-br from-white via-blue-50/60 to-indigo-50/50 shadow-xs">
        <div className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-blue-700">
                <LibraryBig className="h-3.5 w-3.5" />
                Ruang Belajar
              </div>

              <h2
                id="subject-home-title"
                className="font-display text-xl font-black tracking-tight text-slate-950 sm:text-2xl"
              >
                Pilih Mata Pelajaran
              </h2>

              <p className="mt-1.5 max-w-2xl text-xs font-medium leading-relaxed text-slate-500 sm:text-sm">
                Abu wa Ummu, pilih mata pelajaran terlebih dahulu untuk melihat materi yang tersedia.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <div className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-blue-100 bg-white px-3 py-2 text-xs font-black text-blue-800 shadow-3xs">
                <GraduationCap className="h-4 w-4 text-blue-600" />
                {context.selectedClass}
              </div>

              <div className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-violet-100 bg-white px-3 py-2 text-xs font-black text-violet-800 shadow-3xs">
                <CalendarDays className="h-4 w-4 text-violet-600" />
                {context.academicYear} • Semester {context.semester}
              </div>
            </div>
          </div>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center">
          <BookOpen className="mx-auto h-9 w-9 text-slate-300" />
          <h3 className="mt-3 text-sm font-black text-slate-800">
            Belum ada mata pelajaran untuk periode ini
          </h3>
          <p className="mx-auto mt-1.5 max-w-lg text-xs font-medium leading-relaxed text-slate-500">
            Belum ditemukan materi untuk kelas {context.selectedClass}, tahun ajaran {context.academicYear}, Semester {context.semester}.
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-3 px-1">
            <div>
              <h3 className="text-sm font-black text-slate-900">
                Mata Pelajaran Tersedia
              </h3>
              <p className="mt-0.5 text-[11px] font-medium text-slate-500">
                {list.length} mata pelajaran • {total} materi pada periode aktif
              </p>
            </div>
          </div>

          <div
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
            role="list"
            aria-label={`Mata pelajaran ${context.selectedClass}`}
          >
            {list.map((item) => (
              <button
                key={item.name}
                type="button"
                role="listitem"
                onClick={() =>
                  onSelectSubject(
                    item.name,
                  )
                }
                className="group flex min-h-[132px] cursor-pointer flex-col rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-xs transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 active:translate-y-0"
                aria-label={`Buka mata pelajaran ${item.name}, ${item.count} materi`}
              >
                <div className="flex w-full items-start justify-between gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-xs font-black text-blue-700 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                    {subjectInitials(item.name)}
                  </div>

                  <ArrowRight className="h-4 w-4 text-slate-300 transition-all group-hover:translate-x-0.5 group-hover:text-blue-600" />
                </div>

                <div className="mt-auto pt-4">
                  <div className="line-clamp-2 text-sm font-black leading-tight text-slate-900">
                    {item.name}
                  </div>
                  <div className="mt-1 text-[11px] font-bold text-slate-500">
                    {item.count} {item.count === 1 ? "materi" : "materi"}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
