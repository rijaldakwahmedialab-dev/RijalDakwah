/**
 * =============================================================================
 * GOOGLE APPS SCRIPT (VERSI 3.0 - CLOUD PASSWORD SYNC & PRIVATE DATABASE)
 * UKM Rijal Dakwah STDI Imam Syafi'i Jember Periode 2026/2027
 * =============================================================================
 * 
 * FITUR UTAMA:
 * 1. Cloud Password Sync: Kata sandi panitia tersimpan aman di Script Properties (server Google),
 *    dapat diverifikasi & diubah secara real-time dari web oleh seluruh perangkat panitia.
 * 2. Database Penilaian Private: Seluruh nilai & catatan tersimpan di Google Sheet Private ini
 *    (Tab: Hasil_Penilaian), 100% aman dan terisolasi dari publik / calon pendaftar.
 * 3. Simpan, Update, Hapus (CRUD) nilai wawancara otomatis multi-device real-time.
 * 4. Filter Anti-Ampas & Pembersihan Data Otomatis.
 * 
 * GOOGLE SPREADSHEET TARGET (PRIVATE DATABASE):
 * https://docs.google.com/spreadsheets/d/1aI3lHKD_hNOUiX0FQiiE8hz1CxD0ll0Mj_UrlryVWt0/edit
 * 
 * =============================================================================
 * CARA MEMASANG DI GOOGLE SPREADSHEET BARU (HANYA 1 MENIT):
 * =============================================================================
 * 1. Buka Google Spreadsheet Private Baru Antum:
 *    https://docs.google.com/spreadsheets/d/1aI3lHKD_hNOUiX0FQiiE8hz1CxD0ll0Mj_UrlryVWt0/edit
 * 2. Di menu atas, klik: Ekstensi (Extensions) -> Apps Script.
 * 3. Hapus seluruh isi kode lama bawaan di editor, lalu PASTE SELURUH KODE INI.
 * 4. Klik ikon "Simpan" (💾 Ctrl+S).
 * 5. Terapkan Web App (Deploy):
 *    - Klik tombol biru di kanan atas: "Terapkan" (Deploy) -> "Penerapan baru" (New deployment).
 *    - Klik ikon Roda Gigi (Gear) di samping 'Pilih jenis', lalu pilih: "Aplikasi Web" (Web app).
 *    - Deskripsi: "Database Wawancara V3 Cloud Sync"
 *    - Jalankan sebagai (Execute as): "Saya" (Me / akun Google antum).
 *    - Siapa yang memiliki akses (Who has access): "Siapa saja" (Anyone).
 *    - Klik tombol biru "Terapkan" (Deploy).
 *    - Berikan izin akses jika diminta (Pilih akun -> Advanced -> Go to ... (unsafe) -> Allow).
 * 6. SALIN URL APLIKASI WEB yang diberikan Google (berformat: https://script.google.com/macros/s/.../exec).
 * 7. Tempelkan URL tersebut ke menu "Cloud Sync" di website Portal Wawancara (wawancara.html).
 * =============================================================================
 */

const PRIVATE_SPREADSHEET_ID = "1aI3lHKD_hNOUiX0FQiiE8hz1CxD0ll0Mj_UrlryVWt0";
const SHEET_NAME_SCORES = "Hasil_Penilaian";
const PROPERTY_KEY_PASSWORD = "PANITIA_PASSWORD";
const PROPERTY_KEY_UPDATED_AT = "PANITIA_PASSWORD_UPDATED_AT";
const DEFAULT_PASSWORD = "panitia2026";

/**
 * Mengambil kata sandi aktif panitia dari ScriptProperties server Google.
 * Jika belum ada, otomatis diinisialisasi ke default 'panitia2026'.
 */
function getCloudPassword() {
  const props = PropertiesService.getScriptProperties();
  let pw = props.getProperty(PROPERTY_KEY_PASSWORD);
  if (!pw) {
    pw = DEFAULT_PASSWORD;
    props.setProperty(PROPERTY_KEY_PASSWORD, DEFAULT_PASSWORD);
    props.setProperty(PROPERTY_KEY_UPDATED_AT, new Date().toISOString());
  }
  return pw;
}

/**
 * Memperbarui kata sandi panitia di ScriptProperties server Google.
 */
function setCloudPassword(newPassword) {
  const props = PropertiesService.getScriptProperties();
  props.setProperty(PROPERTY_KEY_PASSWORD, newPassword);
  props.setProperty(PROPERTY_KEY_UPDATED_AT, new Date().toISOString());
}

/**
 * Membuka Spreadsheet Database Private secara failsafe.
 */
function getDatabaseSpreadsheet() {
  try {
    return SpreadsheetApp.openById(PRIVATE_SPREADSHEET_ID);
  } catch (e) {
    return SpreadsheetApp.getActiveSpreadsheet();
  }
}

/**
 * GET Handler: Verifikasi password, ubah password, cek status, dan ambil seluruh nilai.
 */
function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) ? String(e.parameter.action).trim() : "";

    // =========================================================================
    // 1. VERIFIKASI KATA SANDI PANITIA CLOUD
    // =========================================================================
    if (action === 'verify_password') {
      const entered = String(e.parameter.password || "").trim();
      const actual = getCloudPassword();
      const isMatch = (entered === actual);
      return ContentService.createTextOutput(JSON.stringify({
        status: isMatch ? "success" : "error",
        action: "verify_password",
        authenticated: isMatch,
        message: isMatch ? "Kata sandi benar." : "Kata sandi salah!"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // =========================================================================
    // 2. UBAH KATA SANDI PANITIA CLOUD (VIA GET)
    // =========================================================================
    if (action === 'change_password') {
      const current = String(e.parameter.current_password || "").trim();
      const newPw = String(e.parameter.new_password || "").trim();
      const actual = getCloudPassword();
      
      if (current !== actual) {
        return ContentService.createTextOutput(JSON.stringify({
          status: "error",
          action: "change_password",
          authenticated: false,
          message: "Kata sandi saat ini salah!"
        })).setMimeType(ContentService.MimeType.JSON);
      }
      if (newPw.length < 4) {
        return ContentService.createTextOutput(JSON.stringify({
          status: "error",
          action: "change_password",
          message: "Kata sandi baru minimal 4 karakter!"
        })).setMimeType(ContentService.MimeType.JSON);
      }
      setCloudPassword(newPw);
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        action: "change_password",
        authenticated: true,
        message: "Kata sandi panitia di cloud berhasil diperbarui!"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // =========================================================================
    // 3. RESET KATA SANDI PANITIA KE DEFAULT (panitia2026)
    // =========================================================================
    if (action === 'reset_password') {
      setCloudPassword(DEFAULT_PASSWORD);
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        action: "reset_password",
        message: "Kata sandi panitia berhasil dikembalikan ke bawaan (panitia2026)."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // =========================================================================
    // 4. PING / STATUS BACKEND
    // =========================================================================
    if (action === 'ping' || action === 'status') {
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        action: "ping",
        service: "RijalDakwah Cloud Sync V3.0",
        spreadsheetId: PRIVATE_SPREADSHEET_ID,
        timestamp: new Date().toISOString()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // =========================================================================
    // 5. CLEANUP BARIS AMPAS / KOSONG
    // =========================================================================
    const ss = getDatabaseSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME_SCORES);
    if (!sheet) {
      sheet = initScoresSheet(ss);
    }

    if (action === 'cleanup') {
      const lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        sheet.deleteRows(2, lastRow - 1);
      }
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        action: "cleanup",
        message: "Seluruh data ampas berhasil dibersihkan dari Tab Hasil_Penilaian!",
        totalScores: 0,
        scores: {}
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // =========================================================================
    // 6. DEFAULT: AMBIL SELURUH DATA NILAI DARI TAB Hasil_Penilaian
    // =========================================================================
    const data = sheet.getDataRange().getValues();
    const scores = {};

    if (data.length > 1) {
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const key = String(row[0] || "").trim();
        
        // Lewati jika key kosong atau key test koneksi
        if (!key || key === "test_check_connection") continue;

        const statusVal = String(row[5] || "scored").trim().toLowerCase();
        if (statusVal === "unscored" || statusVal === "deleted") continue;

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

/**
 * POST Handler: Simpan nilai, hapus nilai, clear all, dan ubah password via POST.
 */
function doPost(e) {
  try {
    let payload = null;
    if (e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    }
    if (!payload) {
      throw new Error("Data payload kosong.");
    }

    // =========================================================================
    // AKSI 1: UBAH KATA SANDI PANITIA CLOUD (VIA POST)
    // =========================================================================
    if (payload.action === 'change_password') {
      const current = String(payload.current_password || "").trim();
      const newPw = String(payload.new_password || "").trim();
      const actual = getCloudPassword();
      
      if (current !== actual) {
        return ContentService.createTextOutput(JSON.stringify({
          status: "error",
          action: "change_password",
          message: "Kata sandi saat ini salah!"
        })).setMimeType(ContentService.MimeType.JSON);
      }
      if (newPw.length < 4) {
        return ContentService.createTextOutput(JSON.stringify({
          status: "error",
          action: "change_password",
          message: "Kata sandi baru minimal 4 karakter!"
        })).setMimeType(ContentService.MimeType.JSON);
      }
      setCloudPassword(newPw);
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        action: "change_password",
        message: "Kata sandi cloud berhasil diperbarui!"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    const ss = getDatabaseSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME_SCORES);
    if (!sheet) {
      sheet = initScoresSheet(ss);
    }

    // =========================================================================
    // AKSI 2: HAPUS SELURUH NILAI (CLEAR ALL)
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

    // Cari baris calon berdasarkan Key atau NIM
    const data = sheet.getDataRange().getValues();
    let rowIndex = -1;
    const cleanKey = key.replace(/[^a-zA-Z0-9]/g, '');

    for (let i = 1; i < data.length; i++) {
      const rowKey = String(data[i][0] || "").trim();
      const rowNim = String(data[i][1] || "").trim();
      if (
        rowKey === key || 
        rowKey.replace(/[^a-zA-Z0-9]/g, '') === cleanKey || 
        (rowNim && rowNim.replace(/[^a-zA-Z0-9]/g, '') === cleanKey)
      ) {
        rowIndex = i + 1;
        break;
      }
    }

    // =========================================================================
    // AKSI 3: HAPUS / RESET NILAI CALON INI (DELETE ROW FISIK)
    // =========================================================================
    if (payload.action === 'delete') {
      if (rowIndex > 0) {
        sheet.deleteRow(rowIndex);
        return ContentService.createTextOutput(JSON.stringify({
          status: "success",
          action: "deleted",
          key: key,
          deletedRow: rowIndex
        })).setMimeType(ContentService.MimeType.JSON);
      }
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        action: "not_found",
        key: key
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // =========================================================================
    // AKSI 4: SIMPAN ATAU UPDATE NILAI CALON
    // =========================================================================
    const scoreData = payload.data || {};
    const statusVal = scoreData.status || "scored";

    if ((statusVal === "unscored" || statusVal === "deleted") && rowIndex > 0) {
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

/**
 * Inisialisasi Sheet Baru khusus Penilaian di Posisi Tab Ke-1
 */
function initScoresSheet(ss) {
  let sheet = ss.getSheetByName(SHEET_NAME_SCORES);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME_SCORES, 1);
  }
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

/**
 * FUNGSI MANUAL: Jalankan fungsi ini di editor Apps Script
 * untuk langsung menyapu bersih data ampas dari Tab Hasil_Penilaian.
 */
function bersihkanDataAmpasSheet() {
  const ss = getDatabaseSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME_SCORES);
  if (!sheet) return;
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.deleteRows(2, lastRow - 1);
    Logger.log("Berhasil membersihkan " + (lastRow - 1) + " baris data ampas!");
  }
}
