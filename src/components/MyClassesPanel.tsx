import React, { useMemo, useState } from "react";
import {
  CheckCircle2,
  GraduationCap,
  Plus,
  Users,
  X,
} from "lucide-react";
import { ALL_SCHOOL_CLASSES } from "../utils/classConfig";

interface MyClassesPanelProps {
  savedClasses: string[];
  activeClass?: string;
  onAddClass: (className: string) => void;
  onActivateClass: (className: string) => void;
  onRemoveClass: (className: string) => void;
}

export default function MyClassesPanel({
  savedClasses,
  activeClass,
  onAddClass,
  onActivateClass,
  onRemoveClass,
}: MyClassesPanelProps) {
  const [showAddClass, setShowAddClass] =
    useState(false);

  const availableClasses = useMemo(
    () =>
      ALL_SCHOOL_CLASSES.filter(
        (className) =>
          !savedClasses.includes(className),
      ),
    [savedClasses],
  );

  const [pendingClass, setPendingClass] =
    useState<string>("");

  const handleOpenAdd = () => {
    setPendingClass(availableClasses[0] ?? "");
    setShowAddClass(true);
  };

  const handleAdd = () => {
    if (!pendingClass) return;

    onAddClass(pendingClass);
    setPendingClass("");
    setShowAddClass(false);
  };

  return (
    <section
      id="my-classes-panel"
      className="rounded-3xl border border-blue-100 bg-gradient-to-br from-white via-white to-blue-50/60 p-4 shadow-sm sm:p-5"
      aria-labelledby="my-classes-title"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
            <Users className="h-5 w-5" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2
                id="my-classes-title"
                className="font-display text-base font-black tracking-tight text-slate-900 sm:text-lg"
              >
                Kelas Anak Saya
              </h2>

              {activeClass && (
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-200">
                  Aktif: {activeClass}
                </span>
              )}
            </div>

            <p className="mt-1 max-w-2xl text-xs font-medium leading-relaxed text-slate-500 sm:text-sm">
              Simpan beberapa kelas dan pindah kelas aktif dengan satu klik. Pilihan ini hanya disimpan di perangkat Abu wa Ummu.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          disabled={availableClasses.length === 0}
          className="inline-flex min-h-[44px] shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-black text-white shadow-sm transition-all hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300 sm:text-sm"
        >
          <Plus className="h-4 w-4" />
          Tambah Kelas
        </button>
      </div>

      {savedClasses.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2.5">
          {savedClasses.map((className) => {
            const isActive =
              activeClass === className;

            return (
              <div
                key={className}
                className={`inline-flex items-stretch overflow-hidden rounded-xl border transition-all ${
                  isActive
                    ? "border-blue-500 bg-blue-600 shadow-sm"
                    : "border-slate-200 bg-white hover:border-blue-300"
                }`}
              >
                <button
                  type="button"
                  onClick={() =>
                    onActivateClass(className)
                  }
                  aria-pressed={isActive}
                  className={`inline-flex min-h-[42px] cursor-pointer items-center gap-2 px-3 py-2 text-xs font-black transition-colors sm:text-sm ${
                    isActive
                      ? "text-white"
                      : "text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                  }`}
                >
                  {isActive ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <GraduationCap className="h-4 w-4 text-blue-500" />
                  )}
                  {className}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onRemoveClass(className)
                  }
                  aria-label={`Hapus ${className} dari Kelas Anak Saya`}
                  title={`Hapus ${className}`}
                  className={`flex min-h-[42px] min-w-[38px] cursor-pointer items-center justify-center border-l px-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 ${
                    isActive
                      ? "border-blue-500 text-blue-100 hover:bg-blue-700 hover:text-white"
                      : "border-slate-200 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                  }`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-dashed border-blue-200 bg-blue-50/50 px-4 py-4 text-xs font-semibold leading-relaxed text-slate-600 sm:text-sm">
          Belum ada kelas yang disimpan. Tambahkan kelas anak untuk menyiapkan pengalaman NEO ILMA V3 yang lebih personal.
        </div>
      )}

      {showAddClass && (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label
                htmlFor="my-classes-add-select"
                className="mb-1.5 block text-[11px] font-black uppercase tracking-wider text-slate-600"
              >
                Pilih kelas yang ingin disimpan
              </label>

              <select
                id="my-classes-add-select"
                value={pendingClass}
                onChange={(event) =>
                  setPendingClass(event.target.value)
                }
                className="min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-bold text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                {availableClasses.map((className) => (
                  <option
                    key={className}
                    value={className}
                  >
                    {className}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowAddClass(false);
                  setPendingClass("");
                }}
                className="min-h-[44px] cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-600 hover:bg-slate-50"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleAdd}
                disabled={!pendingClass}
                className="min-h-[44px] cursor-pointer rounded-xl bg-blue-600 px-4 py-2 text-xs font-black text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                Simpan & Aktifkan
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
