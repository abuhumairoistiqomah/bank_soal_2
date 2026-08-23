import express from "express";
import path from "path";
import dotenv from "dotenv";
import { defaultWorksheets } from "./src/data/defaultWorksheets";

dotenv.config();

const app = express();
const PORT = 3000;

// Allow JSON parsing
app.use(express.json());

// Health Check API
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Fetch Worksheets API Proxy
app.get("/api/worksheets", async (req, res) => {
  const gasUrl = (req.query.url as string) || process.env.APPS_SCRIPT_URL || "https://script.google.com/macros/s/AKfycbw8GU3fdLoPqT2e1cFDeesfK5MuSvht3IJrcvPf_P8CU8y8vzyIJ4L1t8y9vMnWaiRn/exec";

  if (!gasUrl) {
    return res.json({
      success: true,
      source: "local",
      data: defaultWorksheets
    });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 seconds timeout

    const response = await fetch(gasUrl, {
      method: "GET",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Google Apps Script returned HTTP ${response.status}`);
    }

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      if (gasUrl.trim().endsWith("/dev")) {
        throw new Error(
          "Your Google Apps Script URL ends with '/dev'. This URL requires developer authentication and cannot be accessed by the server. " +
          "Please deploy your script as a Web App (Deploy > New deployment), set 'Who has access' to 'Anyone', and use the URL ending in '/exec'."
        );
      }
      if (text.trim().toLowerCase().startsWith("<!doctype html") || text.trim().toLowerCase().startsWith("<html")) {
        throw new Error(
          "Google Apps Script returned an HTML page (likely a login or permission prompt) instead of JSON data. " +
          "Please verify that you have deployed the script as a Web App, set 'Who has access' to 'Anyone', and that you are using the '/exec' URL."
        );
      }
      throw new Error("Invalid JSON response from Google Apps Script web app.");
    }

    // Standardize GAS responses
    if (!Array.isArray(data)) {
      throw new Error("Response from Google Apps Script is not an array of worksheets.");
    }

    // ============================================================
    // EXPRESS / PROXY DATA SAFETY (GRADE STRING PRESERVATION)
    // - grade MUST remain STRING (e.g. "6 MQ", "6 Inter - 6 MQ")
    // - Never use Number(item.grade) or parseInt(item.grade)
    // - Preserves raw Grade values without splitting database rows
    // ============================================================
    const standardizedData = data.map((item: any, idx: number) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      // Safe string normalization helper
      const toSafeString = (val: any, fallback = ""): string => {
        if (val === null || val === undefined) return fallback;
        const str = String(val).trim();
        return str !== "" ? str : fallback;
      };

      // Case-insensitive key lookup across bilingual variations
      const findKeyVal = (candidateKeys: string[], defaultVal = ""): string => {
        for (const k of Object.keys(item)) {
          const lowerK = k.toLowerCase().replace(/[\s_-]/g, "");
          for (const cand of candidateKeys) {
            const lowerCand = cand.toLowerCase().replace(/[\s_-]/g, "");
            if (lowerK === lowerCand) {
              return toSafeString(item[k], defaultVal);
            }
          }
        }
        return defaultVal;
      };

      try {
        const rawId = item.id ?? item.ID ?? item.Id ?? findKeyVal(["id"], `gas_${idx + 1}`);
        // Extract raw grade as a string - never convert to Number or parseInt
        const rawGrade = String(
          item.grade ?? item.Grade ?? item.Kelas ?? item.kelas ?? findKeyVal(["grade", "kelas"], "") ?? ""
        ).trim();

        const rawSubject = item.subject ?? item.Subject ?? item["Mata Pelajaran"] ?? item["mata pelajaran"] ?? item.mapel ?? item.Mapel ?? findKeyVal(["subject", "mata pelajaran", "matapelajaran", "mapel"], "Math");
        const rawChapter = item.chapter ?? item.Chapter ?? item.Bab ?? item.bab ?? findKeyVal(["chapter", "bab"], "General");
        const rawTopic = item.topic ?? item.Topic ?? item.Topik ?? item.topik ?? findKeyVal(["topic", "topik"], "General Topic");
        const rawType = item.type ?? item.Type ?? item.Tipe ?? item.tipe ?? item.format ?? item.Format ?? findKeyVal(["type", "tipe", "format"], "PDF");
        const rawLink = item.link ?? item.Link ?? item.url ?? item.URL ?? item.Url ?? findKeyVal(["link", "url"], "#");

        // Normalize grade as String: handle legacy bare single digits if needed, while keeping full strings intact
        let cleanGrade = rawGrade || "1 Inter";
        if (/^[1-6]$/.test(cleanGrade)) {
          cleanGrade = `${cleanGrade} Inter`;
        } else if (/^(7|8|9|10|11|12)$/.test(cleanGrade)) {
          cleanGrade = `${cleanGrade} AE`;
        }

        return {
          id: toSafeString(rawId, `gas_${idx + 1}`),
          grade: cleanGrade, // Strictly preserved as String (e.g. "6 MQ", "6 Inter - 6 MQ")
          subject: toSafeString(rawSubject, "Math"),
          chapter: toSafeString(rawChapter, "General"),
          topic: toSafeString(rawTopic, "General Topic"),
          type: toSafeString(rawType, "PDF"),
          link: toSafeString(rawLink, "#"),
        };
      } catch (rowErr) {
        // Safe row-level fallback so an individual malformed row never crashes the whole response
        console.warn(`[Proxy Data Safety] Error normalizing row #${idx}:`, rowErr);
        return {
          id: `gas_${idx + 1}`,
          grade: "1 Inter",
          subject: "Math",
          chapter: "General",
          topic: "General Topic",
          type: "PDF",
          link: "#",
        };
      }
    }).filter((item: any) => item !== null && (item.id || item.link));

    return res.json({
      success: true,
      source: "gas",
      data: standardizedData
    });
  } catch (error: any) {
    console.warn("Error fetching worksheets from Apps Script (expected fallback to local database):", error.message);
    return res.json({
      success: false,
      error: error.message || "Failed to fetch from GAS. Please ensure deployment is active and permissions are set to 'Anyone'.",
      source: "fallback",
      data: defaultWorksheets
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
    app.get("*", (req, res) => {
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
