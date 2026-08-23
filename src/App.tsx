import React, { useEffect, useRef, useState } from "react";
import Header from "./components/Header";
import DashboardStats from "./components/DashboardStats";
import WorksheetList from "./components/WorksheetList";
import SettingsPanel from "./components/SettingsPanel";
import type { Worksheet } from "./types";
import { AlertCircle, RefreshCw } from "lucide-react";

const GAS_URL_STORAGE_KEY = "neo_ilma_gas_url";
const RESOURCE_CACHE_KEY = "neo_ilma_resource_cache_v1";

const DEFAULT_GAS_URL =
  "https://script.google.com/macros/s/AKfycbw8GU3fdLoPqT2e1cFDeesfK5MuSvht3IJrcvPf_P8CU8y8vzyIJ4L1t8y9vMnWaiRn/exec";

const OLD_DEFAULT_URLS = new Set([
  "https://script.google.com/macros/s/AKfycbwBTRmtT5LGquctbs_o2VxvGclxGrcul6-OmOnsx_21LaUeYhVeGNXTsWVVL2bCt1I/exec",
  "https://script.google.com/macros/s/AKfycbzd4NPDov5GY-0UPZTpllomC6KbMnyD23pOUQk9hV4/dev",
]);

type CachedResources = {
  gasUrl: string;
  savedAt: number;
  data: Worksheet[];
};

function getInitialGasUrl(): string {
  const saved = localStorage.getItem(GAS_URL_STORAGE_KEY);

  if (!saved || OLD_DEFAULT_URLS.has(saved)) {
    localStorage.setItem(GAS_URL_STORAGE_KEY, DEFAULT_GAS_URL);
    return DEFAULT_GAS_URL;
  }

  return saved;
}

function readResourceCache(gasUrl: string): Worksheet[] {
  try {
    const raw = localStorage.getItem(RESOURCE_CACHE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as Partial<CachedResources>;
    if (parsed.gasUrl !== gasUrl || !Array.isArray(parsed.data)) return [];

    return parsed.data as Worksheet[];
  } catch {
    return [];
  }
}

function writeResourceCache(gasUrl: string, data: Worksheet[]) {
  try {
    const cache: CachedResources = {
      gasUrl,
      savedAt: Date.now(),
      data,
    };
    localStorage.setItem(RESOURCE_CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.warn("Unable to save NEO ILMA resource cache:", error);
  }
}

async function fetchWithTimeout(url: string, timeoutMs = 18_000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export default function App() {
  // Keep the current UI model: Dashboard remains the main page.
  // Selecting a class only updates the Resource Finder below and scrolls to it.
  const [activeView, setActiveView] = useState<"dashboard" | "settings">("dashboard");
  const [selectedClass, setSelectedClass] = useState<string | undefined>(undefined);

  const [gasUrl, setGasUrl] = useState<string>(() => getInitialGasUrl());

  // Load the last known-good dataset immediately if available.
  // This prevents a temporary network/server hiccup from blanking the application.
  const initialCacheRef = useRef<Worksheet[] | null>(null);
  if (initialCacheRef.current === null) {
    initialCacheRef.current = readResourceCache(gasUrl);
  }

  const [worksheets, setWorksheets] = useState<Worksheet[]>(() => initialCacheRef.current || []);
  const [loading, setLoading] = useState(() => (initialCacheRef.current || []).length === 0);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const fetchWorksheets = async (
    urlToFetch: string,
    options: { manual?: boolean; showErrorWithCachedData?: boolean } = {},
  ) => {
    const { manual = false, showErrorWithCachedData = false } = options;
    const hasExistingData = worksheets.length > 0;

    if (manual) {
      setRefreshing(true);
    } else if (!hasExistingData) {
      setLoading(true);
    }

    if (!hasExistingData || manual) {
      setError(null);
    }

    const queryParam = urlToFetch ? `?url=${encodeURIComponent(urlToFetch)}` : "";
    const endpoint = `/api/worksheets${queryParam}`;

    let lastError: unknown;

    try {
      // Retry once for a short Vercel/GAS hiccup.
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const response = await fetchWithTimeout(endpoint);

          if (!response.ok) {
            throw new Error(`Failed to load data from server: HTTP ${response.status}`);
          }

          const responseData = await response.json();

          if (!responseData.success || !Array.isArray(responseData.data)) {
            throw new Error(responseData.error || "Failed to load data from API.");
          }

          const nextWorksheets = responseData.data as Worksheet[];
          setWorksheets(nextWorksheets);
          writeResourceCache(urlToFetch, nextWorksheets);
          setError(null);
          return;
        } catch (attemptError) {
          lastError = attemptError;

          if (attempt < 2) {
            await new Promise((resolve) => window.setTimeout(resolve, 800));
          }
        }
      }

      throw lastError;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "An error occurred while loading data.";
      console.warn("Error fetching worksheets:", err);

      // Stability rule: keep the last successful dataset on screen.
      // Automatic/background failure stays silent when usable cached data exists.
      if (!hasExistingData || showErrorWithCachedData) {
        setError(message);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Deliberately load only once per app open / GAS URL change.
    // NO 5-minute polling. Manual refresh remains available in the existing header.
    fetchWorksheets(gasUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gasUrl]);

  const handleSaveGasUrl = (url: string) => {
    setGasUrl(url);
    localStorage.setItem(GAS_URL_STORAGE_KEY, url);
    setTestResult(null);

    const cachedForNewUrl = readResourceCache(url);
    if (cachedForNewUrl.length > 0) {
      setWorksheets(cachedForNewUrl);
      setLoading(false);
    } else {
      setWorksheets([]);
      setLoading(true);
    }
  };

  const handleTestConnection = async (): Promise<boolean> => {
    setTesting(true);
    setTestResult(null);

    try {
      const queryParam = gasUrl ? `?url=${encodeURIComponent(gasUrl)}` : "";
      const response = await fetchWithTimeout(`/api/worksheets${queryParam}`);

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
        onRefresh={() =>
          fetchWorksheets(gasUrl, { manual: true, showErrorWithCachedData: true })
        }
        isRefreshing={refreshing}
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
                  onClick={() =>
                    fetchWorksheets(gasUrl, {
                      manual: true,
                      showErrorWithCachedData: true,
                    })
                  }
                  className="flex cursor-pointer items-center gap-1.5 pt-1 text-xs font-extrabold text-blue-700 transition-colors hover:text-blue-900"
                >
                  <RefreshCw className="h-3 w-3" /> Retry
                </button>
              </div>
            </div>
          </div>
        )}

        {loading && worksheets.length === 0 ? (
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
