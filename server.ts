import express from "express";
import path from "path";
import dotenv from "dotenv";
import { defaultWorksheets } from "./src/data/defaultWorksheets";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

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

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

app.get("/api/worksheets", async (req, res) => {
  const gasUrl =
    (req.query.url as string) ||
    process.env.APPS_SCRIPT_URL ||
    "https://script.google.com/macros/s/AKfycbw8GU3fdLoPqT2e1cFDeesfK5MuSvht3IJrcvPf_P8CU8y8vzyIJ4L1t8y9vMnWaiRn/exec";

  if (!gasUrl) {
    return res.json({
      success: true,
      source: "local",
      data: defaultWorksheets,
    });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25_000);

    const response = await fetch(gasUrl, {
      method: "GET",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

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
          "Your Google Apps Script URL ends with '/dev'. Use a deployed Web App URL ending in '/exec'.",
        );
      }

      const lowerText = text.trim().toLowerCase();
      if (lowerText.startsWith("<!doctype html") || lowerText.startsWith("<html")) {
        throw new Error(
          "Google Apps Script returned HTML instead of JSON. Make sure the Web App is deployed with access set to 'Anyone'.",
        );
      }

      throw new Error("Invalid JSON response from Google Apps Script web app.");
    }

    if (!Array.isArray(data)) {
      const message =
        data && typeof data === "object" && "message" in data
          ? clean((data as { message?: unknown }).message)
          : "";
      throw new Error(
        message || "Response from Google Apps Script is not an array of resources.",
      );
    }

    const standardizedData = data
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
          grade, // IMPORTANT: always string; never parseInt/Number.
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

    return res.json({
      success: true,
      source: "gas",
      data: standardizedData,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch from Google Apps Script.";

    console.warn("Error fetching resources from Apps Script:", message);

    return res.json({
      success: false,
      error: message,
      source: "fallback",
      data: defaultWorksheets,
    });
  }
});

async function run() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server started on http://localhost:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  run();
}

export default app;
