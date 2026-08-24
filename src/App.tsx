import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import Header from "./components/Header";
import DashboardStats from "./components/DashboardStats";
import WorksheetList from "./components/WorksheetList";
import SettingsPanel from "./components/SettingsPanel";
import type { Worksheet } from "./types";
import { AlertCircle, RefreshCw } from "lucide-react";

const GAS_URL_STORAGE_KEY = "neo_ilma_gas_url";

// New cache version, while still being able to read older last-good caches.
const RESOURCE_CACHE_KEY = "neo_ilma_resource_cache_v3";
const LEGACY_RESOURCE_CACHE_KEYS = [
  "neo_ilma_resource_cache_v2",
  "neo_ilma_resource_cache_v1",
];

const DEFAULT_GAS_URL =
  "https://script.google.com/macros/s/AKfycbw8GU3fdLoPqT2e1cFDeesfK5MuSvht3IJrcvPf_P8CU8y8vzyIJ4L1t8y9vMnWaiRn/exec";

const OLD_DEFAULT_URLS = new Set([
  "https://script.google.com/macros/s/AKfycbwBTRmtT5LGquctbs_o2VxvGclxGrcul6-OmOnsx_21LaUeYhVeGNXTsWVVL2bCt1I/exec",
  "https://script.google.com/macros/s/AKfycbzd4NPDov5GY-0UPZTpllomC6KbMnyD23pOUQk9hV4/dev",
  "https://script.google.com/macros/s/AKfycbzRozJ8E2jXBulDutaeql8J2zwDBCzFaZiY2_qy5L0lgNWAjZ4L0r0OPji7N0RZjv2T/exec",
]);

const ONE_HOUR_MS = 60 * 60 * 1000;

type CachedResources = {
  gasUrl: string;
  savedAt: number;
  data: Worksheet[];
};

type FetchOptions = {
  manual?: boolean;
  showErrorWithCachedData?: boolean;
};

function getInitialGasUrl(): string {
  const saved = localStorage.getItem(GAS_URL_STORAGE_KEY);

  if (!saved || OLD_DEFAULT_URLS.has(saved)) {
    localStorage.setItem(GAS_URL_STORAGE_KEY, DEFAULT_GAS_URL);
    return DEFAULT_GAS_URL;
  }

  return saved;
}

function readResourceCache(gasUrl: string): CachedResources | null {
  const keys = [RESOURCE_CACHE_KEY, ...LEGACY_RESOURCE_CACHE_KEYS];

  for (const key of keys) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;

      const parsed = JSON.parse(raw) as Partial<CachedResources>;

      if (
        parsed.gasUrl === gasUrl &&
        Array.isArray(parsed.data)
      ) {
        return {
          gasUrl,
          savedAt:
            typeof parsed.savedAt === "number" && Number.isFinite(parsed.savedAt)
              ? parsed.savedAt
              : 0,
          data: parsed.data as Worksheet[],
        };
      }
    } catch {
      // Try the next cache version.
    }
  }

  return null;
}

function writeResourceCache(
  gasUrl: string,
  data: Worksheet[],
  savedAt: number,
) {
  try {
    const cache: CachedResources = {
      gasUrl,
      savedAt,
      data,
    };

    localStorage.setItem(
      RESOURCE_CACHE_KEY,
      JSON.stringify(cache),
    );
  } catch (error) {
    console.warn(
      "Unable to save NEO ILMA resource cache:",
      error,
    );
  }
}

function localHourKey(timestamp: number): string {
  const date = new Date(timestamp);

  return [
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    date.getHours(),
  ].join("-");
}

/**
 * Refresh when the clock has crossed into a new local hour.
 *
 * Examples:
 * 00:50 -> 01:05 = refresh, even though only 15 minutes passed.
 * This matters on mobile because browsers can suspend background timers.
 */
function hasCrossedHourBoundary(
  lastUpdatedAt: number | null,
  now = Date.now(),
): boolean {
  if (!lastUpdatedAt) return true;

  return localHourKey(lastUpdatedAt) !== localHourKey(now);
}

function msUntilNextHour(): number {
  const now = new Date();
  const nextHour = new Date(now);

  nextHour.setHours(now.getHours() + 1, 0, 0, 0);

  return Math.max(
    1_000,
    nextHour.getTime() - now.getTime(),
  );
}

async function fetchWithTimeout(
  url: string,
  timeoutMs = 18_000,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(
    () => controller.abort(),
    timeoutMs,
  );

  try {
    return await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function parseJsonResponse(
  response: Response,
): Promise<Record<string, unknown>> {
  const text = await response.text();
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();

  if (
    lower.startsWith("<!doctype html") ||
    lower.startsWith("<html")
  ) {
    throw new Error(
      "Server returned an HTML page instead of resource data.",
    );
  }

  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new Error(
      "Server returned an invalid JSON response.",
    );
  }
}

export default function App() {
  // Dashboard remains the main page.
  // Selecting a class only updates Resource Finder and scrolls to it.
  const [activeView, setActiveView] =
    useState<"dashboard" | "settings">("dashboard");

  const [selectedClass, setSelectedClass] =
    useState<string | undefined>(undefined);

  const [gasUrl, setGasUrl] =
    useState<string>(() => getInitialGasUrl());

  const initialCacheRef =
    useRef<CachedResources | null>(null);

  if (initialCacheRef.current === null) {
    initialCacheRef.current =
      readResourceCache(gasUrl);
  }

  const initialCache = initialCacheRef.current;

  const [worksheets, setWorksheets] =
    useState<Worksheet[]>(
      () => initialCache?.data ?? [],
    );

  const [lastUpdatedAt, setLastUpdatedAt] =
    useState<number | null>(
      () =>
        initialCache?.savedAt
          ? initialCache.savedAt
          : null,
    );

  const [loading, setLoading] =
    useState(
      () => (initialCache?.data?.length ?? 0) === 0,
    );

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [testing, setTesting] =
    useState(false);

  const [testResult, setTestResult] =
    useState<{
      success: boolean;
      message: string;
    } | null>(null);

  // Refs prevent stale closures inside hourly/mobile lifecycle handlers.
  const worksheetsRef =
    useRef<Worksheet[]>(
      initialCache?.data ?? [],
    );

  const lastUpdatedAtRef =
    useRef<number | null>(
      initialCache?.savedAt
        ? initialCache.savedAt
        : null,
    );

  const fetchInFlightRef =
    useRef(false);

  useEffect(() => {
    worksheetsRef.current = worksheets;
  }, [worksheets]);

  useEffect(() => {
    lastUpdatedAtRef.current = lastUpdatedAt;
  }, [lastUpdatedAt]);

  const fetchWorksheets = useCallback(
    async (
      urlToFetch: string,
      options: FetchOptions = {},
    ): Promise<boolean> => {
      const {
        manual = false,
        showErrorWithCachedData = false,
      } = options;

      // Do not stack automatic requests if focus/visibility/hour events
      // happen at nearly the same time.
      if (fetchInFlightRef.current) {
        return false;
      }

      fetchInFlightRef.current = true;

      const hasExistingData =
        worksheetsRef.current.length > 0;

      if (hasExistingData) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      if (!hasExistingData || manual) {
        setError(null);
      }

      const queryParam =
        urlToFetch
          ? `?url=${encodeURIComponent(urlToFetch)}`
          : "";

      const endpoint =
        `/api/worksheets${queryParam}`;

      let lastError: unknown;

      try {
        // Retry once for a short Vercel/GAS hiccup.
        for (
          let attempt = 1;
          attempt <= 2;
          attempt++
        ) {
          try {
            const response =
              await fetchWithTimeout(endpoint);

            if (!response.ok) {
              throw new Error(
                `Failed to load data from server: HTTP ${response.status}`,
              );
            }

            const responseData =
              await parseJsonResponse(response);

            if (
              responseData.success !== true ||
              !Array.isArray(responseData.data)
            ) {
              throw new Error(
                typeof responseData.error === "string"
                  ? responseData.error
                  : "Failed to load data from API.",
              );
            }

            const nextWorksheets =
              responseData.data as Worksheet[];

            const successTime =
              Date.now();

            worksheetsRef.current =
              nextWorksheets;

            lastUpdatedAtRef.current =
              successTime;

            setWorksheets(
              nextWorksheets,
            );

            setLastUpdatedAt(
              successTime,
            );

            writeResourceCache(
              urlToFetch,
              nextWorksheets,
              successTime,
            );

            setError(null);

            return true;
          } catch (attemptError) {
            lastError = attemptError;

            if (attempt < 2) {
              await new Promise(
                (resolve) =>
                  window.setTimeout(
                    resolve,
                    800,
                  ),
              );
            }
          }
        }

        throw lastError;
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : "An error occurred while loading data.";

        console.warn(
          "Error fetching worksheets:",
          err,
        );

        // Background failure stays silent if usable data already exists.
        // Manual refresh still shows the problem to the user.
        if (
          !hasExistingData ||
          showErrorWithCachedData
        ) {
          setError(message);
        }

        return false;
      } finally {
        fetchInFlightRef.current =
          false;

        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  // INITIAL LOAD:
  // Always try the network on app open / GAS URL change.
  // Cached data can still be displayed immediately while the request runs.
  useEffect(() => {
    void fetchWorksheets(gasUrl);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gasUrl]);

  // TOP OF EVERY HOUR:
  // 00:00, 01:00, 02:00, ...
  useEffect(() => {
    let hourlyIntervalId:
      | number
      | undefined;

    const firstHourlyTimeoutId =
      window.setTimeout(() => {
        void fetchWorksheets(gasUrl);

        hourlyIntervalId =
          window.setInterval(() => {
            void fetchWorksheets(gasUrl);
          }, ONE_HOUR_MS);
      }, msUntilNextHour());

    return () => {
      window.clearTimeout(
        firstHourlyTimeoutId,
      );

      if (
        hourlyIntervalId !== undefined
      ) {
        window.clearInterval(
          hourlyIntervalId,
        );
      }
    };
  }, [gasUrl, fetchWorksheets]);

  // MOBILE / BACKGROUND RECOVERY:
  // Mobile browsers often pause timers while the tab/app is sleeping.
  // When the user returns, refresh if the local clock hour has changed.
  useEffect(() => {
    const refreshIfHourChanged = () => {
      if (
        document.visibilityState === "hidden"
      ) {
        return;
      }

      if (
        hasCrossedHourBoundary(
          lastUpdatedAtRef.current,
        )
      ) {
        void fetchWorksheets(gasUrl);
      }
    };

    const handleVisibilityChange = () => {
      if (
        document.visibilityState === "visible"
      ) {
        refreshIfHourChanged();
      }
    };

    window.addEventListener(
      "focus",
      refreshIfHourChanged,
    );

    window.addEventListener(
      "pageshow",
      refreshIfHourChanged,
    );

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange,
    );

    return () => {
      window.removeEventListener(
        "focus",
        refreshIfHourChanged,
      );

      window.removeEventListener(
        "pageshow",
        refreshIfHourChanged,
      );

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange,
      );
    };
  }, [gasUrl, fetchWorksheets]);

  const handleSaveGasUrl = (
    url: string,
  ) => {
    setGasUrl(url);

    localStorage.setItem(
      GAS_URL_STORAGE_KEY,
      url,
    );

    setTestResult(null);

    const cachedForNewUrl =
      readResourceCache(url);

    if (
      cachedForNewUrl &&
      cachedForNewUrl.data.length > 0
    ) {
      worksheetsRef.current =
        cachedForNewUrl.data;

      lastUpdatedAtRef.current =
        cachedForNewUrl.savedAt || null;

      setWorksheets(
        cachedForNewUrl.data,
      );

      setLastUpdatedAt(
        cachedForNewUrl.savedAt || null,
      );

      setLoading(false);
    } else {
      worksheetsRef.current = [];
      lastUpdatedAtRef.current = null;

      setWorksheets([]);
      setLastUpdatedAt(null);
      setLoading(true);
    }
  };

  const handleTestConnection =
    async (): Promise<boolean> => {
      setTesting(true);
      setTestResult(null);

      try {
        const queryParam =
          gasUrl
            ? `?url=${encodeURIComponent(gasUrl)}`
            : "";

        const response =
          await fetchWithTimeout(
            `/api/worksheets${queryParam}`,
          );

        if (!response.ok) {
          throw new Error(
            `HTTP Error ${response.status}`,
          );
        }

        const responseData =
          await parseJsonResponse(response);

        if (
          responseData.success === true &&
          responseData.source === "gas"
        ) {
          const count =
            Array.isArray(
              responseData.data,
            )
              ? responseData.data.length
              : 0;

          setTestResult({
            success: true,
            message:
              `Connected successfully! Loaded ${count} resources live from your Google Sheet.`,
          });

          return true;
        }

        throw new Error(
          typeof responseData.error === "string"
            ? responseData.error
            : "Apps Script did not respond with valid resource data.",
        );
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : "Connection failed. Please check the Web App URL and permissions.";

        setTestResult({
          success: false,
          message,
        });

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
   */
  const handleClassClick = (
    className: string,
  ) => {
    const normalizedClass =
      String(className ?? "").trim();

    setSelectedClass(
      normalizedClass || undefined,
    );

    setActiveView("dashboard");

    window.setTimeout(() => {
      const section =
        document.getElementById(
          "worksheet-list-section",
        );

      if (section) {
        section.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 80);
  };

  const handleClassFilterChange = (
    className: string,
  ) => {
    const normalizedClass =
      String(className ?? "").trim();

    setSelectedClass(
      normalizedClass || undefined,
    );
  };

  const handleViewChange = (
    view: string,
  ) => {
    if (view === "settings") {
      setActiveView("settings");
      return;
    }

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
          fetchWorksheets(
            gasUrl,
            {
              manual: true,
              showErrorWithCachedData: true,
            },
          )
        }
        isRefreshing={refreshing}
      />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-900 shadow-2xs backdrop-blur-xs sm:text-sm">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />

              <div className="space-y-1">
                <p className="font-bold">
                  Notice
                </p>

                <p className="font-medium leading-relaxed text-amber-800">
                  {error}
                </p>

                <button
                  onClick={() =>
                    fetchWorksheets(
                      gasUrl,
                      {
                        manual: true,
                        showErrorWithCachedData: true,
                      },
                    )
                  }
                  className="flex cursor-pointer items-center gap-1.5 pt-1 text-xs font-extrabold text-blue-700 transition-colors hover:text-blue-900"
                >
                  <RefreshCw className="h-3 w-3" />
                  Retry
                </button>
              </div>
            </div>
          </div>
        )}

        {loading &&
        worksheets.length === 0 ? (
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
            {activeView ===
              "dashboard" && (
              <div className="space-y-8">
                <DashboardStats
                  worksheets={
                    worksheets
                  }
                  selectedClass={
                    selectedClass
                  }
                  onGradeClick={
                    handleClassClick
                  }
                  lastUpdatedAt={
                    lastUpdatedAt
                  }
                  isRefreshing={
                    refreshing
                  }
                />

                <div className="border-t border-slate-200/60 pt-6">
                  <WorksheetList
                    worksheets={
                      worksheets
                    }
                    selectedGrade={
                      selectedClass
                    }
                    onGradeChange={
                      handleClassFilterChange
                    }
                  />
                </div>
              </div>
            )}

            {activeView ===
              "settings" && (
              <SettingsPanel
                gasUrl={gasUrl}
                onSaveGasUrl={
                  handleSaveGasUrl
                }
                onTestConnection={
                  handleTestConnection
                }
                testing={testing}
                testResult={
                  testResult
                }
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