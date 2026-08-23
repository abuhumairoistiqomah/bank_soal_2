import React from "react";
import { LayoutDashboard, BookOpen, RefreshCw } from "lucide-react";

interface HeaderProps {
  activeView: string; // "dashboard" | "resources" | "settings"
  onViewChange: (view: string) => void;
  gasConfigured: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export default function Header({
  activeView,
  onViewChange,
  gasConfigured,
  onRefresh,
  isRefreshing = false,
}: HeaderProps) {
  const handleNavClick = (view: string) => {
    if (view === "resources") {
      onViewChange("dashboard");
      setTimeout(() => {
        const el = document.getElementById("worksheet-list-section");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    } else {
      onViewChange(view);
    }
  };

  return (
    <header id="app-header" className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl h-16 items-center justify-between px-3 sm:px-6 lg:px-8 gap-2">
        
        {/* =========================================================
            HEADER / NAVIGATION BRAND
            NEO ILMA - AL-WILDAN 10 JAKARTA
           ========================================================= */}
        <div
          id="brand-logo"
          className="flex items-center gap-2 sm:gap-3 cursor-pointer select-none min-w-0 flex-1 sm:flex-initial"
          onClick={() => handleNavClick("dashboard")}
        >
          <img
            src="https://raw.githubusercontent.com/abuhumairoistiqomah/neojadwal/13f1ed219dbb94a45cd51eedec99a80beaa2d5de/assets/image-removebg-preview%20(7).png"
            alt="Logo Al-Wildan"
            className="h-8 min-[380px]:h-9 sm:h-11 md:h-12 w-auto object-contain shrink-0"
            referrerPolicy="no-referrer"
          />
          <div className="min-w-0">
            <h1 className="font-display text-xs min-[380px]:text-sm sm:text-base md:text-lg font-black tracking-tight text-slate-900 leading-tight truncate">
              NEO ILMA - AL-WILDAN 10 JAKARTA
            </h1>
            <p className="text-[10px] min-[380px]:text-[11px] sm:text-xs font-semibold text-slate-500 tracking-normal truncate">
              Bank Sumber Belajar
            </p>
          </div>
        </div>

        {/* =========================================================
            CLEAN NAVIGATION
            Dashboard (Desktop/Tablet only) | Sumber Belajar | Refresh
           ========================================================= */}
        <nav className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Tab 1: Dashboard - Hidden on mobile to prevent overflow */}
          <button
            id="nav-btn-dashboard"
            type="button"
            onClick={() => handleNavClick("dashboard")}
            className={`hidden sm:flex items-center gap-1.5 min-h-[40px] sm:min-h-[44px] rounded-xl px-3 sm:px-3.5 py-2 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeView === "dashboard"
                ? "bg-blue-50 text-blue-700 font-extrabold"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <LayoutDashboard className="h-4 w-4 text-blue-600" />
            <span>Dashboard</span>
          </button>

          {/* Tab 2: Sumber Belajar (Resources) */}
          <button
            id="nav-btn-resources"
            type="button"
            onClick={() => handleNavClick("resources")}
            className="flex items-center gap-1 sm:gap-1.5 min-h-[36px] sm:min-h-[44px] rounded-xl px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm font-bold transition-all cursor-pointer text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-slate-200 sm:border-transparent"
          >
            <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600" />
            <span className="hidden min-[420px]:inline">Sumber Belajar</span>
            <span className="min-[420px]:hidden">Materi</span>
          </button>

          {/* Refresh Action */}
          {onRefresh && (
            <button
              id="nav-btn-refresh"
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              title="Perbarui data dari basis data"
              className="flex items-center justify-center min-h-[36px] min-w-[36px] sm:min-h-[44px] sm:min-w-[44px] rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isRefreshing ? "animate-spin text-blue-600" : ""}`} />
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
