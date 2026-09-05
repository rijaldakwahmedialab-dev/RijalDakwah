/**
 * =============================================================================
 * GOOGLE APPS SCRIPT: DATABASE PENILAIAN WAWANCARA UKM RIJAL DAKWAH
 * =============================================================================
 * 
 * DESAIN KESELAMATAN DATA (DATA STERIL):
 * - Tab 1 (Data Formulir Pendaftaran / Pendaftar Asli): 100% STERIL & TIDAK DISENTUH.
 * - Tab 2 (Hasil_Penilaian): Dibuat khusus sebagai lembar kerja baru di page dua
 *   untuk menampung skor, rekomendasi, dan catatan dari seluruh HP pewawancara.
 * 
 * CARA MEMASANG DI GOOGLE SPREADSHEET (Hanya 1 Menit):
 * 1. Buka Google Sheet Formulir Pendaftaran Rijal Dakwah:
 *    https://docs.google.com/spreadsheets/d/1bcFa1yY4dOuFxsw2Y5aNy3osYjGtBK34bmcIiUEm0YY/edit
 * 2. Di menu atas, klik: Ekstensi (Extensions) -> Apps Script.
 * 3. Hapus kode default yang ada, lalu COPY & PASTE seluruh kode di bawah ini.
 * 4. Klik tombol "Simpan" (ikon disket).
 * 5. Klik tombol biru di kanan atas: "Terapkan" (Deploy) -> "Penerapan baru" (New deployment).
 * 6. Klik ikon gerigi (Select type) -> pilih "Aplikasi Web" (Web app).
 * 7. Isi:
 *    - Deskripsi: API Penilaian Wawancara Rijal Dakwah
 *    - Jalankan sebagai: Saya (Email antum)
 *    - Yang memiliki akses: Siapa saja (Anyone) -> Wajib agar seluruh HP panitia bisa sinkron!
 * 8. Klik "Terapkan" (Deploy), lalu izinkan akses Google (Authorize access).
 * 9. Salin URL Aplikasi Web yang berakhiran "/exec".
 * 10. Masukkan URL tersebut ke file 'database.js' pada baris:
 *     appsScriptUrl: "https://script.google.com/macros/s/.../exec"
 */

const SHEET_NAME_SCORES = "Hasil_Penilaian";

function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME_SCORES);
    
    // Jika belum ada, otomatis buat di tab nomor 2 (index 1) agar tab 1 formulir tetap steril
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
        
        scores[key] = {
          applicantKey: key,
          applicantNim: row[1] || "",
          applicantName: row[2] || "",
          applicantProdi: row[3] || "",
          applicantDivisi: row[4] || "",
          status: row[5] || "scored",
          scoreAdab: Number(row[6]) || 0,
          scoreVisi: Number(row[7]) || 0,
          scoreKeahlian: Number(row[8]) || 0,
          scoreKomitmen: Number(row[9]) || 0,
          finalScore: Number(row[10]) || 0,
          recommendation: row[11] || "",
          notes: row[12] || "",
          interviewer: row[13] || "",
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
    
    if (!payload || !payload.key) {
      throw new Error("Data payload tidak lengkap (key required).");
    }
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME_SCORES);
    
    // Jika belum ada, otomatis buat di tab nomor 2 (index 1)
    if (!sheet) {
      sheet = initScoresSheet(ss);
    }
    
    const key = String(payload.key).trim();
    const scoreData = payload.data || {};
    
    // Cari apakah calon dengan key/NIM ini sudah pernah dinilai sebelumnya
    const data = sheet.getDataRange().getValues();
    let rowIndex = -1;
    
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() === key) {
        rowIndex = i + 1; // Baris ke-N (1-indexed)
        break;
      }
    }
    
    // Baris data lengkap dengan 15 kolom terstruktur
    const rowValues = [
      key,                                         // Col 1: Key (ID Unik)
      scoreData.applicantNim || "",                // Col 2: NIM
      scoreData.applicantName || "",               // Col 3: Nama Lengkap
      scoreData.applicantProdi || "",              // Col 4: Program Studi
      scoreData.applicantDivisi || "",             // Col 5: Divisi / Jalur
      scoreData.status || "scored",                // Col 6: Status
      scoreData.scoreAdab || 0,                    // Col 7: Adab (25%)
      scoreData.scoreVisi || 0,                    // Col 8: Visi (25%)
      scoreData.scoreKeahlian || 0,                // Col 9: Keahlian (30%)
      scoreData.scoreKomitmen || 0,                // Col 10: Komitmen (20%)
      scoreData.finalScore || 0,                   // Col 11: Total Nilai Akhir
      scoreData.recommendation || "",              // Col 12: Rekomendasi
      scoreData.notes || "",                       // Col 13: Catatan Penguji
      scoreData.interviewer || "",                 // Col 14: Nama Pewawancara
      scoreData.updatedAt || new Date().toISOString() // Col 15: Timestamp Update
    ];
    
    if (rowIndex > 0) {
      // Jika calon sudah ada, update baris yang bersangkutan (tidak membuat baris duplikat)
      sheet.getRange(rowIndex, 1, 1, rowValues.length).setValues([rowValues]);
    } else {
      // Jika baru pertama dinilai, tambahkan baris baru di bawah
      sheet.appendRow(rowValues);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      action: rowIndex > 0 ? "updated" : "inserted",
      sheet: SHEET_NAME_SCORES,
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
 * Tab Ke-1 pendaftar tetap 100% aman dan tidak terganggu.
 */
function initScoresSheet(ss) {
  // Sisipkan sheet baru tepat di posisi ke-2 (index 1)
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
  
  // Styling elegan tema khas Rijal Dakwah STDIIS
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight("bold")
             .setBackground("#0C2B33") // Deep Green khas STDIIS
             .setFontColor("#DFB76C")  // Gold
             .setHorizontalAlignment("center");
             
  sheet.setFrozenRows(1);
  
  // Set format kolom tanggal pada kolom ke-15
  sheet.getRange("O2:O").setNumberFormat("yyyy-mm-dd hh:mm:ss");
  
  return sheet;
}
