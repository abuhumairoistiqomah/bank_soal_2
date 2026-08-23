/**
 * ============================================================
 * NEO ILMA - GOOGLE APPS SCRIPT API
 * ============================================================
 *
 * Learning Resource Bank API
 *
 * DATABASE HEADER:
 * ID | Grade | Subject | Chapter | Topic | Type | Link
 *
 * Supported bilingual headers:
 * - ID
 * - Grade / Kelas
 * - Subject / Mata Pelajaran / Mapel
 * - Chapter / Bab
 * - Topic / Topik / Sub-Bab
 * - Type / Tipe / Format / Jenis File
 * - Link / URL
 *
 * ------------------------------------------------------------
 * IMPORTANT GRADE BEHAVIOR
 * ------------------------------------------------------------
 *
 * Grade is ALWAYS treated as STRING.
 *
 * Examples:
 *
 * "5 MQ"
 *      -> grade: "5 MQ"
 *      -> targetClasses: ["5 MQ"]
 *
 * "5 Inter - 5 MQ"
 *      -> grade: "5 Inter - 5 MQ"
 *      -> targetClasses: ["5 Inter", "5 MQ"]
 *
 * "7 AE - 7 MQ"
 *      -> grade: "7 AE - 7 MQ"
 *      -> targetClasses: ["7 AE", "7 MQ"]
 *
 * ONE database row remains ONE resource.
 *
 * ============================================================
 */


// ============================================================
// CONFIGURATION
// ============================================================

var CONFIG = {

  /**
   * If this Apps Script project is STANDALONE,
   * enter the Spreadsheet ID here.
   *
   * Example Google Sheet URL:
   *
   * https://docs.google.com/spreadsheets/d/
   * 1AbCdEfGhIjKlMnOpQrStUvWxYz/edit
   *
   * Spreadsheet ID:
   *
   * 1AbCdEfGhIjKlMnOpQrStUvWxYz
   *
   * If this Apps Script project is attached directly to
   * the Google Sheet:
   *
   * Extensions > Apps Script
   *
   * this may remain empty.
   */
  SPREADSHEET_ID: "",


  /**
   * Preferred sheet/tab name.
   *
   * If this sheet does not exist,
   * the script will automatically try:
   *
   * - Worksheets
   * - Worksheet
   * - Data
   * - Sheet1
   *
   * and finally use the first available sheet.
   */
  SHEET_NAME: "Sheet1",


  /**
   * Used only for legacy rows where Subject is blank.
   */
  DEFAULT_SUBJECT: "Math",


  /**
   * Include parsed target classes in JSON.
   *
   * Recommended: true
   *
   * Example:
   *
   * Grade:
   * "5 Inter - 5 MQ"
   *
   * JSON:
   * targetClasses: ["5 Inter", "5 MQ"]
   */
  INCLUDE_TARGET_CLASSES: true
};


// ============================================================
// HTTP ENDPOINT
// ============================================================

function doGet(e) {

  try {

    var worksheets = getWorksheets();

    return createJsonResponse(worksheets);

  } catch (err) {

    return createJsonResponse({
      success: false,
      error: "Error loading learning resources.",
      message: err && err.message
        ? err.message
        : String(err)
    });

  }
}


// ============================================================
// WORKSHEET / RESOURCE DATA
// ============================================================

function getWorksheets() {

  var ss = getSpreadsheet();
  var sheet = getResourceSheet(ss);

  if (!sheet) {
    throw new Error(
      "Resource sheet could not be found."
    );
  }


  var range = sheet.getDataRange();
  var data = range.getValues();


  // Empty sheet
  if (!data || data.length === 0) {
    return [];
  }


  // Header only
  if (data.length < 2) {
    return [];
  }


  var headers = data[0];

  var normalizedHeaders = headers.map(function(header) {
    return normalizeHeader(header);
  });


  validateRequiredHeaders(normalizedHeaders);


  var resources = [];


  for (var rowIndex = 1; rowIndex < data.length; rowIndex++) {

    var row = data[rowIndex];

    var resource = parseRow(
      row,
      headers,
      normalizedHeaders
    );


    if (!resource) {
      continue;
    }


    /**
     * Ignore completely irrelevant / trailing rows.
     *
     * A resource is considered meaningful when it has:
     *
     * ID
     * OR
     * Link
     *
     * This maintains compatibility with the previous version.
     */
    if (resource.id || resource.link) {

      resources.push(resource);

    }

  }


  return resources;
}


// ============================================================
// RESOURCE SHEET RESOLUTION
// ============================================================

function getResourceSheet(ss) {

  if (!ss) {
    throw new Error(
      "Spreadsheet could not be opened."
    );
  }


  // 1. Preferred configured sheet
  if (
    CONFIG.SHEET_NAME &&
    String(CONFIG.SHEET_NAME).trim() !== ""
  ) {

    var configuredSheet = ss.getSheetByName(
      String(CONFIG.SHEET_NAME).trim()
    );

    if (configuredSheet) {
      return configuredSheet;
    }

  }


  // 2. Common fallback sheet names
  var fallbackNames = [
    "Worksheets",
    "Worksheet",
    "Resources",
    "Resource",
    "Data",
    "Sheet1"
  ];


  for (var i = 0; i < fallbackNames.length; i++) {

    var fallbackSheet = ss.getSheetByName(
      fallbackNames[i]
    );

    if (fallbackSheet) {
      return fallbackSheet;
    }

  }


  // 3. Final fallback: first sheet
  var sheets = ss.getSheets();

  if (sheets && sheets.length > 0) {
    return sheets[0];
  }


  return null;
}


// ============================================================
// ROW PARSER
// ============================================================

function parseRow(
  row,
  rawHeaders,
  normalizedHeaders
) {

  var obj = {

    id: "",

    /**
     * IMPORTANT:
     *
     * grade remains STRING.
     *
     * Never use:
     *
     * parseInt()
     * Number()
     *
     * here.
     */
    grade: "",

    subject: CONFIG.DEFAULT_SUBJECT,

    chapter: "",

    topic: "",

    type: "",

    link: ""

  };


  var hasContent = false;


  for (
    var columnIndex = 0;
    columnIndex < normalizedHeaders.length;
    columnIndex++
  ) {

    var key = normalizedHeaders[columnIndex];

    var rawKey = String(
      rawHeaders[columnIndex] || ""
    ).trim();

    var value = row[columnIndex];


    var strValue =
      value !== null &&
      value !== undefined

        ? String(value).trim()

        : "";


    if (strValue !== "") {
      hasContent = true;
    }


    // --------------------------------------------------------
    // CORE COLUMNS
    // --------------------------------------------------------

    if (key === "id") {

      obj.id = strValue;

    }


    else if (key === "grade") {

      /**
       * ======================================================
       * CRITICAL FIX
       * ======================================================
       *
       * DO NOT:
       *
       * parseInt(strValue)
       *
       * because:
       *
       * parseInt("5 MQ")
       *
       * becomes:
       *
       * 5
       *
       * We MUST preserve:
       *
       * "5 MQ"
       *
       * or:
       *
       * "5 Inter - 5 MQ"
       */
      obj.grade = strValue;

    }


    else if (key === "subject") {

      obj.subject =
        strValue ||
        CONFIG.DEFAULT_SUBJECT;

    }


    else if (key === "chapter") {

      obj.chapter = strValue;

    }


    else if (key === "topic") {

      obj.topic = strValue;

    }


    else if (key === "type") {

      obj.type = strValue;

    }


    else if (key === "link") {

      obj.link = strValue;

    }


    // --------------------------------------------------------
    // CUSTOM / ADDITIONAL COLUMNS
    // --------------------------------------------------------

    else if (rawKey !== "") {

      /**
       * Additional columns are preserved.
       *
       * Example database:
       *
       * Teacher
       * Contributor
       * Created By
       *
       * becomes JSON:
       *
       * teacher
       * contributor
       * created by
       *
       * This keeps the API future-friendly.
       */
      var extraKey =
        normalizeCustomKey(rawKey);

      if (extraKey !== "") {
        obj[extraKey] = value;
      }

    }

  }


  // Completely empty row
  if (!hasContent) {
    return null;
  }


  // Legacy Subject fallback
  if (
    !obj.subject ||
    String(obj.subject).trim() === ""
  ) {

    obj.subject =
      CONFIG.DEFAULT_SUBJECT;

  }


  // ----------------------------------------------------------
  // TARGET CLASS PARSING
  // ----------------------------------------------------------

  if (CONFIG.INCLUDE_TARGET_CLASSES) {

    obj.targetClasses =
      getTargetClasses(obj.grade);

  }


  return obj;
}


// ============================================================
// TARGET CLASS PARSER
// ============================================================

/**
 * Converts the Grade field into one or more real target classes.
 *
 * Examples:
 *
 * getTargetClasses("5 MQ")
 *
 * =>
 *
 * ["5 MQ"]
 *
 *
 * getTargetClasses("5 Inter - 5 MQ")
 *
 * =>
 *
 * ["5 Inter", "5 MQ"]
 *
 *
 * getTargetClasses("7 AE - 7 MQ")
 *
 * =>
 *
 * ["7 AE", "7 MQ"]
 *
 *
 * Also technically supports:
 *
 * Class A - Class B - Class C
 *
 * =>
 *
 * ["Class A", "Class B", "Class C"]
 */
function getTargetClasses(gradeValue) {

  var text = String(
    gradeValue || ""
  ).trim();


  if (text === "") {
    return [];
  }


  /**
   * Split only when hyphen/dash is used as a separator
   * with surrounding spaces.
   *
   * Supports:
   *
   * " - "
   * " – "
   * " — "
   *
   * This prevents blindly splitting every hyphen.
   */
  var parts = text.split(
    /\s+[-–—]\s+/
  );


  var result = [];


  for (var i = 0; i < parts.length; i++) {

    var targetClass = String(
      parts[i] || ""
    ).trim();


    if (targetClass === "") {
      continue;
    }


    targetClass =
      formatClassName(targetClass);


    if (
      !arrayContainsClass(
        result,
        targetClass
      )
    ) {

      result.push(targetClass);

    }

  }


  return result;
}


// ============================================================
// CLASS NAME NORMALIZATION
// ============================================================

/**
 * Used for comparison only.
 *
 * Example:
 *
 * " 5 mq "
 *
 * becomes:
 *
 * "5 mq"
 */
function normalizeClassName(value) {

  return String(
    value || ""
  )
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

}


/**
 * Normalize class capitalization for API convenience.
 *
 * Examples:
 *
 * "5 mq"
 * -> "5 MQ"
 *
 * "5 inter"
 * -> "5 Inter"
 *
 * "7 ae"
 * -> "7 AE"
 *
 * Unknown formats are preserved.
 */
function formatClassName(value) {

  var text = String(
    value || ""
  )
    .trim()
    .replace(/\s+/g, " ");


  var match =
    text.match(
      /^(\d+)\s+(inter|mq|ae)$/i
    );


  if (!match) {
    return text;
  }


  var numberPart =
    match[1];

  var program =
    match[2].toLowerCase();


  if (program === "mq") {

    return numberPart + " MQ";

  }


  if (program === "ae") {

    return numberPart + " AE";

  }


  if (program === "inter") {

    return numberPart + " Inter";

  }


  return text;
}


// ============================================================
// ARRAY CLASS MEMBERSHIP
// ============================================================

function arrayContainsClass(
  array,
  className
) {

  var target =
    normalizeClassName(className);


  for (var i = 0; i < array.length; i++) {

    if (
      normalizeClassName(array[i]) ===
      target
    ) {

      return true;

    }

  }


  return false;
}


// ============================================================
// HEADER NORMALIZATION
// ============================================================

function normalizeHeader(header) {

  var text = String(
    header || ""
  )
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");


  // ID
  if (
    text === "id"
  ) {

    return "id";

  }


  // Grade / Class
  if (
    text === "grade" ||
    text === "kelas" ||
    text === "class"
  ) {

    return "grade";

  }


  // Subject
  if (
    text === "subject" ||
    text === "mata pelajaran" ||
    text === "matapelajaran" ||
    text === "mapel"
  ) {

    return "subject";

  }


  // Chapter
  if (
    text === "chapter" ||
    text === "bab"
  ) {

    return "chapter";

  }


  // Topic / Sub-Bab
  if (
    text === "topic" ||
    text === "topik" ||
    text === "sub-bab" ||
    text === "sub bab" ||
    text === "subbab"
  ) {

    return "topic";

  }


  // Type
  if (
    text === "type" ||
    text === "tipe" ||
    text === "format" ||
    text === "jenis file" ||
    text === "jenis"
  ) {

    return "type";

  }


  // Link
  if (
    text === "link" ||
    text === "url"
  ) {

    return "link";

  }


  return text;
}


// ============================================================
// CUSTOM COLUMN KEY NORMALIZATION
// ============================================================

function normalizeCustomKey(header) {

  return String(
    header || ""
  )
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

}


// ============================================================
// HEADER VALIDATION
// ============================================================

function validateRequiredHeaders(
  normalizedHeaders
) {

  var required = [
    "id",
    "grade",
    "subject",
    "chapter",
    "topic",
    "type",
    "link"
  ];


  var missing = [];


  for (var i = 0; i < required.length; i++) {

    if (
      normalizedHeaders.indexOf(
        required[i]
      ) === -1
    ) {

      missing.push(
        required[i]
      );

    }

  }


  if (missing.length > 0) {

    throw new Error(
      "Required database column(s) missing: " +
      missing.join(", ") +
      ". Expected header: " +
      "ID | Grade | Subject | Chapter | Topic | Type | Link"
    );

  }
}


// ============================================================
// SPREADSHEET ACCESS
// ============================================================

function getSpreadsheet() {

  // ----------------------------------------------------------
  // STANDALONE MODE
  // ----------------------------------------------------------

  if (
    CONFIG.SPREADSHEET_ID &&
    String(
      CONFIG.SPREADSHEET_ID
    ).trim() !== ""
  ) {

    try {

      return SpreadsheetApp.openById(
        String(
          CONFIG.SPREADSHEET_ID
        ).trim()
      );

    } catch (err) {

      throw new Error(
        "Unable to open spreadsheet using CONFIG.SPREADSHEET_ID. " +
        "Please check the Spreadsheet ID and Apps Script permissions. " +
        "Original error: " +
        err.message
      );

    }

  }


  // ----------------------------------------------------------
  // BOUND SCRIPT MODE
  // ----------------------------------------------------------

  var activeSpreadsheet =
    SpreadsheetApp.getActiveSpreadsheet();


  if (activeSpreadsheet) {

    return activeSpreadsheet;

  }


  /**
   * A standalone Web App usually has no active spreadsheet.
   *
   * Therefore SPREADSHEET_ID is required in standalone mode.
   */
  throw new Error(
    "No active spreadsheet found. " +
    "If this Code.gs is running as a standalone Apps Script project, " +
    "set CONFIG.SPREADSHEET_ID to your Google Sheet ID."
  );
}


// ============================================================
// JSON RESPONSE
// ============================================================

function createJsonResponse(data) {

  return ContentService
    .createTextOutput(
      JSON.stringify(data)
    )
    .setMimeType(
      ContentService.MimeType.JSON
    );

}