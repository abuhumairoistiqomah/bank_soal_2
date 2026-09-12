/**
 * ============================================================
 * NEO ILMA - RESOURCE SUBMISSION PORTAL
 * Google Apps Script Backend
 * ============================================================
 *
 * Guru submit resource tanpa mengedit master sheet.
 * Submission masuk staging dulu, lalu dapat direview admin.
 * Master header (order-independent):
 * ID | Grade | Subject | Chapter | Topic | Task_Name | Type | Link | Uploader
 * ============================================================
 */

var CONFIG = {
  SPREADSHEET_ID: "1P4MJxkjRMhSFYEkuEZA_dIuoa72LvfewHxHx3k4kKnk",
  MASTER_SHEET: "Sheet1",
  SUBMISSIONS_SHEET: "SUBMISSIONS",
  LOOKUPS_SHEET: "LOOKUPS",
  LOG_SHEET: "SUBMISSION_LOG",
  TYPE_ROUTING_SHEET: "TYPE_ROUTING",
  FOLDER_ROUTING_SHEET: "FOLDER_ROUTING",

  TEACHER_HEADER_ALIASES: [
    "Uploader", "Teacher", "Guru", "Nama Guru", "Nama Pengajar"
  ],
  SUBJECT_HEADER_ALIASES: [
    "Subject", "Mata Pelajaran", "Mapel"
  ],
  TYPE_HEADER_ALIASES: [
    "Type", "Tipe", "Jenis File", "Format"
  ],

  // Isi jika ingin mengaktifkan Admin Review.
  ADMIN_PIN: "676767",

  MASTER_ID_PREFIX: "Q-",
  MASTER_ID_DIGITS: 4,
  MY_SUBMISSIONS_LIMIT: 100,

  // Conservative MVP limit for HtmlService -> Apps Script uploads.
  MAX_UPLOAD_BYTES: 25 * 1024 * 1024
};

var GRADE_OPTIONS = [
  "1 Inter", "2 Inter", "3 Inter", "4 Inter", "5 Inter", "6 Inter",
  "1 MQ", "2 MQ", "3 MQ", "4 MQ", "5 MQ", "6 MQ",
  "1 Inter - 1 MQ", "2 Inter - 2 MQ", "3 Inter - 3 MQ",
  "4 Inter - 4 MQ", "5 Inter - 5 MQ", "6 Inter - 6 MQ",
  "7 AE", "8 AE", "9 AE", "10 AE", "11 AE", "12 AE",
  "7 MQ", "8 MQ", "9 MQ", "10 MQ", "11 MQ", "12 MQ",
  "7 AE - 7 MQ", "8 AE - 8 MQ", "9 AE - 9 MQ",
  "10 AE - 10 MQ", "11 AE - 11 MQ", "12 AE - 12 MQ"
];

var SUBMISSION_HEADERS = [
  "SubmissionID", "Timestamp", "Uploader", "Grade", "Subject",
  "Chapter", "Topic", "Task_Name", "Type", "Link", "Status", "Reviewer",
  "ReviewNote", "MasterID",
  "Source", "Original_File_Name", "Drive_File_ID", "Drive_Folder_ID",
  "Mime_Type", "File_Size"
];

var TYPE_ROUTING_HEADERS = [
  "Type", "Storage_Category", "Upload_Mode", "Active", "Notes"
];

var FOLDER_ROUTING_HEADERS = [
  "Route_ID", "Grade", "Subject", "Storage_Category",
  "Folder_ID", "Folder_URL", "Active", "Notes"
];

var LOG_HEADERS = [
  "Timestamp", "Action", "SubmissionID", "Uploader", "Details"
];

function doGet(e) {
  setupPortalSheets();
  var template = HtmlService.createTemplateFromFile("Index");
  return template.evaluate()
    .setTitle("NEO ILMA - Resource Submission")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function setupPortalSheets() {
  var ss = getSpreadsheet_();
  ensureSheetWithHeaders_(ss, CONFIG.SUBMISSIONS_SHEET, SUBMISSION_HEADERS);
  ensureSheetWithHeaders_(ss, CONFIG.LOG_SHEET, LOG_HEADERS);
  ensureSheetWithHeaders_(ss, CONFIG.TYPE_ROUTING_SHEET, TYPE_ROUTING_HEADERS);
  ensureSheetWithHeaders_(ss, CONFIG.FOLDER_ROUTING_SHEET, FOLDER_ROUTING_HEADERS);

  var lookup = ss.getSheetByName(CONFIG.LOOKUPS_SHEET);
  if (!lookup) {
    lookup = ss.insertSheet(CONFIG.LOOKUPS_SHEET);
    lookup.getRange(1, 1, 1, 3).setValues([["Uploader", "Subject", "Type"]]);
    lookup.setFrozenRows(1);
  }

  ensureMasterUploaderColumn_();
}

function getPortalBootstrap() {
  setupPortalSheets();

  var resources = readMasterResources_();
  var teachers = getTeacherNames_();
  var lookupSubjects = getLookupValues_(CONFIG.SUBJECT_HEADER_ALIASES);
  var lookupTypes = getLookupValues_(CONFIG.TYPE_HEADER_ALIASES);
  var typeRouting = getClientTypeRouting_();

  var subjects = uniqueCaseInsensitive_(
    lookupSubjects.concat(resources.map(function(r) { return r.subject; }))
  );

  // TYPE_ROUTING ikut menjadi sumber Type supaya type baru yang belum ada
  // di master tetap dapat dipilih di portal.
  var types = uniqueCaseInsensitive_(
    lookupTypes
      .concat(resources.map(function(r) { return r.type; }))
      .concat(typeRouting.map(function(r) { return r.type; }))
  );

  return {
    grades: GRADE_OPTIONS.slice(),
    teachers: naturalSort_(teachers),
    subjects: naturalSort_(subjects),
    types: naturalSort_(types),
    typeRouting: typeRouting,
    maxUploadBytes: CONFIG.MAX_UPLOAD_BYTES,
    cascadeIndex: buildCascadeIndex_(resources),
    adminEnabled: String(CONFIG.ADMIN_PIN || "").trim() !== ""
  };
}


/**
 * Active TYPE_ROUTING rows exposed to the browser.
 * This only exposes routing category/mode, never Drive Folder IDs.
 */
function getClientTypeRouting_() {
  var rows = readSheetObjects_(CONFIG.TYPE_ROUTING_SHEET);

  return rows
    .filter(function(row) {
      return isRoutingActive_(row.active);
    })
    .map(function(row) {
      return {
        type: cleanString_(row.type),
        storageCategory: cleanString_(row.storagecategory).toUpperCase(),
        uploadMode: cleanString_(row.uploadmode).toUpperCase()
      };
    })
    .filter(function(row) {
      return !!row.type;
    });
}


/**
 * Finds one active TYPE_ROUTING row by Type.
 * 0 matches = null (legacy link mode remains available during migration).
 * >1 match = error because routing is ambiguous.
 */
function getActiveTypeRouteByName_(type) {
  var cleanedType = cleanString_(type);
  if (!cleanedType) return null;

  var matches = readSheetObjects_(CONFIG.TYPE_ROUTING_SHEET).filter(function(row) {
    return (
      isRoutingActive_(row.active) &&
      normalizeComparable_(row.type) === normalizeComparable_(cleanedType)
    );
  });

  if (matches.length === 0) return null;

  if (matches.length > 1) {
    throw new Error(
      'TYPE_ROUTING memiliki lebih dari satu route aktif untuk "' +
      cleanedType +
      '".'
    );
  }

  return {
    type: cleanString_(matches[0].type),
    storageCategory: cleanString_(matches[0].storagecategory).toUpperCase(),
    uploadMode: cleanString_(matches[0].uploadmode).toUpperCase()
  };
}


/**
 * Adaptive single-resource submit.
 *
 * When the selected Type is configured as FILE, resourceFile is uploaded
 * directly into the exact folder returned by the route resolver.
 *
 * When Type is LINK (or not yet configured in TYPE_ROUTING), the existing
 * link-submission flow remains available for backward compatibility.
 *
 * IMPORTANT: When called from google.script.run with an HTML form element,
 * this function must receive that form object as its only argument.
 */
function submitAdaptiveResource(formObject) {
  setupPortalSheets();

  formObject = formObject || {};

  var typeRoute;

  try {
    typeRoute = getActiveTypeRouteByName_(formObject.type);
  } catch (routeConfigError) {
    return {
      success: false,
      code: "TYPE_ROUTE_AMBIGUOUS",
      message: routeConfigError.message
    };
  }

  // Migration-safe behavior:
  // - Explicit LINK route -> existing link submission
  // - No TYPE_ROUTING row yet -> existing link submission
  if (!typeRoute || typeRoute.uploadMode === "LINK") {
    return submitResource({
      uploader: formObject.uploader,
      grade: formObject.grade,
      subject: formObject.subject,
      chapter: formObject.chapter,
      topic: formObject.topic,
      taskName: formObject.taskName,
      type: formObject.type,
      link: formObject.link
    });
  }

  if (typeRoute.uploadMode !== "FILE") {
    return {
      success: false,
      code: "UPLOAD_MODE_INVALID",
      message:
        'Upload_Mode untuk "' +
        cleanString_(formObject.type) +
        '" harus FILE atau LINK.'
    };
  }

  var cleaned = normalizeSubmissionPayload_({
    uploader: formObject.uploader,
    grade: formObject.grade,
    subject: formObject.subject,
    chapter: formObject.chapter,
    topic: formObject.topic,
    taskName: formObject.taskName,
    type: formObject.type,
    link: ""
  });

  var metadataValidation = validateSubmissionMetadata_(cleaned);
  if (!metadataValidation.ok) {
    return { success: false, message: metadataValidation.message };
  }

  var teacherValidation = validateTeacher_(cleaned.uploader);
  if (!teacherValidation.ok) {
    return { success: false, message: teacherValidation.message };
  }

  var route = resolveUploadRoute(
    cleaned.grade,
    cleaned.subject,
    cleaned.type
  );

  if (!route.success) return route;

  if (route.uploadMode !== "FILE") {
    return {
      success: false,
      code: "ROUTE_MODE_MISMATCH",
      message: "Route tidak berada dalam mode FILE."
    };
  }

  var fileBlob = formObject.resourceFile;

  if (
    !fileBlob ||
    typeof fileBlob.getBytes !== "function" ||
    typeof fileBlob.getName !== "function"
  ) {
    return {
      success: false,
      code: "FILE_REQUIRED",
      message: "Pilih file yang akan diupload."
    };
  }

  var originalFileName = cleanString_(fileBlob.getName());
  if (!originalFileName) {
    originalFileName = cleaned.taskName || "NEO ILMA Resource";
    try { fileBlob.setName(originalFileName); } catch (ignoreName) {}
  }

  var fileBytes;
  try {
    fileBytes = fileBlob.getBytes();
  } catch (readError) {
    return {
      success: false,
      code: "FILE_READ_FAILED",
      message: "File tidak dapat dibaca: " + readError.message
    };
  }

  var fileSize = fileBytes.length;

  if (!fileSize) {
    return {
      success: false,
      code: "FILE_EMPTY",
      message: "File kosong dan tidak dapat diupload."
    };
  }

  if (fileSize > CONFIG.MAX_UPLOAD_BYTES) {
    return {
      success: false,
      code: "FILE_TOO_LARGE",
      message:
        "Ukuran file melebihi batas portal saat ini (" +
        formatBytes_(CONFIG.MAX_UPLOAD_BYTES) +
        ")."
    };
  }

  var driveFile = null;
  var submissionWritten = false;
  var lock = LockService.getScriptLock();

  try {
    // Upload FIRST. If staging write fails afterward, the file is trashed
    // to prevent orphan files in the Wakasek storage.
    var folder = DriveApp.getFolderById(route.folderId);

    driveFile = folder.createFile(fileBlob);
    var driveFileId = driveFile.getId();
    var driveUrl = driveFile.getUrl();
    var mimeType = cleanString_(fileBlob.getContentType());

    lock.waitLock(20000);

    // The final task-name sequence is allocated under lock.
    var taskRegistry = buildTopicSequenceRegistry_();
    cleaned.taskName = allocateSequencedTopic_(cleaned, taskRegistry);

    var submissionId = createSubmissionId_();
    var sheet = getSpreadsheet_().getSheetByName(CONFIG.SUBMISSIONS_SHEET);
    var submissionHeaders = getNormalizedSheetHeaders_(sheet);

    sheet.appendRow(
      buildRowFromObject_(submissionHeaders, {
        submissionid: submissionId,
        timestamp: new Date(),
        uploader: cleaned.uploader,
        grade: cleaned.grade,
        subject: cleaned.subject,
        chapter: cleaned.chapter,
        topic: cleaned.topic,
        taskname: cleaned.taskName,
        type: cleaned.type,
        link: driveUrl,
        status: "PENDING",
        reviewer: "",
        reviewnote: "",
        masterid: "",
        source: "FILE_UPLOAD",
        originalfilename: originalFileName,
        drivefileid: driveFileId,
        drivefolderid: route.folderId,
        mimetype: mimeType,
        filesize: fileSize
      })
    );

    submissionWritten = true;

    logAction_(
      "FILE_UPLOAD",
      submissionId,
      cleaned.uploader,
      originalFileName +
        " | " +
        route.folderName +
        " | " +
        formatBytes_(fileSize)
    );

    logAction_(
      "SUBMIT",
      submissionId,
      cleaned.uploader,
      cleaned.grade +
        " | " +
        cleaned.subject +
        " | " +
        cleaned.topic +
        " | FILE_UPLOAD"
    );

    return {
      success: true,
      submissionId: submissionId,
      assignedTaskName: cleaned.taskName,
      source: "FILE_UPLOAD",
      fileName: originalFileName,
      fileSize: fileSize,
      mimeType: mimeType,
      driveFileId: driveFileId,
      driveFolderId: route.folderId,
      link: driveUrl,
      folderName: route.folderName,
      message:
        'File berhasil diupload ke folder "' +
        route.folderName +
        '" dan masuk staging.'
    };

  } catch (err) {
    // If Drive upload succeeded but SUBMISSIONS write failed, remove the
    // uploaded file so the storage does not accumulate orphan files.
    if (driveFile && !submissionWritten) {
      try { driveFile.setTrashed(true); } catch (cleanupError) {}
    }

    return {
      success: false,
      code: "FILE_UPLOAD_FAILED",
      message: "Upload gagal: " + (err.message || String(err))
    };

  } finally {
    try { lock.releaseLock(); } catch (ignoreLock) {}
  }
}


function formatBytes_(bytes) {
  var value = Number(bytes) || 0;

  if (value < 1024) return value + " B";
  if (value < 1024 * 1024) return (value / 1024).toFixed(1) + " KB";
  return (value / (1024 * 1024)).toFixed(1) + " MB";
}

function submitResource(payload) {
  setupPortalSheets();

  var cleaned = normalizeSubmissionPayload_(payload);
  var validation = validateSubmission_(cleaned);
  if (!validation.ok) return { success: false, message: validation.message };

  var teacherValidation = validateTeacher_(cleaned.uploader);
  if (!teacherValidation.ok) return { success: false, message: teacherValidation.message };

  var lock = LockService.getScriptLock();

  try {
    lock.waitLock(15000);

    var duplicate = findDuplicateLink_(cleaned.link);
    if (duplicate) {
      return {
        success: false,
        duplicate: true,
        message: "Link ini sudah terdaftar.",
        duplicateInfo: duplicate
      };
    }

    // Auto-number Nama Tugas; Topic tetap stabil sebagai kategori.
    // Konteks: Grade + Subject + Chapter + Topic + base Task_Name + Type
    var topicRegistry = buildTopicSequenceRegistry_();
    cleaned.taskName = allocateSequencedTopic_(cleaned, topicRegistry);

    var submissionId = createSubmissionId_();
    var sheet = getSpreadsheet_().getSheetByName(CONFIG.SUBMISSIONS_SHEET);
    var submissionHeaders = getNormalizedSheetHeaders_(sheet);

    // Build by header name, not column position.
    // This keeps existing SUBMISSIONS sheets safe even when Task_Name
    // is added after the sheet already contains data.
    sheet.appendRow(
      buildRowFromObject_(submissionHeaders, {
        submissionid: submissionId,
        timestamp: new Date(),
        uploader: cleaned.uploader,
        grade: cleaned.grade,
        subject: cleaned.subject,
        chapter: cleaned.chapter,
        topic: cleaned.topic,
        taskname: cleaned.taskName,
        type: cleaned.type,
        link: cleaned.link,
        status: "PENDING",
        reviewer: "",
        reviewnote: "",
        masterid: "",
        source: "QUICK_LINK",
        originalfilename: "",
        drivefileid: "",
        drivefolderid: "",
        mimetype: "",
        filesize: ""
      })
    );

    logAction_(
      "SUBMIT",
      submissionId,
      cleaned.uploader,
      cleaned.grade + " | " + cleaned.subject + " | " + cleaned.topic
    );

    return {
      success: true,
      submissionId: submissionId,
      assignedTaskName: cleaned.taskName,
      message: "Resource berhasil dikirim."
    };

  } catch (err) {
    return { success: false, message: "Gagal mengirim resource: " + err.message };
  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }
}

function submitBatch(payload) {
  setupPortalSheets();

  payload = payload || {};
  var uploader = cleanString_(payload.uploader);
  var rows = Array.isArray(payload.rows) ? payload.rows : [];

  if (!uploader) return { success: false, message: "Pilih nama guru terlebih dahulu." };

  var teacherValidation = validateTeacher_(uploader);
  if (!teacherValidation.ok) return { success: false, message: teacherValidation.message };

  if (!rows.length) return { success: false, message: "Tidak ada data batch untuk dikirim." };

  var lock = LockService.getScriptLock();

  try {
    lock.waitLock(20000);

    var sheet = getSpreadsheet_().getSheetByName(CONFIG.SUBMISSIONS_SHEET);
    var submissionHeaders = getNormalizedSheetHeaders_(sheet);
    var duplicateKeys = getAllRegisteredLinkKeys_();

    // Dipakai bersama selama satu batch sehingga dua row yang sama
    // dalam batch yang sama tetap mendapat nomor berurutan.
    var topicRegistry = buildTopicSequenceRegistry_();

    var valuesToAppend = [];
    var results = [];

    for (var i = 0; i < rows.length; i++) {
      var cleaned = normalizeSubmissionPayload_({
        uploader: uploader,
        grade: rows[i].grade,
        subject: rows[i].subject,
        chapter: rows[i].chapter,
        topic: rows[i].topic,
        taskName: rows[i].taskName,
        type: rows[i].type,
        link: rows[i].link
      });

      var validation = validateSubmission_(cleaned);
      if (!validation.ok) {
        results.push({ index: i, success: false, message: validation.message });
        continue;
      }

      var linkKey = normalizeResourceLink_(cleaned.link);
      if (duplicateKeys[linkKey]) {
        results.push({ index: i, success: false, duplicate: true, message: "Link sudah terdaftar." });
        continue;
      }

      // Tentukan Nama Tugas final; Topic tidak diubah.
      cleaned.taskName = allocateSequencedTopic_(cleaned, topicRegistry);

      var submissionId = createSubmissionId_();

      valuesToAppend.push(
        buildRowFromObject_(submissionHeaders, {
          submissionid: submissionId,
          timestamp: new Date(),
          uploader: cleaned.uploader,
          grade: cleaned.grade,
          subject: cleaned.subject,
          chapter: cleaned.chapter,
          topic: cleaned.topic,
          taskname: cleaned.taskName,
          type: cleaned.type,
          link: cleaned.link,
          status: "PENDING",
          reviewer: "",
          reviewnote: "",
          masterid: "",
          source: "BATCH_LINK",
          originalfilename: "",
          drivefileid: "",
          drivefolderid: "",
          mimetype: "",
          filesize: ""
        })
      );

      duplicateKeys[linkKey] = true;

      results.push({
        index: i,
        success: true,
        submissionId: submissionId,
        assignedTaskName: cleaned.taskName
      });
    }

    if (valuesToAppend.length > 0) {
      var startRow = sheet.getLastRow() + 1;
      sheet.getRange(startRow, 1, valuesToAppend.length, submissionHeaders.length)
        .setValues(valuesToAppend);

      logAction_("BATCH_SUBMIT", "", uploader, valuesToAppend.length + " resource(s)");
    }

    return {
      success: true,
      submitted: valuesToAppend.length,
      rejected: rows.length - valuesToAppend.length,
      results: results
    };

  } catch (err) {
    return { success: false, message: "Batch submission gagal: " + err.message };
  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }
}

function getMySubmissions(uploader) {
  setupPortalSheets();
  uploader = cleanString_(uploader);
  if (!uploader) return [];

  var sheet = getSpreadsheet_().getSheetByName(CONFIG.SUBMISSIONS_SHEET);
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];

  var headers = data[0].map(normalizeHeader_);
  var result = [];

  for (var i = data.length - 1; i >= 1; i--) {
    var rowObj = rowToObject_(data[i], headers);

    if (normalizeComparable_(rowObj.uploader) === normalizeComparable_(uploader)) {
      result.push(serializeSubmission_(rowObj));
      if (result.length >= CONFIG.MY_SUBMISSIONS_LIMIT) break;
    }
  }

  return result;
}

function getPendingSubmissions(pin) {
  verifyAdminPin_(pin);

  var sheet = getSpreadsheet_().getSheetByName(CONFIG.SUBMISSIONS_SHEET);
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];

  var headers = data[0].map(normalizeHeader_);
  var result = [];

  for (var i = data.length - 1; i >= 1; i--) {
    var rowObj = rowToObject_(data[i], headers);
    if (normalizeComparable_(rowObj.status) === "pending") {
      var serialized = serializeSubmission_(rowObj);
      serialized.rowNumber = i + 1;
      result.push(serialized);
    }
  }

  return result;
}

function approveSubmission(submissionId, pin) {
  verifyAdminPin_(pin);

  var lock = LockService.getScriptLock();

  try {
    lock.waitLock(20000);

    var located = findSubmissionRow_(submissionId);
    if (!located) throw new Error("Submission tidak ditemukan.");
    if (normalizeComparable_(located.data.status) !== "pending") {
      throw new Error("Submission ini sudah diproses.");
    }

    var duplicate = findDuplicateInMaster_(located.data.link);
    if (duplicate) {
      throw new Error("Link sudah ada di master database sebagai " + duplicate.id + ".");
    }

    var masterId = generateNextMasterId_();

    appendToMaster_({
      id: masterId,
      grade: located.data.grade,
      subject: located.data.subject,
      chapter: located.data.chapter,
      topic: located.data.topic,
      taskName: located.data.taskname,
      type: located.data.type,
      link: located.data.link,
      uploader: located.data.uploader
    });

    updateSubmissionReview_(located.rowNumber, "APPROVED", "ADMIN", "", masterId);
    logAction_("APPROVE", submissionId, located.data.uploader, masterId);

    return { success: true, masterId: masterId };

  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }
}


function approveAllPending(pin) {
  verifyAdminPin_(pin);

  var lock = LockService.getScriptLock();

  try {
    lock.waitLock(30000);

    var ss = getSpreadsheet_();
    var sheet = ss.getSheetByName(CONFIG.SUBMISSIONS_SHEET);
    var data = sheet.getDataRange().getValues();

    if (data.length < 2) {
      return {
        success: true,
        approved: 0,
        skipped: 0,
        approvedItems: [],
        skippedItems: []
      };
    }

    var headers = data[0].map(normalizeHeader_);
    var masterResources = readMasterResources_();

    // Cache link master supaya Approve All tidak membaca seluruh master
    // berulang kali untuk setiap submission.
    var registeredLinks = {};
    masterResources.forEach(function(resource) {
      var key = normalizeResourceLink_(resource.link);
      if (key) registeredLinks[key] = resource.id || true;
    });

    // Tentukan nomor ID berikutnya satu kali.
    var maxNumber = 0;
    var prefix = CONFIG.MASTER_ID_PREFIX;
    var escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    var idRegex = new RegExp("^" + escapedPrefix + "(\\d+)$", "i");

    masterResources.forEach(function(resource) {
      var match = cleanString_(resource.id).match(idRegex);
      if (!match) return;

      var n = parseInt(match[1], 10);
      if (!isNaN(n) && n > maxNumber) maxNumber = n;
    });

    var nextNumber = maxNumber + 1;
    var approvedItems = [];
    var skippedItems = [];

    // Proses dari row paling lama ke terbaru agar urutan Master ID
    // tetap kronologis, walaupun tampilan Admin newest-first.
    for (var i = 1; i < data.length; i++) {
      var rowObj = rowToObject_(data[i], headers);

      if (normalizeComparable_(rowObj.status) !== "pending") {
        continue;
      }

      var submissionId = cleanString_(rowObj.submissionid);
      var linkKey = normalizeResourceLink_(rowObj.link);

      try {
        if (!linkKey) {
          skippedItems.push({
            submissionId: submissionId,
            reason: "Link kosong atau tidak valid."
          });
          continue;
        }

        if (registeredLinks[linkKey]) {
          skippedItems.push({
            submissionId: submissionId,
            reason: "Duplicate dengan resource yang sudah ada di master."
          });
          continue;
        }

        var masterId =
          prefix + padNumber_(nextNumber, CONFIG.MASTER_ID_DIGITS);

        nextNumber++;

        appendToMaster_({
          id: masterId,
          grade: cleanString_(rowObj.grade),
          subject: cleanString_(rowObj.subject),
          chapter: cleanString_(rowObj.chapter),
          topic: cleanString_(rowObj.topic),
          taskName: cleanString_(rowObj.taskname),
          type: cleanString_(rowObj.type),
          link: cleanString_(rowObj.link),
          uploader: cleanString_(rowObj.uploader)
        });

        registeredLinks[linkKey] = masterId;

        updateSubmissionReview_(
          i + 1,
          "APPROVED",
          "ADMIN",
          "",
          masterId
        );

        logAction_(
          "APPROVE_ALL",
          submissionId,
          cleanString_(rowObj.uploader),
          masterId
        );

        approvedItems.push({
          submissionId: submissionId,
          masterId: masterId
        });

      } catch (itemError) {
        skippedItems.push({
          submissionId: submissionId,
          reason: itemError.message || String(itemError)
        });
      }
    }

    return {
      success: true,
      approved: approvedItems.length,
      skipped: skippedItems.length,
      approvedItems: approvedItems,
      skippedItems: skippedItems
    };

  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }
}


function rejectSubmission(submissionId, note, pin) {
  verifyAdminPin_(pin);

  var lock = LockService.getScriptLock();

  try {
    lock.waitLock(15000);

    var located = findSubmissionRow_(submissionId);
    if (!located) throw new Error("Submission tidak ditemukan.");
    if (normalizeComparable_(located.data.status) !== "pending") {
      throw new Error("Submission ini sudah diproses.");
    }

    updateSubmissionReview_(
      located.rowNumber,
      "REJECTED",
      "ADMIN",
      cleanString_(note),
      ""
    );

    logAction_("REJECT", submissionId, located.data.uploader, cleanString_(note));
    return { success: true };

  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }
}


// ============================================================
// UPLOAD ROUTE RESOLVER
// ============================================================

/**
 * Public preview function for the future Submission Portal UI.
 *
 * Input:
 * {
 *   grade: "1 Inter",
 *   subject: "MATH",
 *   type: "Worksheets PDF"
 * }
 *
 * For FILE types:
 * Type -> Storage_Category -> exact Folder_ID
 *
 * For LINK types:
 * Type -> Upload_Mode LINK and no Drive folder is required.
 */
function getUploadRoutePreview(payload) {
  payload = payload || {};

  return resolveUploadRoute(
    payload.grade,
    payload.subject,
    payload.type
  );
}


/**
 * Resolves the upload destination without writing any file.
 *
 * Matching rules:
 * 1. TYPE_ROUTING:
 *    exact active Type, case-insensitive.
 * 2. If Upload_Mode = LINK:
 *    stop; no Drive folder is required.
 * 3. If Upload_Mode = FILE:
 *    FOLDER_ROUTING must contain exactly one active row matching:
 *    Grade + Subject + Storage_Category.
 * 4. Folder_ID is opened directly with DriveApp.getFolderById().
 *
 * The resolver NEVER creates folders and NEVER guesses by folder name.
 */
function resolveUploadRoute(grade, subject, type) {
  setupPortalSheets();

  var cleanedGrade = formatGradeValue_(cleanString_(grade));
  var cleanedSubject = cleanString_(subject);
  var cleanedType = cleanString_(type);

  if (!cleanedGrade) {
    return routeError_("ROUTE_GRADE_REQUIRED", "Kelas belum dipilih.");
  }

  if (!cleanedSubject) {
    return routeError_("ROUTE_SUBJECT_REQUIRED", "Mata pelajaran belum dipilih.");
  }

  if (!cleanedType) {
    return routeError_("ROUTE_TYPE_REQUIRED", "Jenis file belum dipilih.");
  }

  // ----------------------------------------------------------
  // STEP 1 — Resolve Type -> Storage Category + Upload Mode
  // ----------------------------------------------------------
  var typeRows = readSheetObjects_(CONFIG.TYPE_ROUTING_SHEET);

  var activeTypeMatches = typeRows.filter(function(row) {
    return (
      isRoutingActive_(row.active) &&
      normalizeComparable_(row.type) === normalizeComparable_(cleanedType)
    );
  });

  if (activeTypeMatches.length === 0) {
    return routeError_(
      "TYPE_ROUTE_NOT_FOUND",
      'TYPE_ROUTING belum memiliki route aktif untuk "' + cleanedType + '".',
      {
        grade: cleanedGrade,
        subject: cleanedSubject,
        type: cleanedType
      }
    );
  }

  if (activeTypeMatches.length > 1) {
    return routeError_(
      "TYPE_ROUTE_AMBIGUOUS",
      'TYPE_ROUTING memiliki lebih dari satu route aktif untuk "' + cleanedType + '".',
      {
        grade: cleanedGrade,
        subject: cleanedSubject,
        type: cleanedType,
        matchCount: activeTypeMatches.length
      }
    );
  }

  var typeRoute = activeTypeMatches[0];
  var storageCategory = cleanString_(typeRoute.storagecategory).toUpperCase();
  var uploadMode = cleanString_(typeRoute.uploadmode).toUpperCase();

  if (!storageCategory) {
    return routeError_(
      "STORAGE_CATEGORY_EMPTY",
      'Storage_Category untuk "' + cleanedType + '" masih kosong.'
    );
  }

  if (uploadMode !== "FILE" && uploadMode !== "LINK") {
    return routeError_(
      "UPLOAD_MODE_INVALID",
      'Upload_Mode untuk "' + cleanedType + '" harus FILE atau LINK.'
    );
  }

  // LINK resources do not need a Drive destination.
  if (uploadMode === "LINK") {
    return {
      success: true,
      uploadMode: "LINK",
      requiresFile: false,
      requiresLink: true,
      grade: cleanedGrade,
      subject: cleanedSubject,
      type: cleanedType,
      storageCategory: storageCategory,
      routeId: "",
      folderId: "",
      folderUrl: "",
      folderName: "",
      message: "Route LINK valid. Resource ini tidak memerlukan folder upload Drive."
    };
  }

  // ----------------------------------------------------------
  // STEP 2 — Resolve exact Grade + Subject + Storage Category
  // ----------------------------------------------------------
  var folderRows = readSheetObjects_(CONFIG.FOLDER_ROUTING_SHEET);

  var activeFolderMatches = folderRows.filter(function(row) {
    return (
      isRoutingActive_(row.active) &&
      normalizeComparable_(formatGradeValue_(row.grade)) === normalizeComparable_(cleanedGrade) &&
      normalizeComparable_(row.subject) === normalizeComparable_(cleanedSubject) &&
      normalizeComparable_(row.storagecategory) === normalizeComparable_(storageCategory)
    );
  });

  if (activeFolderMatches.length === 0) {
    return routeError_(
      "FOLDER_ROUTE_NOT_FOUND",
      "Folder tujuan belum dikonfigurasi untuk " +
        cleanedGrade + " / " + cleanedSubject + " / " + storageCategory + ".",
      {
        grade: cleanedGrade,
        subject: cleanedSubject,
        type: cleanedType,
        uploadMode: uploadMode,
        storageCategory: storageCategory
      }
    );
  }

  if (activeFolderMatches.length > 1) {
    return routeError_(
      "FOLDER_ROUTE_AMBIGUOUS",
      "Terdapat lebih dari satu folder aktif untuk " +
        cleanedGrade + " / " + cleanedSubject + " / " + storageCategory + ".",
      {
        grade: cleanedGrade,
        subject: cleanedSubject,
        type: cleanedType,
        uploadMode: uploadMode,
        storageCategory: storageCategory,
        matchCount: activeFolderMatches.length
      }
    );
  }

  var folderRoute = activeFolderMatches[0];
  var folderId = cleanString_(folderRoute.folderid);
  var folderUrl = cleanString_(folderRoute.folderurl);
  var routeId = cleanString_(folderRoute.routeid);

  if (!folderId) {
    return routeError_(
      "FOLDER_ID_EMPTY",
      "Folder_ID masih kosong untuk route " + (routeId || "(tanpa Route_ID)") + "."
    );
  }

  // ----------------------------------------------------------
  // STEP 3 — Verify that the Apps Script account can open it.
  // This is a read/access check only. No file is written here.
  // ----------------------------------------------------------
  try {
    var folder = DriveApp.getFolderById(folderId);
    var folderName = folder.getName();

    return {
      success: true,
      uploadMode: "FILE",
      requiresFile: true,
      requiresLink: false,
      grade: cleanedGrade,
      subject: cleanedSubject,
      type: cleanedType,
      storageCategory: storageCategory,
      routeId: routeId,
      folderId: folderId,
      folderUrl: folderUrl || folder.getUrl(),
      folderName: folderName,
      message:
        "Route FILE valid: " +
        cleanedGrade + " / " +
        cleanedSubject + " / " +
        storageCategory + " -> " +
        folderName
    };

  } catch (err) {
    return routeError_(
      "FOLDER_ACCESS_FAILED",
      "Folder_ID ditemukan, tetapi Apps Script tidak dapat membuka folder tujuan: " +
        (err && err.message ? err.message : String(err)),
      {
        grade: cleanedGrade,
        subject: cleanedSubject,
        type: cleanedType,
        uploadMode: uploadMode,
        storageCategory: storageCategory,
        routeId: routeId,
        folderId: folderId,
        folderUrl: folderUrl
      }
    );
  }
}


/**
 * Strong test: resolve the route AND make one tiny temporary text file
 * in the destination folder. If creation succeeds, write access is proven.
 *
 * The file is immediately moved to Trash when possible.
 *
 * This function should be used for admin testing, not normal user uploads.
 */
function testUploadRoute(grade, subject, type) {
  var route = resolveUploadRoute(grade, subject, type);

  if (!route.success) {
    return route;
  }

  if (route.uploadMode === "LINK") {
    route.writeAccess = null;
    route.message =
      "Route valid. Upload_Mode = LINK, jadi pengujian tulis Drive tidak diperlukan.";
    return route;
  }

  var testFile = null;
  var cleanupWarning = "";

  try {
    var folder = DriveApp.getFolderById(route.folderId);
    var testName =
      "NEO_ILMA_ROUTE_TEST_" +
      Utilities.formatDate(
        new Date(),
        Session.getScriptTimeZone() || "Asia/Jakarta",
        "yyyyMMdd_HHmmss"
      ) +
      ".txt";

    testFile = folder.createFile(
      testName,
      "Temporary NEO ILMA route write test. Safe to delete.",
      MimeType.PLAIN_TEXT
    );

    var testFileId = testFile.getId();

    try {
      testFile.setTrashed(true);
    } catch (cleanupErr) {
      cleanupWarning =
        " Write test berhasil, tetapi file test tidak dapat dipindahkan ke Trash otomatis: " +
        (cleanupErr && cleanupErr.message ? cleanupErr.message : String(cleanupErr));
    }

    route.writeAccess = true;
    route.testFileId = testFileId;
    route.message =
      "ROUTE OK + WRITE ACCESS OK. File dapat ditulis ke folder \"" +
      route.folderName + "\"." +
      cleanupWarning;

    return route;

  } catch (err) {
    route.success = false;
    route.writeAccess = false;
    route.code = "FOLDER_WRITE_FAILED";
    route.message =
      "Route ditemukan, tetapi Apps Script tidak memiliki akses tulis ke folder tujuan: " +
      (err && err.message ? err.message : String(err));

    return route;
  }
}


/**
 * Convenience function for Apps Script Editor.
 *
 * Edit ONLY the 3 values below, then click Run.
 * This performs resolver-only testing and does NOT create a file.
 */
/**
 * X-RAY TRACE for TYPE_ROUTING.
 *
 * Run this BEFORE changing any more database values.
 * It prints:
 * - Spreadsheet ID + name actually opened by CONFIG
 * - TYPE_ROUTING sheet identity
 * - raw headers
 * - normalized headers
 * - every non-empty row
 * - whether each row is Active
 * - exact comparison against "Worksheets PDF"
 */
function debugInspectTypeRouting() {
  setupPortalSheets();

  var ss = getSpreadsheet_();
  var sheet = ss.getSheetByName(CONFIG.TYPE_ROUTING_SHEET);

  Logger.log("========================================");
  Logger.log("NEO ILMA TYPE_ROUTING X-RAY TRACE");
  Logger.log("========================================");
  Logger.log("Spreadsheet Name : " + ss.getName());
  Logger.log("Spreadsheet ID   : " + ss.getId());
  Logger.log("Configured ID    : " + CONFIG.SPREADSHEET_ID);
  Logger.log("Sheet expected   : " + CONFIG.TYPE_ROUTING_SHEET);
  Logger.log("Sheet found?     : " + (!!sheet));

  if (!sheet) {
    Logger.log("STOP: TYPE_ROUTING sheet tidak ditemukan.");
    return {
      success: false,
      code: "TYPE_ROUTING_SHEET_NOT_FOUND",
      spreadsheetName: ss.getName(),
      spreadsheetId: ss.getId(),
      configuredSpreadsheetId: CONFIG.SPREADSHEET_ID
    };
  }

  Logger.log("Sheet actual name: " + sheet.getName());
  Logger.log("Last row         : " + sheet.getLastRow());
  Logger.log("Last column      : " + sheet.getLastColumn());

  if (sheet.getLastRow() < 1 || sheet.getLastColumn() < 1) {
    Logger.log("STOP: Sheet kosong.");
    return {
      success: false,
      code: "TYPE_ROUTING_EMPTY"
    };
  }

  var data = sheet.getDataRange().getValues();
  var rawHeaders = data[0].map(function(v) { return cleanString_(v); });
  var normalizedHeaders = rawHeaders.map(normalizeHeader_);

  Logger.log("Raw headers       : " + JSON.stringify(rawHeaders));
  Logger.log("Normalized headers: " + JSON.stringify(normalizedHeaders));

  var target = "Worksheets PDF";
  var targetNormalized = normalizeComparable_(target);

  Logger.log("----------------------------------------");
  Logger.log("TARGET TYPE        : [" + target + "]");
  Logger.log("TARGET NORMALIZED  : [" + targetNormalized + "]");
  Logger.log("----------------------------------------");

  var inspectedRows = [];

  for (var i = 1; i < data.length; i++) {
    var rawRow = data[i];

    var hasAnyValue = rawRow.some(function(v) {
      return cleanString_(v) !== "";
    });

    if (!hasAnyValue) continue;

    var obj = rowToObject_(rawRow, normalizedHeaders);

    var typeRaw = cleanString_(obj.type);
    var typeNormalized = normalizeComparable_(typeRaw);
    var activeRaw = obj.active;
    var activeResult = isRoutingActive_(activeRaw);
    var typeMatches = typeNormalized === targetNormalized;

    var rowTrace = {
      sheetRow: i + 1,
      rawRow: rawRow.map(function(v) { return cleanString_(v); }),
      parsed: obj,
      typeRaw: typeRaw,
      typeNormalized: typeNormalized,
      activeRaw: activeRaw,
      activeRecognized: activeResult,
      typeMatchesTarget: typeMatches,
      wouldResolverUseThisRow: activeResult && typeMatches
    };

    inspectedRows.push(rowTrace);

    Logger.log(
      "ROW " + (i + 1) +
      " | Type=[" + typeRaw + "]" +
      " | normalized=[" + typeNormalized + "]" +
      " | Active=[" + activeRaw + "]" +
      " | active?=" + activeResult +
      " | typeMatch?=" + typeMatches +
      " | USE?=" + (activeResult && typeMatches)
    );
  }

  var usableRows = inspectedRows.filter(function(row) {
    return row.wouldResolverUseThisRow;
  });

  Logger.log("----------------------------------------");
  Logger.log("Total non-empty rows : " + inspectedRows.length);
  Logger.log("Usable target rows   : " + usableRows.length);
  Logger.log("========================================");

  if (usableRows.length === 0) {
    Logger.log("DIAGNOSIS: Resolver benar-benar tidak melihat active row yang match.");
    Logger.log("Kirim log ini ke ChatGPT; jangan ubah database dulu.");
  } else if (usableRows.length === 1) {
    Logger.log("DIAGNOSIS: TYPE_ROUTING sebenarnya valid.");
    Logger.log("Kalau resolver tetap gagal, kita trace fungsi resolver berikutnya.");
  } else {
    Logger.log("DIAGNOSIS: Ada duplicate active TYPE_ROUTING.");
  }

  return {
    success: true,
    spreadsheetName: ss.getName(),
    spreadsheetId: ss.getId(),
    configuredSpreadsheetId: CONFIG.SPREADSHEET_ID,
    sheetName: sheet.getName(),
    rawHeaders: rawHeaders,
    normalizedHeaders: normalizedHeaders,
    target: target,
    targetNormalized: targetNormalized,
    rows: inspectedRows,
    usableTargetRows: usableRows.length
  };
}


function debugResolveUploadRoute() {
  var TEST_GRADE = "1 Inter";
  var TEST_SUBJECT = "MATH";
  var TEST_TYPE = "Worksheets PDF";

  var result = resolveUploadRoute(
    TEST_GRADE,
    TEST_SUBJECT,
    TEST_TYPE
  );

  Logger.log(JSON.stringify(result, null, 2));
  return result;
}


/**
 * Convenience function for Apps Script Editor.
 *
 * Edit ONLY the 3 values below, then click Run.
 * WARNING: this creates a tiny temporary text file to prove write access,
 * then immediately attempts to move it to Trash.
 */
function debugTestUploadRouteWrite() {
  var TEST_GRADE = "1 Inter";
  var TEST_SUBJECT = "MATH";
  var TEST_TYPE = "Worksheets PDF";

  var result = testUploadRoute(
    TEST_GRADE,
    TEST_SUBJECT,
    TEST_TYPE
  );

  Logger.log(JSON.stringify(result, null, 2));
  return result;
}


/**
 * Reads a sheet using normalized headers, preserving header-based behavior.
 */
function readSheetObjects_(sheetName) {
  var sheet = getSpreadsheet_().getSheetByName(sheetName);

  if (!sheet) {
    throw new Error("Sheet tidak ditemukan: " + sheetName);
  }

  var data = sheet.getDataRange().getValues();
  if (!data || data.length < 2) return [];

  var headers = data[0].map(normalizeHeader_);
  var rows = [];

  for (var i = 1; i < data.length; i++) {
    var obj = rowToObject_(data[i], headers);

    // Ignore completely empty rows.
    var hasValue = false;
    for (var key in obj) {
      if (
        Object.prototype.hasOwnProperty.call(obj, key) &&
        cleanString_(obj[key]) !== ""
      ) {
        hasValue = true;
        break;
      }
    }

    if (hasValue) rows.push(obj);
  }

  return rows;
}


/**
 * Routing rows must be explicitly active.
 * Accepts Google Sheets TRUE booleans as well as common text equivalents.
 */
function isRoutingActive_(value) {
  if (value === true) return true;
  if (value === false || value === null || value === undefined) return false;

  var text = normalizeComparable_(value);

  return (
    text === "true" ||
    text === "1" ||
    text === "yes" ||
    text === "y" ||
    text === "active" ||
    text === "aktif"
  );
}


function routeError_(code, message, extra) {
  var result = {
    success: false,
    code: code,
    message: message
  };

  extra = extra || {};

  Object.keys(extra).forEach(function(key) {
    result[key] = extra[key];
  });

  return result;
}

function buildCascadeIndex_(resources) {
  var subjectMap = {};
  var chapterMap = {};

  resources.forEach(function(resource) {
    var targets = getTargetClasses_(resource.grade);

    targets.forEach(function(className) {
      var classKey = normalizeComparable_(className);

      if (!subjectMap[classKey]) subjectMap[classKey] = [];
      pushUniqueCaseInsensitive_(subjectMap[classKey], resource.subject);

      var subjectKey = classKey + "||" + normalizeComparable_(resource.subject);
      if (!chapterMap[subjectKey]) chapterMap[subjectKey] = [];
      pushUniqueCaseInsensitive_(chapterMap[subjectKey], resource.chapter);
    });
  });

  Object.keys(subjectMap).forEach(function(key) {
    subjectMap[key] = naturalSort_(subjectMap[key]);
  });

  Object.keys(chapterMap).forEach(function(key) {
    chapterMap[key] = naturalSort_(chapterMap[key]);
  });

  return {
    subjectsByClass: subjectMap,
    chaptersByClassSubject: chapterMap
  };
}

function readMasterResources_() {
  var sheet = getMasterSheet_();
  var data = sheet.getDataRange().getValues();
  if (!data || data.length < 2) return [];

  var normalizedHeaders = data[0].map(normalizeHeader_);
  var required = ["id", "grade", "subject", "chapter", "topic", "type", "link"];

  required.forEach(function(key) {
    if (normalizedHeaders.indexOf(key) === -1) {
      throw new Error("Master database tidak memiliki kolom wajib: " + key);
    }
  });

  var resources = [];

  for (var i = 1; i < data.length; i++) {
    var obj = rowToObject_(data[i], normalizedHeaders);
    if (!obj.id && !obj.link) continue;

    resources.push({
      id: cleanString_(obj.id),
      grade: cleanString_(obj.grade),
      subject: cleanString_(obj.subject),
      chapter: cleanString_(obj.chapter),
      topic: cleanString_(obj.topic),
      taskName: cleanString_(obj.taskname),
      type: cleanString_(obj.type),
      link: cleanString_(obj.link),
      uploader: cleanString_(obj.uploader)
    });
  }

  return resources;
}

function appendToMaster_(resource) {
  var sheet = getMasterSheet_();
  ensureMasterUploaderColumn_();

  var data = sheet.getDataRange().getValues();
  var headers = data[0].map(normalizeHeader_);
  var row = new Array(headers.length).fill("");

  setRowValueByHeader_(row, headers, "id", resource.id);
  setRowValueByHeader_(row, headers, "grade", resource.grade);
  setRowValueByHeader_(row, headers, "subject", resource.subject);
  setRowValueByHeader_(row, headers, "chapter", resource.chapter);
  setRowValueByHeader_(row, headers, "topic", resource.topic);
  setRowValueByHeader_(row, headers, "taskname", resource.taskName);
  setRowValueByHeader_(row, headers, "type", resource.type);
  setRowValueByHeader_(row, headers, "link", resource.link);
  setRowValueByHeader_(row, headers, "uploader", resource.uploader);

  sheet.appendRow(row);
}

function getTeacherNames_() {
  var lookupValues = getLookupValues_(CONFIG.TEACHER_HEADER_ALIASES);
  if (lookupValues.length > 0) return naturalSort_(uniqueCaseInsensitive_(lookupValues));

  return naturalSort_(
    uniqueCaseInsensitive_(
      readMasterResources_().map(function(r) { return r.uploader; })
    )
  );
}

function getLookupValues_(aliases) {
  var sheet = getSpreadsheet_().getSheetByName(CONFIG.LOOKUPS_SHEET);
  if (!sheet) return [];

  var data = sheet.getDataRange().getValues();
  if (!data || data.length < 2) return [];

  var headers = data[0].map(function(h) { return cleanString_(h); });
  var columnIndex = findHeaderAliasIndex_(headers, aliases);
  if (columnIndex === -1) return [];

  var values = [];
  for (var i = 1; i < data.length; i++) {
    var value = cleanString_(data[i][columnIndex]);
    if (value) values.push(value);
  }

  return uniqueCaseInsensitive_(values);
}

function validateTeacher_(teacherName) {
  var teachers = getTeacherNames_();
  if (teachers.length === 0) return { ok: true };

  var target = normalizeComparable_(teacherName);
  for (var i = 0; i < teachers.length; i++) {
    if (normalizeComparable_(teachers[i]) === target) return { ok: true };
  }

  return { ok: false, message: "Nama guru tidak ditemukan di daftar uploader." };
}

function normalizeSubmissionPayload_(payload) {
  payload = payload || {};

  return {
    uploader: cleanString_(payload.uploader),
    grade: formatGradeValue_(cleanString_(payload.grade)),
    subject: cleanString_(payload.subject),
    chapter: cleanString_(payload.chapter),
    topic: cleanString_(payload.topic),
    taskName: cleanString_(payload.taskName),
    type: cleanString_(payload.type),
    link: cleanString_(payload.link)
  };
}

function validateSubmissionMetadata_(payload) {
  if (!payload.uploader) return { ok: false, message: "Pilih nama guru." };
  if (!payload.grade) return { ok: false, message: "Pilih kelas." };
  if (!isValidGradeValue_(payload.grade)) return { ok: false, message: "Nilai kelas tidak valid." };
  if (!payload.subject) return { ok: false, message: "Pilih mata pelajaran." };
  if (!payload.chapter) return { ok: false, message: "Isi atau pilih bab." };
  if (!payload.topic) return { ok: false, message: "Isi topik / sub-bab." };
  if (!payload.taskName) return { ok: false, message: "Isi nama tugas." };
  if (!payload.type) return { ok: false, message: "Pilih jenis file." };

  return { ok: true };
}

function validateSubmission_(payload) {
  var metadataValidation = validateSubmissionMetadata_(payload);
  if (!metadataValidation.ok) return metadataValidation;

  if (!payload.link) return { ok: false, message: "Masukkan link resource." };
  if (!/^https?:\/\//i.test(payload.link)) {
    return { ok: false, message: "Link harus diawali http:// atau https://" };
  }

  return { ok: true };
}


// ============================================================
// AUTO NUMBERING TASK NAME
// ============================================================
function buildTopicSequenceRegistry_() {
  var registry = {};

  readMasterResources_().forEach(function(resource) {
    registerExistingTaskName_(registry, {
      grade: resource.grade,
      subject: resource.subject,
      chapter: resource.chapter,
      topic: resource.topic,
      taskName: resource.taskName || resource.topic,
      type: resource.type
    });
  });

  var sheet = getSpreadsheet_().getSheetByName(CONFIG.SUBMISSIONS_SHEET);
  if (sheet && sheet.getLastRow() >= 2) {
    var data = sheet.getDataRange().getValues();
    var headers = data[0].map(normalizeHeader_);

    for (var i = 1; i < data.length; i++) {
      var obj = rowToObject_(data[i], headers);
      if (normalizeComparable_(obj.status) !== "pending") continue;

      registerExistingTaskName_(registry, {
        grade: obj.grade,
        subject: obj.subject,
        chapter: obj.chapter,
        topic: obj.topic,
        taskName: obj.taskname || obj.topic,
        type: obj.type
      });
    }
  }

  return registry;
}

function registerExistingTaskName_(registry, resource) {
  var originalTaskName = cleanString_(resource.taskName);
  if (!originalTaskName) return;

  var baseTaskName = getBaseTaskName_(originalTaskName);
  var key = buildTaskSequenceKey_(
    resource.grade, resource.subject, resource.chapter,
    resource.topic, baseTaskName, resource.type
  );

  var sequenceNumber = getTaskSequenceNumber_(originalTaskName);
  if (!registry[key]) registry[key] = { maxNumber: 0 };
  if (sequenceNumber > registry[key].maxNumber) registry[key].maxNumber = sequenceNumber;
}

function allocateSequencedTopic_(resource, registry) {
  var baseTaskName = getBaseTaskName_(resource.taskName);
  if (!baseTaskName) return "";

  var key = buildTaskSequenceKey_(
    resource.grade, resource.subject, resource.chapter,
    resource.topic, baseTaskName, resource.type
  );

  var currentMax = registry[key] ? (registry[key].maxNumber || 0) : 0;
  var nextNumber = currentMax + 1;
  var finalTaskName = nextNumber <= 1 ? baseTaskName : baseTaskName + " #" + nextNumber;

  registry[key] = { maxNumber: nextNumber <= 1 ? 1 : nextNumber };
  return finalTaskName;
}

function getBaseTaskName_(taskName) {
  return cleanString_(taskName).replace(/\s+#\d+\s*$/i, "").trim();
}

function getTaskSequenceNumber_(taskName) {
  var text = cleanString_(taskName);
  var match = text.match(/\s+#(\d+)\s*$/i);
  if (!match) return 1;
  var number = parseInt(match[1], 10);
  return (!isNaN(number) && number >= 1) ? number : 1;
}

function buildTaskSequenceKey_(grade, subject, chapter, topic, baseTaskName, type) {
  return [
    normalizeComparable_(formatGradeValue_(grade)),
    normalizeComparable_(subject),
    normalizeComparable_(chapter),
    normalizeComparable_(topic),
    normalizeComparable_(baseTaskName),
    normalizeComparable_(type)
  ].join("||");
}


function findDuplicateLink_(link) {
  var masterDuplicate = findDuplicateInMaster_(link);
  if (masterDuplicate) return { source: "MASTER", id: masterDuplicate.id };

  var submissionDuplicate = findDuplicateInPendingSubmissions_(link);
  if (submissionDuplicate) return { source: "SUBMISSION", id: submissionDuplicate.submissionId };

  return null;
}

function findDuplicateInMaster_(link) {
  var key = normalizeResourceLink_(link);
  var resources = readMasterResources_();

  for (var i = 0; i < resources.length; i++) {
    if (normalizeResourceLink_(resources[i].link) === key) return resources[i];
  }

  return null;
}

function findDuplicateInPendingSubmissions_(link) {
  var key = normalizeResourceLink_(link);
  var sheet = getSpreadsheet_().getSheetByName(CONFIG.SUBMISSIONS_SHEET);
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return null;

  var headers = data[0].map(normalizeHeader_);

  for (var i = 1; i < data.length; i++) {
    var obj = rowToObject_(data[i], headers);
    if (
      normalizeComparable_(obj.status) === "pending" &&
      normalizeResourceLink_(obj.link) === key
    ) {
      return { submissionId: cleanString_(obj.submissionid) };
    }
  }

  return null;
}

function getAllRegisteredLinkKeys_() {
  var map = {};

  readMasterResources_().forEach(function(r) {
    var key = normalizeResourceLink_(r.link);
    if (key) map[key] = true;
  });

  var sheet = getSpreadsheet_().getSheetByName(CONFIG.SUBMISSIONS_SHEET);
  var data = sheet.getDataRange().getValues();

  if (data.length >= 2) {
    var headers = data[0].map(normalizeHeader_);
    for (var i = 1; i < data.length; i++) {
      var obj = rowToObject_(data[i], headers);
      if (normalizeComparable_(obj.status) === "pending") {
        var key = normalizeResourceLink_(obj.link);
        if (key) map[key] = true;
      }
    }
  }

  return map;
}

function normalizeResourceLink_(url) {
  var text = cleanString_(url);
  if (!text) return "";

  var idMatch = text.match(/[?&]id=([^&#]+)/i) || text.match(/\/d\/([^/]+)/i);
  if (idMatch && idMatch[1]) return "gdrive:" + idMatch[1];

  return text.replace(/#.*$/, "").replace(/\/+$/, "").toLowerCase();
}

function findSubmissionRow_(submissionId) {
  var sheet = getSpreadsheet_().getSheetByName(CONFIG.SUBMISSIONS_SHEET);
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return null;

  var headers = data[0].map(normalizeHeader_);

  for (var i = 1; i < data.length; i++) {
    var obj = rowToObject_(data[i], headers);
    if (normalizeComparable_(obj.submissionid) === normalizeComparable_(submissionId)) {
      return { rowNumber: i + 1, data: obj };
    }
  }

  return null;
}

function updateSubmissionReview_(rowNumber, status, reviewer, reviewNote, masterId) {
  var sheet = getSpreadsheet_().getSheetByName(CONFIG.SUBMISSIONS_SHEET);
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn())
    .getValues()[0]
    .map(normalizeHeader_);

  setCellByHeader_(sheet, rowNumber, headers, "status", status);
  setCellByHeader_(sheet, rowNumber, headers, "reviewer", reviewer);
  setCellByHeader_(sheet, rowNumber, headers, "reviewnote", reviewNote);
  setCellByHeader_(sheet, rowNumber, headers, "masterid", masterId);
}

function serializeSubmission_(obj) {
  return {
    submissionId: cleanString_(obj.submissionid),
    timestamp: serializeDate_(obj.timestamp),
    uploader: cleanString_(obj.uploader),
    grade: cleanString_(obj.grade),
    subject: cleanString_(obj.subject),
    chapter: cleanString_(obj.chapter),
    topic: cleanString_(obj.topic),
    taskName: cleanString_(obj.taskname),
    type: cleanString_(obj.type),
    link: cleanString_(obj.link),
    status: cleanString_(obj.status),
    reviewer: cleanString_(obj.reviewer),
    reviewNote: cleanString_(obj.reviewnote),
    masterId: cleanString_(obj.masterid),
    source: cleanString_(obj.source),
    originalFileName: cleanString_(obj.originalfilename),
    driveFileId: cleanString_(obj.drivefileid),
    driveFolderId: cleanString_(obj.drivefolderid),
    mimeType: cleanString_(obj.mimetype),
    fileSize: Number(obj.filesize) || 0
  };
}

function createSubmissionId_() {
  var stamp = Utilities.formatDate(
    new Date(),
    Session.getScriptTimeZone() || "Asia/Jakarta",
    "yyyyMMdd-HHmmss"
  );

  var suffix = Utilities.getUuid().replace(/-/g, "").substring(0, 6).toUpperCase();
  return "S-" + stamp + "-" + suffix;
}

function generateNextMasterId_() {
  var resources = readMasterResources_();
  var prefix = CONFIG.MASTER_ID_PREFIX;
  var maxNumber = 0;

  var escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  var regex = new RegExp("^" + escapedPrefix + "(\\d+)$", "i");

  resources.forEach(function(resource) {
    var match = cleanString_(resource.id).match(regex);
    if (match) {
      var number = parseInt(match[1], 10);
      if (!isNaN(number) && number > maxNumber) maxNumber = number;
    }
  });

  return prefix + padNumber_(maxNumber + 1, CONFIG.MASTER_ID_DIGITS);
}

function getTargetClasses_(gradeValue) {
  var text = cleanString_(gradeValue);
  if (!text) return [];

  return text
    .split(/\s+[-–—]\s+/)
    .map(function(value) { return formatSingleClassName_(value); })
    .filter(function(value) { return !!value; });
}

function formatGradeValue_(gradeValue) {
  return getTargetClasses_(gradeValue).join(" - ");
}

function formatSingleClassName_(value) {
  var text = cleanString_(value).replace(/\s+/g, " ");
  var match = text.match(/^(\d+)\s+(inter|mq|ae)$/i);
  if (!match) return text;

  var number = match[1];
  var program = match[2].toLowerCase();

  if (program === "inter") return number + " Inter";
  if (program === "mq") return number + " MQ";
  if (program === "ae") return number + " AE";
  return text;
}

function isValidGradeValue_(gradeValue) {
  var target = normalizeComparable_(formatGradeValue_(gradeValue));

  for (var i = 0; i < GRADE_OPTIONS.length; i++) {
    if (normalizeComparable_(formatGradeValue_(GRADE_OPTIONS[i])) === target) return true;
  }

  return false;
}

function normalizeHeader_(header) {
  var text = cleanString_(header).toLowerCase().replace(/\s+/g, " ");

  if (text === "id") return "id";
  if (text === "grade" || text === "kelas" || text === "class") return "grade";
  if (text === "subject" || text === "mata pelajaran" || text === "matapelajaran" || text === "mapel") return "subject";
  if (text === "chapter" || text === "bab") return "chapter";
  if (text === "topic" || text === "topik" || text === "sub-bab" || text === "sub bab" || text === "subbab") return "topic";
  if (text === "task_name" || text === "task name" || text === "taskname" || text === "nama tugas" || text === "judul tugas") return "taskname";
  if (text === "type" || text === "tipe" || text === "jenis file" || text === "jenis" || text === "format") return "type";
  if (text === "link" || text === "url") return "link";
  if (text === "uploader" || text === "teacher" || text === "guru" || text === "nama guru" || text === "nama pengajar") return "uploader";
  if (text === "submissionid" || text === "submission id") return "submissionid";
  if (text === "timestamp") return "timestamp";
  if (text === "status") return "status";
  if (text === "reviewer") return "reviewer";
  if (text === "reviewnote" || text === "review note") return "reviewnote";
  if (text === "masterid" || text === "master id") return "masterid";

  // Upload routing
  if (text === "route_id" || text === "route id" || text === "routeid") return "routeid";
  if (text === "storage_category" || text === "storage category" || text === "storagecategory") return "storagecategory";
  if (text === "upload_mode" || text === "upload mode" || text === "uploadmode") return "uploadmode";
  if (text === "folder_id" || text === "folder id" || text === "folderid") return "folderid";
  if (text === "folder_url" || text === "folder url" || text === "folderurl") return "folderurl";
  if (text === "active" || text === "aktif") return "active";
  if (text === "notes" || text === "note" || text === "catatan") return "notes";

  // File-upload metadata in SUBMISSIONS
  if (text === "source" || text === "sumber") return "source";
  if (text === "original_file_name" || text === "original file name" || text === "originalfilename") return "originalfilename";
  if (text === "drive_file_id" || text === "drive file id" || text === "drivefileid") return "drivefileid";
  if (text === "drive_folder_id" || text === "drive folder id" || text === "drivefolderid") return "drivefolderid";
  if (text === "mime_type" || text === "mime type" || text === "mimetype") return "mimetype";
  if (text === "file_size" || text === "file size" || text === "filesize") return "filesize";

  return text;
}

function getSpreadsheet_() {
  if (CONFIG.SPREADSHEET_ID && String(CONFIG.SPREADSHEET_ID).trim() !== "") {
    return SpreadsheetApp.openById(String(CONFIG.SPREADSHEET_ID).trim());
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    throw new Error("Spreadsheet tidak ditemukan. Isi CONFIG.SPREADSHEET_ID untuk standalone Apps Script.");
  }

  return ss;
}

function getMasterSheet_() {
  var ss = getSpreadsheet_();
  var sheet = ss.getSheetByName(CONFIG.MASTER_SHEET);
  if (sheet) return sheet;

  var firstSheet = ss.getSheets()[0];
  if (!firstSheet) throw new Error("Master resource sheet tidak ditemukan.");
  return firstSheet;
}

function ensureSheetWithHeaders_(ss, sheetName, headers) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) sheet = ss.insertSheet(sheetName);

  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    return sheet;
  }

  var existingHeaders = sheet
    .getRange(1, 1, 1, Math.max(sheet.getLastColumn(), headers.length))
    .getValues()[0]
    .map(normalizeHeader_);

  headers.forEach(function(header) {
    var normalized = normalizeHeader_(header);
    if (existingHeaders.indexOf(normalized) === -1) {
      var nextColumn = sheet.getLastColumn() + 1;
      sheet.getRange(1, nextColumn).setValue(header);
      existingHeaders.push(normalized);
    }
  });

  sheet.setFrozenRows(1);
  return sheet;
}

function ensureMasterUploaderColumn_() {
  var sheet = getMasterSheet_();
  if (sheet.getLastRow() === 0) {
    throw new Error("Master sheet kosong. Buat header ID | Grade | Subject | Chapter | Topic | Task_Name | Type | Link | Uploader terlebih dahulu.");
  }

  var headers = sheet
    .getRange(1, 1, 1, sheet.getLastColumn())
    .getValues()[0]
    .map(normalizeHeader_);

  if (headers.indexOf("uploader") === -1) {
    sheet.getRange(1, sheet.getLastColumn() + 1).setValue("Uploader");
  }
}

function getNormalizedSheetHeaders_(sheet) {
  if (!sheet || sheet.getLastColumn() < 1) return [];

  return sheet
    .getRange(1, 1, 1, sheet.getLastColumn())
    .getValues()[0]
    .map(normalizeHeader_);
}

function buildRowFromObject_(normalizedHeaders, data) {
  return normalizedHeaders.map(function(key) {
    return Object.prototype.hasOwnProperty.call(data, key)
      ? data[key]
      : "";
  });
}

function rowToObject_(row, normalizedHeaders) {
  var obj = {};
  for (var i = 0; i < normalizedHeaders.length; i++) {
    var key = normalizedHeaders[i];
    if (!key) continue;
    obj[key] = row[i];
  }
  return obj;
}

function setRowValueByHeader_(row, headers, key, value) {
  var index = headers.indexOf(key);
  if (index !== -1) row[index] = value;
}

function setCellByHeader_(sheet, rowNumber, headers, key, value) {
  var index = headers.indexOf(key);
  if (index === -1) throw new Error("Kolom tidak ditemukan: " + key);
  sheet.getRange(rowNumber, index + 1).setValue(value);
}

function findHeaderAliasIndex_(headers, aliases) {
  var normalizedAliases = aliases.map(normalizeComparable_);
  for (var i = 0; i < headers.length; i++) {
    if (normalizedAliases.indexOf(normalizeComparable_(headers[i])) !== -1) return i;
  }
  return -1;
}

function verifyAdminPin_(pin) {
  var configured = String(CONFIG.ADMIN_PIN || "");
  if (!configured) throw new Error("Admin Review belum diaktifkan.");
  if (String(pin || "") !== configured) throw new Error("PIN admin salah.");
}

function logAction_(action, submissionId, uploader, details) {
  var sheet = getSpreadsheet_().getSheetByName(CONFIG.LOG_SHEET);
  if (!sheet) return;
  sheet.appendRow([new Date(), action, submissionId || "", uploader || "", details || ""]);
}

function cleanString_(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function normalizeComparable_(value) {
  return cleanString_(value).replace(/\s+/g, " ").toLowerCase();
}

function uniqueCaseInsensitive_(values) {
  var seen = {};
  var result = [];

  (values || []).forEach(function(value) {
    var cleaned = cleanString_(value);
    if (!cleaned) return;
    var key = normalizeComparable_(cleaned);
    if (!seen[key]) {
      seen[key] = true;
      result.push(cleaned);
    }
  });

  return result;
}

function pushUniqueCaseInsensitive_(array, value) {
  var cleaned = cleanString_(value);
  if (!cleaned) return;

  var key = normalizeComparable_(cleaned);
  for (var i = 0; i < array.length; i++) {
    if (normalizeComparable_(array[i]) === key) return;
  }
  array.push(cleaned);
}

function naturalSort_(values) {
  return (values || []).slice().sort(function(a, b) {
    return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" });
  });
}

function padNumber_(number, digits) {
  var text = String(number);
  while (text.length < digits) text = "0" + text;
  return text;
}

function serializeDate_(value) {
  if (value instanceof Date) {
    return Utilities.formatDate(
      value,
      Session.getScriptTimeZone() || "Asia/Jakarta",
      "yyyy-MM-dd HH:mm:ss"
    );
  }
  return cleanString_(value);
}
