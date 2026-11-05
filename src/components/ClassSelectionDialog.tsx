import React, {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ArrowRight,
  CheckCircle2,
  GraduationCap,
  ShieldCheck,
  Users,
} from "lucide-react";
import {
  PROGRAM_GROUPS,
} from "../utils/classConfig";
import {
  getGuidedDefaultClass,
} from "../utils/classSelection";

interface ClassSelectionDialogProps {
  open: boolean;
  savedClasses: string[];
  onSelectClass: (className: string) => void;
}

export default function ClassSelectionDialog({
  open,
  savedClasses,
  onSelectClass,
}: ClassSelectionDialogProps) {
  const defaultClass = useMemo(
    () =>
      getGuidedDefaultClass(
        savedClasses,
      ),
    [savedClasses],
  );

  const [pendingClass, setPendingClass] =
    useState(defaultClass);

  useEffect(() => {
    if (!open) return;

    setPendingClass(defaultClass);
  }, [open, defaultClass]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    return () => {
      document.body.style.overflow =
        previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  const handleContinue = () => {
    if (!pendingClass) return;

    onSelectClass(pendingClass);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="class-selection-dialog-title"
        aria-describedby="class-selection-dialog-description"
        className="w-full max-w-xl overflow-hidden rounded-3xl border border-white/30 bg-white shadow-2xl"
      >
        <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 px-5 py-6 text-white sm:px-7 sm:py-7">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">
              <GraduationCap className="h-6 w-6" />
            </div>

            <div>
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-blue-100 ring-1 ring-white/15">
                <Users className="h-3.5 w-3.5" />
                NEO ILMA V3
              </div>

              <h2
                id="class-selection-dialog-title"
                className="font-display text-xl font-black tracking-tight sm:text-2xl"
              >
                Pilih kelas anak terlebih dahulu
              </h2>

              <p
                id="class-selection-dialog-description"
                className="mt-2 text-xs font-medium leading-relaxed text-blue-100 sm:text-sm"
              >
                NEO ILMA akan menyiapkan materi yang relevan setelah Abu wa Ummu memilih satu kelas aktif.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-5 p-5 sm:p-7">
          {savedClasses.length > 0 && (
            <div>
              <div className="mb-2.5 text-[11px] font-black uppercase tracking-wider text-slate-500">
                Kelas Anak Saya
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {savedClasses.map(
                  (className) => {
                    const selected =
                      pendingClass ===
                      className;

                    return (
                      <button
                        key={className}
                        type="button"
                        onClick={() =>
                          setPendingClass(
                            className,
                          )
                        }
                        aria-pressed={
                          selected
                        }
                        className={`flex min-h-[46px] cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-black transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 sm:text-sm ${
                          selected
                            ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                            : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50"
                        }`}
                      >
                        {selected && (
                          <CheckCircle2 className="h-4 w-4 shrink-0" />
                        )}
                        {className}
                      </button>
                    );
                  },
                )}
              </div>
            </div>
          )}

          <div
            className={
              savedClasses.length > 0
                ? "border-t border-slate-200 pt-5"
                : ""
            }
          >
            <label
              htmlFor="guided-class-select"
              className="mb-2 block text-[11px] font-black uppercase tracking-wider text-slate-600"
            >
              {savedClasses.length > 0
                ? "Atau pilih kelas lain"
                : "Kelas anak"}
            </label>

            <select
              id="guided-class-select"
              value={pendingClass}
              onChange={(event) =>
                setPendingClass(
                  event.target.value,
                )
              }
              className="min-h-[48px] w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-bold text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <optgroup label="Program Inter">
                {PROGRAM_GROUPS.INTER.map(
                  (className) => (
                    <option
                      key={className}
                      value={className}
                    >
                      {className}
                    </option>
                  ),
                )}
              </optgroup>

              <optgroup label="Program AE">
                {PROGRAM_GROUPS.AE.map(
                  (className) => (
                    <option
                      key={className}
                      value={className}
                    >
                      {className}
                    </option>
                  ),
                )}
              </optgroup>

              <optgroup label="Program MQ">
                {PROGRAM_GROUPS.MQ.map(
                  (className) => (
                    <option
                      key={className}
                      value={className}
                    >
                      {className}
                    </option>
                  ),
                )}
              </optgroup>
            </select>
          </div>

          <button
            type="button"
            onClick={handleContinue}
            disabled={!pendingClass}
            className="inline-flex min-h-[48px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white shadow-sm transition-all hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Gunakan {pendingClass || "Kelas Ini"}
            <ArrowRight className="h-4 w-4" />
          </button>

          <div className="flex items-start gap-2 rounded-xl bg-slate-50 px-3.5 py-3 text-[11px] font-medium leading-relaxed text-slate-500">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            Pilihan kelas hanya disimpan di perangkat ini. Abu wa Ummu dapat menambah atau mengganti kelas kapan saja.
          </div>
        </div>
      </div>
    </div>
  );
}
