/**
 * =============================================================================
 * GOOGLE APPS SCRIPT (VERSI 2.0 - DENGAN FITUR DELETE & ANTI-AMPAS)
 * Database Penilaian Wawancara UKM Rijal Dakwah STDIIS 2026/2027
 * =============================================================================
 * 
 * FITUR UTAMA:
 * 1. Simpan & Update nilai pendaftar (Tab 2: Hasil_Penilaian).
 * 2. Delete / Reset per calon (action: "delete") -> Menghapus fisik baris di sheet.
 * 3. Hapus seluruh data nilai (action: "clear_all") -> Mengosongkan Tab 2.
 * 4. Pembersih Data Sampah (action: "cleanup") -> Membersihkan baris kosong/uji coba.
 * 5. Filter Anti-Ampas pada doGet: Baris kosong/test tidak akan terbaca di web.
 * 6. Tab 1 (Data Formulir Pendaftar Asli): 100% STERIL & TIDAK DISENTUH.
 * 
 * =============================================================================
 * CARA MEMASANG KODE BARU INI DI GOOGLE SPREADSHEET (Hanya 1 Menit):
 * =============================================================================
 * 1. Buka Google Sheet Formulir Rijal Dakwah:
 *    https://docs.google.com/spreadsheets/d/1bcFa1yY4dOuFxsw2Y5aNy3osYjGtBK34bmcIiUEm0YY/edit
 * 2. Di menu atas, klik: Ekstensi (Extensions) -> Apps Script.
 * 3. Hapus seluruh kode lama yang ada di editor, lalu COPY & PASTE seluruh kode ini.
 * 4. Klik ikon "Simpan" (💾 Ctrl+S).
 * 5. PENTING (Deploy Versi Baru):
 *    - Klik tombol biru di kanan atas: "Terapkan" (Deploy) -> "Kelola penerapan" (Manage deployments).
 *    - Klik ikon Pensil (Edit) di samping nama deployment.
 *    - Pada dropdown 'Versi', pilih "Versi baru" (New version).
 *    - Pastikan 'Akses' tetap: "Siapa saja" (Anyone).
 *    - Klik tombol biru "Terapkan" (Deploy). Selesai!
 */

const SHEET_NAME_SCORES = "Hasil_Penilaian";

function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME_SCORES);
    
    if (!sheet) {
      sheet = initScoresSheet(ss);
    }

    // =========================================================================
    // FITUR URL CLEANUP: Panggil ?action=cleanup untuk sapu bersih data ampas
    // =========================================================================
    if (e && e.parameter && e.parameter.action === 'cleanup') {
      const lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        sheet.deleteRows(2, lastRow - 1);
      }
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "Seluruh data penilaian dan ampas berhasil dibersihkan dari Tab Hasil_Penilaian!",
        totalScores: 0,
        scores: {}
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    const data = sheet.getDataRange().getValues();
    const scores = {};
    
    if (data.length > 1) {
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const key = String(row[0] || "").trim();
        
        // Lewati jika key kosong atau key test uji coba
        if (!key || key === "test_check_connection") continue;
        
        const nim = String(row[1] || "").trim();
        const nama = String(row[2] || "").trim();
        const prodi = String(row[3] || "").trim();
        const divisi = String(row[4] || "").trim();
        const statusVal = String(row[5] || row[3] || "scored").trim().toLowerCase();
        
        // FILTER ANTI-AMPAS: Lewati jika statusnya unscored/deleted atau data kosong
        if (statusVal === "unscored" || statusVal === "deleted") {
          continue;
        }

        const scoreAdab = Number(row[6]) || 0;
        const scoreVisi = Number(row[7]) || 0;
        const scoreKeahlian = Number(row[8]) || 0;
        const scoreKomitmen = Number(row[9]) || 0;
        const finalScore = Number(row[10]) || 0;
        const recommendation = String(row[11] || "").trim();
        const notes = String(row[12] || "").trim();
        const interviewer = String(row[13] || "").trim();
        
        // FILTER DATA RUSAK: Jika tidak punya nama & NIM serta nilai 0, lewati
        if (!nim && !nama && finalScore === 0 && !notes && !recommendation) {
          continue;
        }
        
        scores[key] = {
          applicantKey: key,
          applicantNim: nim,
          applicantName: nama,
          applicantProdi: prodi,
          applicantDivisi: divisi,
          status: statusVal || "scored",
          scoreAdab: scoreAdab,
          scoreVisi: scoreVisi,
          scoreKeahlian: scoreKeahlian,
          scoreKomitmen: scoreKomitmen,
          finalScore: finalScore,
          recommendation: recommendation,
          notes: notes,
          interviewer: interviewer,
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
        rowIndex = i + 1; // 1-indexed
        break;
      }
    }

    // =========================================================================
    // AKSI 2: HAPUS / RESET NILAI CALON INI (DELETE ROW FISIK)
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
    // AKSI 3: SIMPAN ATAU UPDATE NILAI CALON
    // =========================================================================
    const scoreData = payload.data || {};
    const statusVal = scoreData.status || "scored";

    // Jika status calon disetel unscored/deleted, hapus barisnya agar bersih
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
 * Inisialisasi Sheet Baru khusus Penilaian di Posisi Tab Ke-2 (Page 2)
 */
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

/**
 * FUNGSI MANUAL: Jalankan fungsi ini sekali di editor Apps Script
 * untuk langsung menyapu bersih semua data ampas/uji coba dari Tab Hasil_Penilaian.
 */
function bersihkanDataAmpasSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME_SCORES);
  if (!sheet) return;
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.deleteRows(2, lastRow - 1);
    Logger.log("Berhasil membersihkan " + (lastRow - 1) + " baris data ampas!");
  }
}
