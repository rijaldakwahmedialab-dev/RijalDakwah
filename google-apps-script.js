/**
 * =============================================================================
 * GOOGLE APPS SCRIPT: DATABASE PENILAIAN WAWANCARA UKM RIJAL DAKWAH
 * =============================================================================
 * 
 * FITUR:
 * 1. Simpan & Update nilai calon (real-time ke Tab 2).
 * 2. Reset / Hapus nilai calon per individu (action: "delete").
 * 3. Hapus seluruh nilai penilaian (action: "clear_all").
 * 4. Tab 1 (Data Formulir Pendaftaran Asli): 100% STERIL & TIDAK DISENTUH.
 * 
 * CARA UPDATE DI GOOGLE SPREADSHEET (1 Menit):
 * 1. Buka Google Sheet: https://docs.google.com/spreadsheets/d/1bcFa1yY4dOuFxsw2Y5aNy3osYjGtBK34bmcIiUEm0YY/edit
 * 2. Ekstensi -> Apps Script.
 * 3. Hapus kode lama, ganti dengan kode di bawah ini, lalu klik Simpan (Ctrl+S).
 * 4. Klik: Terapkan (Deploy) -> Kelola penerapan (Manage deployments) -> Klik ikon Pensil (Edit) -> Versi Baru (New version) -> Terapkan (Deploy).
 */

const SHEET_NAME_SCORES = "Hasil_Penilaian";

function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME_SCORES);
    
    if (!sheet) {
      sheet = initScoresSheet(ss);
    }
    
    const data = sheet.getDataRange().getValues();
    const scores = {};
    
    if (data.length > 1) {
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const key = String(row[0] || "").trim();
        if (!key) continue;
        
        // Cek status, jika unscored atau deleted maka lewati
        const statusVal = String(row[5] || row[3] || "scored").trim().toLowerCase();
        if (statusVal === "unscored" || statusVal === "deleted") {
          continue;
        }
        
        scores[key] = {
          applicantKey: key,
          applicantNim: String(row[1] || "").trim(),
          applicantName: String(row[2] || "").trim(),
          applicantProdi: String(row[3] || "").trim(),
          applicantDivisi: String(row[4] || "").trim(),
          status: statusVal || "scored",
          scoreAdab: Number(row[6]) || 0,
          scoreVisi: Number(row[7]) || 0,
          scoreKeahlian: Number(row[8]) || 0,
          scoreKomitmen: Number(row[9]) || 0,
          finalScore: Number(row[10]) || 0,
          recommendation: String(row[11] || "").trim(),
          notes: String(row[12] || "").trim(),
          interviewer: String(row[13] || "").trim(),
          updatedAt: row[14] ? new Date(row[14]).toISOString() : new Date().toISOString()
        };
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      sheetLocation: "Page 2 (Tab Hasil_Penilaian)",
      totalScores: Object.keys(scores).length,
      scores: scores
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    let payload = null;
    if (e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    }
    
    if (!payload) {
      throw new Error("Data payload kosong.");
    }
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME_SCORES);
    if (!sheet) {
      sheet = initScoresSheet(ss);
    }

    // =========================================================================
    // AKSI 1: HAPUS SELURUH NILAI (CLEAR ALL)
    // =========================================================================
    if (payload.action === 'clear_all') {
      const lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        sheet.deleteRows(2, lastRow - 1);
      }
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        action: "cleared_all"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    const key = String(payload.key || "").trim();
    if (!key) {
      throw new Error("Key required.");
    }

    // Cari baris calon berdasarkan key / NIM
    const data = sheet.getDataRange().getValues();
    let rowIndex = -1;
    const cleanKey = key.replace(/[^a-zA-Z0-9]/g, '');

    for (let i = 1; i < data.length; i++) {
      const rowKey = String(data[i][0] || "").trim();
      const rowNim = String(data[i][1] || "").trim();
      if (rowKey === key || rowKey.replace(/[^a-zA-Z0-9]/g, '') === cleanKey || (rowNim && rowNim.replace(/[^a-zA-Z0-9]/g, '') === cleanKey)) {
        rowIndex = i + 1; // 1-indexed
        break;
      }
    }

    // =========================================================================
    // AKSI 2: HAPUS / RESET NILAI CALON INI (DELETE ROW)
    // =========================================================================
    if (payload.action === 'delete') {
      if (rowIndex > 0) {
        sheet.deleteRow(rowIndex);
        return ContentService.createTextOutput(JSON.stringify({
          status: "success",
          action: "deleted",
          key: key
        })).setMimeType(ContentService.MimeType.JSON);
      }
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        action: "not_found",
        key: key
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // =========================================================================
    // AKSI 3: SIMPAN / UPDATE NILAI CALON
    // =========================================================================
    const scoreData = payload.data || {};
    const statusVal = scoreData.status || "scored";

    // Jika statusnya unscored, hapus barisnya agar bersih
    if (statusVal === "unscored" && rowIndex > 0) {
      sheet.deleteRow(rowIndex);
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        action: "deleted_unscored",
        key: key
      })).setMimeType(ContentService.MimeType.JSON);
    }

    const rowValues = [
      key,
      scoreData.applicantNim || "",
      scoreData.applicantName || "",
      scoreData.applicantProdi || "",
      scoreData.applicantDivisi || "",
      statusVal,
      scoreData.scoreAdab || 0,
      scoreData.scoreVisi || 0,
      scoreData.scoreKeahlian || 0,
      scoreData.scoreKomitmen || 0,
      scoreData.finalScore || 0,
      scoreData.recommendation || "",
      scoreData.notes || "",
      scoreData.interviewer || "",
      scoreData.updatedAt || new Date().toISOString()
    ];

    if (rowIndex > 0) {
      sheet.getRange(rowIndex, 1, 1, rowValues.length).setValues([rowValues]);
    } else {
      sheet.appendRow(rowValues);
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      action: rowIndex > 0 ? "updated" : "inserted",
      key: key
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function initScoresSheet(ss) {
  const sheet = ss.insertSheet(SHEET_NAME_SCORES, 1);
  const headers = [
    "Key (ID)",
    "NIM",
    "Nama Lengkap",
    "Program Studi",
    "Divisi / Jalur",
    "Status Penilaian",
    "Skor Adab (25%)",
    "Skor Visi (25%)",
    "Skor Keahlian (30%)",
    "Skor Komitmen (20%)",
    "Total Nilai",
    "Rekomendasi",
    "Catatan Pewawancara",
    "Nama Pewawancara",
    "Waktu Update"
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight("bold")
             .setBackground("#0C2B33")
             .setFontColor("#DFB76C")
             .setHorizontalAlignment("center");
             
  sheet.setFrozenRows(1);
  sheet.getRange("O2:O").setNumberFormat("yyyy-mm-dd hh:mm:ss");
  return sheet;
}
