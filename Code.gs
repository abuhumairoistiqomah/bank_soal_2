/**
 * =====================================================
 * NEO ILMA - GOOGLE APPS SCRIPT API
 * =====================================================
 * Web App script to fetch worksheet & learning resources
 * data from Google Sheets into JSON format.
 *
 * Database Header:
 * ID | Grade | Subject | Chapter | Topic | Type | Link
 *
 * Grade values preserved as exact raw string (e.g. "6 MQ", "6 Inter - 6 MQ").
 * Does not split database rows in Code.gs. Frontend handles target-class parsing.
 * =====================================================
 */

// =====================================================
// CONFIGURATION
// =====================================================
var CONFIG = {
  // Enter SPREADSHEET_ID from your Google Sheet URL if running standalone.
  // Leave empty ("") if this script is attached directly to the Google Sheet (Extensions > Apps Script).
  SPREADSHEET_ID: "",

  // Sheet/tab name containing the worksheet data.
  // Defaults to "Sheet1" or "Worksheets". If not found, uses the first sheet.
  SHEET_NAME: "Sheet1",

  // Legacy records without a Subject will default to this value.
  DEFAULT_SUBJECT: "Math"
};

// =====================================================
// HTTP ENDPOINT
// =====================================================
function doGet(e) {
  try {
    var worksheets = getWorksheets();
    return createJsonResponse(worksheets);
  } catch (err) {
    return createJsonResponse({
      success: false,
      error: "Error loading worksheets: " + err.message
    });
  }
}

// =====================================================
// WORKSHEET DATA
// =====================================================
function getWorksheets() {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME) || ss.getSheets()[0];
  
  if (!sheet) {
    throw new Error("Worksheet sheet not found.");
  }

  var data = sheet.getDataRange().getValues();
  if (!data || data.length < 2) {
    return []; // Empty sheet or only headers
  }

  var headers = data[0];
  var normalizedHeaders = headers.map(function(h) {
    return normalizeHeader(h);
  });

  var jsonArray = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var obj = parseRow(row, headers, normalizedHeaders);

    // Only include rows with an ID or Link to filter out trailing empty rows
    if (obj && (obj.id || obj.link)) {
      jsonArray.push(obj);
    }
  }

  return jsonArray;
}

// =====================================================
// ROW PARSER & HEADER NORMALIZATION
// =====================================================
function parseRow(row, rawHeaders, normalizedHeaders) {
  var obj = {
    id: "",
    grade: "",
    subject: CONFIG.DEFAULT_SUBJECT,
    chapter: "",
    topic: "",
    type: "",
    link: ""
  };
  var hasContent = false;

  for (var j = 0; j < normalizedHeaders.length; j++) {
    var key = normalizedHeaders[j];
    var rawKey = String(rawHeaders[j]).trim();
    var val = row[j];
    var strVal = (val !== null && val !== undefined) ? String(val).trim() : "";

    if (strVal !== "") {
      hasContent = true;
    }

    if (key === "id") {
      obj.id = strVal;
    } else if (key === "grade") {
      // CRITICAL: Preserve complete class identifier as string (e.g. "3 INTER", "8 MQ")
      obj.grade = strVal;
    } else if (key === "subject") {
      obj.subject = strVal || CONFIG.DEFAULT_SUBJECT;
    } else if (key === "chapter") {
      obj.chapter = strVal;
    } else if (key === "topic") {
      obj.topic = strVal;
    } else if (key === "type") {
      obj.type = strVal;
    } else if (key === "link") {
      obj.link = strVal;
    } else if (rawKey !== "") {
      // Preserve custom extra columns with lowercase keys
      obj[rawKey.toLowerCase()] = val;
    }
  }

  if (!obj.subject || obj.subject === "") {
    obj.subject = CONFIG.DEFAULT_SUBJECT;
  }

  return hasContent ? obj : null;
}

function normalizeHeader(header) {
  var text = String(header || "").trim().toLowerCase();
  
  if (text === "id") return "id";
  if (/^(grade|kelas)$/i.test(text)) return "grade";
  if (/^(subject|mata pelajaran|matapelajaran|mapel)$/i.test(text)) return "subject";
  if (/^(chapter|bab)$/i.test(text)) return "chapter";
  if (/^(topic|topik)$/i.test(text)) return "topic";
  if (/^(type|tipe|format)$/i.test(text)) return "type";
  if (/^(link|url)$/i.test(text)) return "link";

  return text;
}

// =====================================================
// UTILITIES
// =====================================================
function getSpreadsheet() {
  if (CONFIG.SPREADSHEET_ID && CONFIG.SPREADSHEET_ID.trim() !== "") {
    return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID.trim());
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
