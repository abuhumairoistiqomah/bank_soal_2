import React from "react";
import {
  ArrowUp,
  GraduationCap,
} from "lucide-react";

export default function ClassRequiredState() {
  return (
    <section
      id="class-required-resource-state"
      className="rounded-3xl border border-dashed border-blue-200 bg-gradient-to-br from-white to-blue-50/60 px-5 py-12 text-center shadow-xs sm:px-8 sm:py-16"
      aria-labelledby="class-required-title"
    >
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
        <GraduationCap className="h-7 w-7" />
      </div>

      <h2
        id="class-required-title"
        className="mt-4 font-display text-lg font-black tracking-tight text-slate-900 sm:text-xl"
      >
        Materi belum ditampilkan
      </h2>

      <p className="mx-auto mt-2 max-w-xl text-xs font-medium leading-relaxed text-slate-500 sm:text-sm">
        Pilih satu kelas anak terlebih dahulu. Setelah kelas aktif dipilih, NEO ILMA akan membuka area pencarian dan materi untuk kelas tersebut.
      </p>

      <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-[11px] font-bold text-blue-700 ring-1 ring-blue-100">
        <ArrowUp className="h-3.5 w-3.5" />
        Gunakan dialog pemilihan kelas
      </div>
    </section>
  );
}
