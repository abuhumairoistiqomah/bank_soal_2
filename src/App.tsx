import React, { useEffect, useState } from "react";
import Header from "./components/Header";
import DashboardStats from "./components/DashboardStats";
import WorksheetList from "./components/WorksheetList";
import SettingsPanel from "./components/SettingsPanel";
import type { Worksheet } from "./types";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function App() {
  // Keep the current UI model: Dashboard remains the main page.
  // Selecting a class only updates the Resource Finder below and scrolls to it.
  const [activeView, setActiveView] = useState<"dashboard" | "settings">("dashboard");
  const [selectedClass, setSelectedClass] = useState<string | undefined>(undefined);
  const [worksheets, setWorksheets] = useState<Worksheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [gasUrl, setGasUrl] = useState<string>(() => {
    const saved = localStorage.getItem("neo_ilma_gas_url");
    const oldDefault1 =
      "https://script.google.com/macros/s/AKfycbwBTRmtT5LGquctbs_o2VxvGclxGrcul6-OmOnsx_21LaUeYhVeGNXTsWVVL2bCt1I/exec";
    const oldDefault2 =
      "https://script.google.com/macros/s/AKfycbzd4NPDov5GY-0UPZTpllomC6KbMnyD23pOUQk9hV4/dev";
    const newDefault =
      "https://script.google.com/macros/s/AKfycbzRozJ8E2jXBulDutaeql8J2zwDBCzFaZiY2_qy5L0lgNWAjZ4L0r0OPji7N0RZjv2T/exec";

    if (!saved || saved === oldDefault1 || saved === oldDefault2) {
      localStorage.setItem("neo_ilma_gas_url", newDefault);
      return newDefault;
    }

    return saved;
  });

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const fetchWorksheets = async (urlToFetch: string) => {
    setLoading(true);
    setError(null);

    try {
      const queryParam = urlToFetch ? `?url=${encodeURIComponent(urlToFetch)}` : "";
      const response = await fetch(`/api/worksheets${queryParam}`);

      if (!response.ok) {
        throw new Error(`Failed to load data from server: HTTP ${response.status}`);
      }

      const responseData = await response.json();

      if (responseData.success) {
        setWorksheets(Array.isArray(responseData.data) ? responseData.data : []);
      } else if (Array.isArray(responseData.data)) {
        setWorksheets(responseData.data);
        setError(
          responseData.error ||
            "Failed to load Google Sheets data. Showing local fallback resources.",
        );
      } else {
        throw new Error(responseData.error || "Failed to load data from API.");
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "An error occurred while loading data.";
      console.warn("Error fetching worksheets:", err);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorksheets(gasUrl);

    const intervalId = window.setInterval(() => {
      fetchWorksheets(gasUrl);
    }, 5 * 60 * 1000);

    return () => window.clearInterval(intervalId);
  }, [gasUrl]);

  const handleSaveGasUrl = (url: string) => {
    setGasUrl(url);
    localStorage.setItem("neo_ilma_gas_url", url);
    setTestResult(null);
  };

  const handleTestConnection = async (): Promise<boolean> => {
    setTesting(true);
    setTestResult(null);

    try {
      const queryParam = gasUrl ? `?url=${encodeURIComponent(gasUrl)}` : "";
      const response = await fetch(`/api/worksheets${queryParam}`);

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}`);
      }

      const responseData = await response.json();

      if (responseData.success && responseData.source === "gas") {
        const count = Array.isArray(responseData.data) ? responseData.data.length : 0;
        setTestResult({
          success: true,
          message: `Connected successfully! Loaded ${count} resources live from your Google Sheet.`,
        });
        return true;
      }

      throw new Error(
        responseData.error || "Apps Script did not respond with valid resource data.",
      );
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Connection failed. Please check the Web App URL and permissions.";

      setTestResult({ success: false, message });
      return false;
    } finally {
      setTesting(false);
    }
  };

  /**
   * Class selection from Browse by Program.
   *
   * IMPORTANT:
   * - Class stays a complete string: "5 MQ", "6 MQ", "7 AE", etc.
   * - No Number(), parseInt(), or numeric conversion.
   * - We stay on the same Dashboard page.
   * - WorksheetList receives the selected class through `selectedGrade`.
   * - Then we scroll to the existing Resource Finder section.
   */
  const handleClassClick = (className: string) => {
    const normalizedClass = String(className ?? "").trim();

    setSelectedClass(normalizedClass || undefined);
    setActiveView("dashboard");

    window.setTimeout(() => {
      const section = document.getElementById("worksheet-list-section");
      if (section) {
        section.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 80);
  };

  /**
   * Called when the user changes Kelas directly inside Resource Finder.
   * This keeps DashboardStats and WorksheetList synchronized without
   * changing the page or visual structure.
   */
  const handleClassFilterChange = (className: string) => {
    const normalizedClass = String(className ?? "").trim();
    setSelectedClass(normalizedClass || undefined);
  };

  const handleViewChange = (view: string) => {
    if (view === "settings") {
      setActiveView("settings");
      return;
    }

    // Dashboard and Resources both use the same current dashboard layout.
    setActiveView("dashboard");
  };

  return (
    <div
      id="neo-ilma-root"
      className="min-h-screen bg-slate-50 font-sans text-slate-800 antialiased selection:bg-blue-100 selection:text-blue-900"
    >
      <Header
        activeView={activeView}
        onViewChange={handleViewChange}
        gasConfigured={Boolean(gasUrl)}
        onRefresh={() => fetchWorksheets(gasUrl)}
        isRefreshing={loading}
      />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-900 shadow-2xs backdrop-blur-xs sm:text-sm">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div className="space-y-1">
                <p className="font-bold">Notice</p>
                <p className="font-medium leading-relaxed text-amber-800">{error}</p>
                <button
                  onClick={() => fetchWorksheets(gasUrl)}
                  className="flex cursor-pointer items-center gap-1.5 pt-1 text-xs font-extrabold text-blue-700 transition-colors hover:text-blue-900"
                >
                  <RefreshCw className="h-3 w-3" /> Retry
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24">
            <div className="relative">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
              <div className="absolute inset-0 flex items-center justify-center font-display text-xs font-bold text-blue-600">
                Ω
              </div>
            </div>
            <p className="animate-pulse text-xs font-bold uppercase tracking-wider text-slate-500">
              Loading learning resources...
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {activeView === "dashboard" && (
              <div className="space-y-8">
                <DashboardStats
                  worksheets={worksheets}
                  selectedClass={selectedClass}
                  onGradeClick={handleClassClick}
                />

                <div className="border-t border-slate-200/60 pt-6">
                  <WorksheetList
                    worksheets={worksheets}
                    selectedGrade={selectedClass}
                    onGradeChange={handleClassFilterChange}
                  />
                </div>
              </div>
            )}

            {activeView === "settings" && (
              <SettingsPanel
                gasUrl={gasUrl}
                onSaveGasUrl={handleSaveGasUrl}
                onTestConnection={handleTestConnection}
                testing={testing}
                testResult={testResult}
              />
            )}
          </div>
        )}
      </main>

      <footer className="mt-20 border-t border-slate-200 bg-white py-10 text-center text-xs text-slate-400">
        <div className="mx-auto max-w-7xl space-y-3 px-4 sm:px-6 lg:px-8">
          <p className="font-display font-bold text-slate-700">
            NEO ILMA &bull; Learning Resources Bank
          </p>
          <p className="mx-auto max-w-md text-[11px] leading-relaxed">
            Created to facilitate teachers, students, and parents in accessing worksheets and learning materials anywhere and anytime.
          </p>
          <p className="text-[10px] text-slate-300">
            &copy; 2026 Istiqomah&apos;s House of Harmony Team x AL-WILDAN ISLAMIC SCHOOL 10 JAKARTA. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}