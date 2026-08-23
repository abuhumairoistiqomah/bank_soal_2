import type { IncomingMessage, ServerResponse } from "node:http";

const DEFAULT_GAS_URL =
  process.env.APPS_SCRIPT_URL ||
  "https://script.google.com/macros/s/AKfycbw8GU3fdLoPqT2e1cFDeesfK5MuSvht3IJrcvPf_P8CU8y8vzyIJ4L1t8y9vMnWaiRn/exec";

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function formatClassName(value: unknown): string {
  const text = clean(value).replace(/\s+/g, " ");
  const match = text.match(/^(\d+)\s+(inter|mq|ae)$/i);
  if (!match) return text;

  const [, numberPart, programRaw] = match;
  const program = programRaw.toLowerCase();
  if (program === "inter") return `${numberPart} Inter`;
  if (program === "mq") return `${numberPart} MQ`;
  if (program === "ae") return `${numberPart} AE`;
  return text;
}

function parseTargetClasses(grade: unknown): string[] {
  const text = clean(grade);
  if (!text) return [];

  const seen = new Set<string>();
  const result: string[] = [];

  text
    .split(/\s+[-–—]\s+/)
    .map((value) => formatClassName(value))
    .filter(Boolean)
    .forEach((value) => {
      const key = value.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        result.push(value);
      }
    });

  return result;
}

function normalizeTargetClasses(rawTargets: unknown, grade: string): string[] {
  if (Array.isArray(rawTargets)) {
    const seen = new Set<string>();
    const normalized = rawTargets
      .map((value) => formatClassName(value))
      .filter(Boolean)
      .filter((value) => {
        const key = value.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

    if (normalized.length > 0) return normalized;
  }

  return parseTargetClasses(grade);
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: {
        Accept: "application/json,text/plain,*/*",
      },
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchGasWithRetry(gasUrl: string): Promise<unknown[]> {
  const attempts = 2;
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const response = await fetchWithTimeout(gasUrl, 15_000);

      if (!response.ok) {
        throw new Error(`Google Apps Script returned HTTP ${response.status}`);
      }

      const text = await response.text();
      let data: unknown;

      try {
        data = JSON.parse(text);
      } catch {
        if (gasUrl.trim().endsWith("/dev")) {
          throw new Error(
            "Google Apps Script URL ends with '/dev'. Use the deployed Web App URL ending in '/exec'.",
          );
        }

        const lowerText = text.trim().toLowerCase();
        if (lowerText.startsWith("<!doctype html") || lowerText.startsWith("<html")) {
          throw new Error(
            "Google Apps Script returned HTML instead of JSON. Check Web App deployment access.",
          );
        }

        throw new Error("Invalid JSON response from Google Apps Script.");
      }

      if (!Array.isArray(data)) {
        const message =
          data && typeof data === "object" && "message" in data
            ? clean((data as { message?: unknown }).message)
            : "";
        throw new Error(message || "Google Apps Script response is not a resource array.");
      }

      return data;
    } catch (error) {
      lastError = error;

      if (attempt < attempts) {
        await new Promise((resolve) => setTimeout(resolve, 700));
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Failed to fetch Google Apps Script data.");
}

function standardizeData(data: unknown[]) {
  return data
    .map((rawItem: unknown, idx: number) => {
      const item =
        rawItem && typeof rawItem === "object"
          ? (rawItem as Record<string, unknown>)
          : {};

      const findVal = (keys: string[], defaultVal: unknown = "") => {
        for (const key of Object.keys(item)) {
          const normalizedKey = key.toLowerCase().trim();
          if (
            keys.some((candidate) => {
              const normalizedCandidate = candidate.toLowerCase().trim();
              return (
                normalizedKey === normalizedCandidate ||
                normalizedKey.includes(normalizedCandidate)
              );
            })
          ) {
            return item[key];
          }
        }
        return defaultVal;
      };

      const id = clean(item.id || item.ID || findVal(["id"])) || `gas_${idx + 1}`;
      const grade = clean(
        item.grade || item.Grade || item.Kelas || findVal(["grade", "kelas", "class"]),
      );
      const subject =
        clean(
          item.subject ||
            item.Subject ||
            item["Mata Pelajaran"] ||
            item.mata_pelajaran ||
            findVal(["subject", "mata pelajaran", "matapelajaran", "mapel"]),
        ) || "Math";
      const chapter = clean(
        item.chapter || item.Chapter || item.Bab || findVal(["chapter", "bab"]),
      );
      const topic = clean(
        item.topic ||
          item.Topic ||
          item.Topik ||
          findVal(["topic", "topik", "sub-bab", "sub bab", "subbab"]),
      );
      const type = clean(
        item.type ||
          item.Type ||
          item.Tipe ||
          findVal(["type", "tipe", "format", "jenis file"]),
      );
      const link = clean(item.link || item.Link || item.URL || findVal(["link", "url"]));
      const uploader = clean(
        item.uploader ||
          item.Uploader ||
          item.teacher ||
          item.Teacher ||
          item.contributor ||
          item.Contributor ||
          findVal(["uploader", "teacher", "contributor", "pengunggah"]),
      );

      return {
        ...item,
        id,
        grade,
        subject,
        chapter,
        topic,
        type,
        link,
        ...(uploader ? { uploader } : {}),
        targetClasses: normalizeTargetClasses(item.targetClasses, grade),
      };
    })
    .filter((item) => item.id || item.link);
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method && req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return sendJson(res, 405, {
      success: false,
      error: "Method not allowed.",
    });
  }

  try {
    const requestUrl = new URL(req.url || "/api/worksheets", "http://localhost");
    const requestedGasUrl = clean(requestUrl.searchParams.get("url"));
    const gasUrl = requestedGasUrl || DEFAULT_GAS_URL;

    if (!gasUrl) {
      res.setHeader("Cache-Control", "no-store");
      return sendJson(res, 200, {
        success: false,
        error: "Google Apps Script URL is not configured.",
        data: [],
      });
    }

    const rawData = await fetchGasWithRetry(gasUrl);
    const standardizedData = standardizeData(rawData);

    // Always ask GAS for the latest successful dataset.
    // Frontend localStorage remains the last-known-good fallback, so we keep
    // stability without allowing Vercel CDN to serve stale metadata such as
    // a newly-added Uploader column.
    res.setHeader("Cache-Control", "no-store");

    return sendJson(res, 200, {
      success: true,
      source: "gas",
      data: standardizedData,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to load Google Apps Script data.";

    console.warn("/api/worksheets upstream error:", message);
    res.setHeader("Cache-Control", "no-store");

    // Intentionally return HTTP 200 so a temporary upstream problem does not
    // turn into an application-level HTTP 500 page. The frontend can keep its
    // last successful cache and decide how to display the warning.
    return sendJson(res, 200, {
      success: false,
      source: "upstream-error",
      error: message,
      data: [],
    });
  }
}