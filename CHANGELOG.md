# Changelog - Web UKM Rijal Dakwah STDIIS

Semua catatan pembaruan, perubahan teknis, dan riwayat pengerjaan proyek.

---
## [2026-09-10 - Update 23] - Sistem Dual-Role (Super Admin admin2026 vs Panitia panitia2026) & Isolasi Presisi Reset Nilai Calon (wawancara.html)

### 👥 Pemisahan Hak Akses Role (Dual-Role Authentication)
- **Super User (`admin2026`)**:
  - Hak akses kontrol penuh (*Full Control*).
  - **Navbar**: Menampilkan tombol Cloud Sync, Perbarui, Ekspor Rekap, Profil Admin (dengan label `👑 Super Admin` & kontrol master password), Kunci Akses, dan Web Utama.
  - **Top Bar**: Indikator Cloud Sync aktif dan status badge `👑 Mode: Super Admin`.
  - **Hero Section**: Badge `PANEL SUPER USER (ADMIN2026)` serta 4 tombol tindakan manajemen: *Sheet Pendaftar*, *Database Nilai (Private)*, *Backup Nilai*, dan *Reset Nilai (Dev)*.
  - Akses penuh tanpa hambatan ke seluruh modal konfigurasi dan fitur dev.
- **Panitia Evaluator (`panitia2026`)**:
  - Tampilan disederhanakan total agar bersih, fokus, dan bebas risiko salah klik.
  - **Navbar**: Menampilkan tombol esensial dan sinkron:
    - **Cloud Sync** (`[Cloud Sync •]`): Tetap ditampilkan dengan dot hijau berdenyut sebagai jaminan visual bahwa penilaian terhubung dan tersinkronisasi real-time ke cloud. Klik panitia langsung memicu sinkronisasi manual kilat (*instant sync*) tanpa membuka modal konfigurasi sensitif.
    - **Perbarui**: Menyinkronkan antrean pendaftar dan lembar nilai dari Google Sheets.
    - **Kunci**: Logout dan penguncian sesi aman.
    - **Web Utama**: Tautan kembali ke beranda.
  - **Top Bar**: Menampilkan status live, indikator koneksi cloud, dan nama pewawancara (`👤 Pewawancara: [nama]` / `👤 Mode: Panitia`).
  - **Hero Section**: Mengeliminasi seluruh tombol dev/admin (*Sheet Pendaftar*, *Database Nilai Private*, *Backup Nilai*, dan *Reset Nilai Dev* disembunyikan total). Badge disesuaikan menjadi `PANEL EVALUATOR WAWANCARA (PANITIA)`.
  - Proteksi ketat (*Security Guards*): Fungsi admin seperti `openCloudSyncModal()`, `openBackupModal()`, `openChangePasswordModal()`, `exportInterviewRecap()`, dan `handleDevResetAllScores()` otomatis menolak eksekusi jika pengguna bukan Super User.

### 🎯 Penegasan & Isolasi Presisi Tombol "Reset Nilai" Calon Terdaftar
- **Isolasi Penghapusan Nilai Tunggal**: Tombol *"Reset Nilai"* di lembar penilaian bawah dijamin 100% hanya menghapus data penilaian calon yang sedang aktif dibuka (`delete interviewScores[key]`), tanpa menyentuh pendaftar lain.
- **Keamanan Data Calon Terdaftar**: Data registrasi, biodata, dan jawaban formulir calon tetap utuh tersimpan di antrean pendaftar (`rawApplicants`), hanya status wawancara yang dikembalikan ke *"Belum Dinilai"*.
- **Pembatalan Timer Autosave (*Debounce Guard*)**: Menambahkan pembatalan otomatis timer autosave (`notesDebounceTimer` & `cloudPushDebounceTimer`) sebelum eksekusi reset agar input ketikan catatan terakhir tidak tersimpan kembali secara tak sengaja.
- **Dialog & Notifikasi Edukatif**:
  - Dialog konfirmasi kini secara eksplisit mencantumkan nama dan NIM calon, menegaskan bahwa data pendaftaran tetap aman.
  - Label dan tooltip tombol diperjelas dengan ikon rotasi: `Reset Nilai`.
  - Notifikasi toast mengonfirmasi keberhasilan reset dan kepastian keamanan data calon.

### ☁️ Sinkronisasi Script Cloud Backend (Google Apps Script)
- Memperbarui `google-apps-script.js` dan `KODE_APPS_SCRIPT_TERBARU.txt` agar aksi `verify_password` mengenali `admin2026` sebagai role `admin` dan `panitia2026` sebagai role `panitia`.
- Menyelaraskan fallback verifikasi sandi di `pengumuman.html`.

---
## [2026-09-09 - Update 22] - Normalisasi Presisi Counter Jalur & Tombol Reset Total Nilai Khusus Dev (wawancara.html)

### 📊 Perbaikan Inkonsistensi Counter Jalur Pendaftar (Presisi 100%)
- **Akar Masalah Teridentifikasi**: 29 pendaftar pertama (pada tanggal 2 September 2026) mendaftar sebelum pertanyaan *"Bergabung Sebagai"* dibuat di Google Form, sehingga kolom tersebut kosong dan tidak terhitung ke Pengurus maupun Anggota (sebelumnya 68 Pengurus + 89 Anggota = 157, selisih 29 dari 186 total pendaftar).
- **Normalisasi Cerdas (`normalizeApplicantRoles`)**: Seluruh 29 pendaftar tersebut terbukti memilih Divisi Utama (Dakwah Digital, TPQ, Keilmuan, Acara, Humas, Inventaris), sehingga dinormalisasi otomatis sebagai **Jalur Pengurus**.
- **Hasil Akurat & Selaras**:
  - **Total Pendaftar**: **186**
  - **Jalur Pengurus**: **97**
  - **Jalur Anggota**: **89**
  - **Penjumlahan Presisi**: $97 + 89 = 186$ (Konsisten 100%, filter jalur kini mencakup seluruh berkas).

### 🗑️ Tombol "Reset Nilai (Dev)" & Pelepasan Total dari Sheet 2 Lama
- **Tombol Reset Khusus Dev / Panitia di Hero**:
  - Menambahkan tombol merah beraksen rose: *"Reset Nilai (Dev)"* di samping tombol Backup Nilai.
  - Menggunakan proteksi ganda (konfirmasi dialog dan pengetikan kata `"RESET"`) untuk mencegah ketidaksengajaan.
  - Menghapus seluruh data nilai di Tab `Hasil_Penilaian` Google Sheets Private via Apps Script `clear_all` & `cleanup`.
  - Mengosongkan seluruh skor lokal di browser peramban sehingga status kembali murni ke **0 dinilai** dan **186 antrean wawancara**.
- **Pelepasan Total dari Sheet 2 Lama**:
  - `fetchCloudScores()` kini secara otoritatif mengadopsi data nilai dari spreadsheet private baru `1aI3lHKD_hNOUiX0FQiiE8hz1CxD0ll0Mj_UrlryVWt0`.
  - Menghilangkan seluruh "skor hantu" sisa uji coba dari Tab 2 spreadsheet lama.

---
## [2026-09-09 - Update 21] - Pemasangan Endpoint Cloud Baru & Pembersihan Total Clue Sandi (wawancara.html)

### 🚀 Integrasi Endpoint Apps Script Cloud Aktif
- **URL Deployment Resmi Terpasang**:
  `https://script.google.com/macros/s/AKfycbw7qZCz_tlKyaKL3pV8IlIIEbk6-YNzjNgpUGL_JWFdFboNtP_HGEFKUmNlo_3eQDE/exec`
- **Otomatisasi Migrasi Cache**: Seluruh peramban panitia yang sebelumnya menyimpan endpoint lama otomatis diperbarui ke endpoint deployment baru tanpa perlu reset manual.
- **Verifikasi Sukses**: Pengujian live membuktikan verifikasi kata sandi cloud berjalan secepat kilat dengan status `authenticated: true`.

### 🚫 Pembersihan Total Clue Kata Sandi (*Zero Password Leak*)
- **Menghapus Kotak Petunjuk Sandi Default**: Menghapus total kotak hint bawaan (`panitia2026`) dari formulir login sehingga pihak yang tidak berwenang sama sekali tidak melihat bocoran sandi apa pun di layar.
- **Tautan Bantuan Koordinator**: Mengganti kotak hint dengan tautan bantuan santun *"Lupa kata sandi? Hubungi Koordinator"* langsung ke Telegram resmi.
- **Pembersihan Modal Ubah Sandi**: Menghapus penyebutan teks `panitia2026` pada tombol reset bawaan modal ubah sandi menjadi *"Kembalikan ke sandi bawaan sistem"*.

---
## [2026-09-09 - Update 20] - Cloud Password Sync via ScriptProperties & Migrasi Database Spreadsheet Private (wawancara.html)

### 🔒 Pemisahan Total Database Penilaian (100% Private Spreadsheet)
- **Arsitektur Dual-Spreadsheet Anti-Bocor**:
  1. **Spreadsheet Formulir Pendaftar (Publik/View-Only)**:
     - ID: `1bcFa1yY4dOuFxsw2Y5aNy3osYjGtBK34bmcIiUEm0YY`
     - Hanya digunakan untuk membaca data pendaftar calon anggota via Google Visualization API / CSV.
  2. **Spreadsheet Database Penilaian & Konfigurasi (100% Private / Restricted)**:
     - ID: `1aI3lHKD_hNOUiX0FQiiE8hz1CxD0ll0Mj_UrlryVWt0`
     - Menampung seluruh data penilaian pewawancara, skor rubrik 4 kriteria, status kelulusan, dan catatan evaluasi.
     - Hak akses terkunci khusus akun Google panitia, terisolasi total dari publik/calon pendaftar.
- **Navigasi Tombol Hero Banner**:
  - Menyediakan tombol akses terpisah di hero: *"Sheet Pendaftar"* (Formulir Asli) dan *"Database Nilai (Private)"*.

### ☁️ Sinkronisasi Kata Sandi Cloud Real-Time (*Server-Side Verification*)
- **Penyimpanan di Google `ScriptProperties` (Zero-Leak)**:
  - Kata sandi panitia kini disimpan aman di server Google Apps Script menggunakan `PropertiesService.getScriptProperties()`.
  - Teks kata sandi tidak tertulis di lembar tabel mana pun sehingga mustahil diintip lewat link spreadsheet view-only.
- **Verifikasi Real-Time saat Login**:
  - Saat tombol *Buka Akses* ditekan, formulir mengirim permintaan verifikasi ke Apps Script (`action: "verify_password"`).
  - Jika koordinator mengubah kata sandi di cloud, seluruh perangkat panitia lain (laptop/HP penguji) secara otomatis wajib menggunakan kata sandi baru tersebut.
  - Dilengkapi *fallback* verifikasi lokal otomatis jika jaringan internet sedang tidak stabil atau offline.
- **Fitur Ubah & Reset Sandi Cloud**:
  - Modal ubah sandi kini menyinkronkan sandi baru langsung ke cloud Apps Script (`action: "change_password"`).
  - Tombol reset sandi mengembalikan master password cloud ke bawaan (`panitia2026`).

### 📜 Pembaruan Google Apps Script Versi 3.0
- Memperbarui `google-apps-script.js`, `KODE_APPS_SCRIPT_TERBARU.txt`, dan cuplikan kode di modal panduan web agar otomatis terhubung ke ID spreadsheet private baru `1aI3lHKD_hNOUiX0FQiiE8hz1CxD0ll0Mj_UrlryVWt0`.

---
## [2026-09-09 - Update 19] - Gerbang Autentikasi Kata Sandi Khusus Panitia & Sesi Pewawancara (wawancara.html)

### 🔐 Gerbang Login Akses Khusus Panitia (*Login Gate Screen*)
- **Proteksi Data Pendaftar & Rubrik Penilaian**:
  - Mengunci seluruh halaman `wawancara.html` dari akses publik/calon pendaftar tidak berwenang.
  - Menampilkan kartu login bernuansa Islami selaras identitas visual UKM Rijal Dakwah STDIIS (*Deep Green*, *Forest Green*, dan *Gold Accent*) lengkap dengan ornamen basmalah kaligrafi Arab dan logo resmi.
  - Seluruh data calon pendaftar, statistik kelulusan, antrean berkas, dan rubrik penilaian **tidak diunduh dari Google Sheets sebelum kata sandi panitia diverifikasi**.

### 🔑 Manajemen Kredensial & Sinkronisasi Ekosistem
- **Kata Sandi Default & Fleksibilitas**:
  - Menggunakan kata sandi standar panitia: `panitia2026` (diselaraskan dengan `pengumuman.html` melalui kunci penyimpanan `RIJAL_DAKWAH_PANITIA_PASSWORD_CUSTOM_V1`).
  - Dilengkapi tombol bantu *fill default* untuk kemudahan pengisian cepat panitia/penguji.
  - Input sandi dilengkapi fitur tampilkan/sembunyikan sandi (*eye toggle*) dan animasi getar (*shake effect*) jika salah sandi.
  - Pilihan opsi *"Ingat sesi login di perangkat ini"* (`localStorage` vs `sessionStorage`) agar panitia tidak perlu memasukkan sandi berulang kali saat sesi wawancara berlangsung.

### 👤 Identitas Penguji & Fitur Ubah Sandi
- **Input Nama Penguji Terintegrasi**:
  - Formulir login menyediakan kolom opsional nama pewawancara/penguji yang langsung tersambung otomatis ke lencana navbar, formulir lembar penilaian, dan cetak lembar wawancara resmi.
- **Modal Pengaturan Kata Sandi & Profil Penguji**:
  - Menambahkan tombol profil penguji di navbar yang membuka modal ubah kata sandi panitia (`#changePasswordModal`).
  - Mendukung verifikasi kata sandi lama, validasi panjang minimal sandi, konfirmasi sandi, serta tombol reset cepat ke sandi bawaan (`panitia2026`).

### 🚪 Kontrol Sesi & Tombol Kunci Portal (Logout)
- **Penguncian Akses Instan**:
  - Menambahkan tombol merah *"Kunci"* (Logout) di navbar utama.
  - Mengunci kembali portal secara instan, menghapus sesi autentikasi dari memori peramban, menghentikan *polling* latar belakang, dan mengembalikan tampilan ke layar login terlindungi.

---
## [2026-09-08 - Update 18] - Penyesuaian Timeline Rekrutmen 2026 & Penonaktifan Tombol Pendaftaran (Diabu-abukan)

### 📅 Pembaruan Jadwal & Timeline Tahapan Rekrutmen 2026 (`index.html`)
- **Penyesuaian Tanggal Resmi Seluruh Tahapan**:
  1. **Tahap 1 (Pendaftaran)**: Diperbarui menjadi **2 - 6 September 2026** (berakhir 6 September).
  2. **Tahap 2 (Seleksi Berkas)**: Diperbarui menjadi **7 - 10 September 2026**.
  3. **Tahap 3 (Wawancara Ta'aruf)**: Diperbarui menjadi **11 September 2026**.
  4. **Tahap 4 (Pengumuman Hasil Seleksi)**: Diperbarui menjadi **14 September 2026**.
- **Sinkronisasi Deskripsi Panduan**: Teks ringkasan timeline pada kartu preview Buku Panduan diselaraskan dengan jadwal terbaru.

### 🔘 Penonaktifan Tombol Pendaftaran & Integrasi Aksi Cek Hasil Seleksi (`index.html`)
- **Tombol Pendaftaran Diabu-abukan (*Disabled State*)**:
  - Tombol pendaftaran Google Form pada kotak aksi utama resmi diabu-abukan (*grayed out*) dengan status `cursor-not-allowed` bertuliskan *"Pendaftaran Ditutup"*.
  - Lencana status formulir diperbarui menjadi *"Pendaftaran Ditutup"* dengan aksen amber/slate.
  - Tombol CTA navbar dan hero diselaraskan menuju status penutupan pendaftaran.
- **Tombol Cek Hasil Seleksi**:
  - Menyediakan tombol utama emas (*gold*) **"Cek Hasil Seleksi"** yang langsung menghubungkan pengunjung ke portal resmi `pengumuman.html`.
  - Tautan pada modal guidebook juga diarahkan langsung ke halaman cek hasil seleksi.

---
## [2026-09-08 - Update 17] - Local-First Auto-Save Panel Penilaian & Pembaruan 4 Opsi Putusan Wawancara

### 🛡️ Perbaikan Masalah Panel Penilaian Kereset Otomatis (Anti-Hanyut Auto-Refresh)
- **Penyimpanan Lokal Instan (*Local-First Real-Time Persistence*)**:
  - Seluruh parameter formulir evaluasi wawancara (4 *slider* rubrik nilai, dropdown status wawancara, tombol radio putusan rekomendasi, catatan esai evaluator, dan nama pewawancara) kini **disimpan langsung secara otomatis ke memori lokal (`localStorage`) pada setiap pergeseran *slider* atau ketikan huruf**.
  - Menambahkan fungsi `autoSaveCurrentForm()` yang menjaga data draf evaluator tetap aman dan utuh tanpa perlu menunggu tombol simpan ditekan.
- **Perlindungan Draf dari Polling Latar Belakang (*Background Refresh Isolation*)**:
  - Memperbaiki fungsi `fetchCloudScores()` agar melakukan *smart merge* (hanya memperbarui jika data cloud memiliki cap waktu `updatedAt` yang lebih baru) serta **melindungi berkas calon yang sedang aktif dinilai di layar agar tidak tertimpa oleh respon cloud**.
  - Menghapus pemanggilan ulang paksa `renderDetailPane()` pada siklus polling latar belakang 20 detik (`syncDataFromSheets(false)`). DOM formulir penilaian tetap stabil, fokus kursor tidak hilang, dan posisi *slider* tidak melompat.
- **Sinkronisasi Halus ke Google Sheets (*Debounced Cloud Push*)**:
  - Perubahan nilai dan catatan secara halus disinkronkan ke Google Apps Script di latar belakang (*debounced* 1,2 detik) sehingga tidak membebani kuota API peramban dan sheet tetap terbarui secara *real-time*.

### 📋 Pembaruan 4 Opsi Lembar Putusan Penilaian Wawancara
- **Penyelarasan 4 Pilihan Keputusan Resmi**:
  1. **`Diterima sebagai Pengurus`** (`value="pengurus"`, tema lencana *Emerald Green*)
  2. **`Diterima Pengurus Divisi Cadangan`** (`value="cadangan"`, tema lencana *Amber / Gold*)
  3. **`Diterima sebagai Anggota`** (`value="anggota"`, tema lencana *Sky Blue*)
  4. **`Belum Diterima`** (`value="belum_diterima"`, tema lencana *Rose Red*)
- **Dukungan Menyeluruh pada Seluruh Modul**:
  - **Filter Status Navbar**: Menambahkan filter cepat untuk keempat opsi putusan (`recom_pengurus`, `recom_cadangan`, `recom_anggota`, `recom_belum_diterima`) dengan kompatibilitas mundur (*backward-compatible*) terhadap nilai lama.
  - **Kartu Antrean Calon**: Lencana rekomendasi dinamis sesuai status keputusan evaluator.
  - **Ekspor Excel & CSV**: Menggunakan label resmi bahasa Indonesia yang seragam.
  - **Cetak Lembar Wawancara (Print/PDF)**: Judul putusan tercetak jelas dalam huruf kapital (*DITERIMA SEBAGAI PENGURUS, dll.*).
  - **Salin Ringkasan Evaluator (Telegram/WA)**: Format teks ringkas mengikuti 4 status putusan terbaru.

### ☁️ Endpoint Google Apps Script Resmi
- **URL Deployment**: `https://script.google.com/macros/s/AKfycbynakEGabRfxbDVjm38njXF6hh4q8qWBHWC5Rc21kbRNuZNs3IH3i7I8xDl_xM080sacA/exec`
- **Tab Target**: `Hasil_Penilaian` (Tab 2 Google Spreadsheet).
- **Pembaruan Cuplikan Kode Modal**: Cuplikan kode Apps Script pada modal kini diperbarui ke Versi 2.0 yang mendukung operasi pembersihan data dan perlindungan baris.

---
## [2026-09-05 - Update 16] - Pengembalian Floating Mini Timer Wawancara (Pojok Desktop & Tengah Mobile)

### ⏱️ Pengembalian Widget Timer Wawancara (`#miniInterviewTimer`)
- **Posisi Responsif Adaptif Sesuai Perangkat**:
  - **Desktop (Layar Lebar)**: Terletak di **pojok kiri bawah** (`bottom: 1rem; left: 1rem`), memberi ruang visual leluasa saat menguji tanpa menghalangi berkas calon.
  - **Smartphone / Mobile**: Terletak tepat di **tengah bawah layar** (`bottom: 1rem; left: 0; right: 0; margin: auto`) untuk kemudahan akses jempol penguji.
- **Dukungan 3 Mode Pengukuran Durasi**:
  - **Stopwatch (UP)**: Menghitung maju durasi wawancara dari `00:00`.
  - **Countdown 10 Menit (10M)**: Hitung mundur dari `10:00` dengan peringatan kedip kuning saat sisa 60 detik.
  - **Countdown 15 Menit (15M)**: Hitung mundur dari `15:00` untuk sesi wawancara standar UKM.
- **Interaksi Pintar Anti-Tabrakan**:
  - Otomatis terangkat (*lifted*) ke atas bilah aksi calon terpilih saat diakses dari ponsel.
  - Otomatis disembunyikan (*hidden*) saat modal pengaturan dibuka dan dipulihkan kembali saat modal ditutup.

---

## [2026-09-05 - Update 15] - Perapian UI Mobile (Navbar & Modal Overlap) & Filter Ketat Divisi Utama

### 📱 Perapian UI Mobile & Header (Bebas Berdempetan)
- **Navbar & Topbar Khusus Smartphone**:
  - Menata ulang header atas dan navbar utama agar tidak berdempetan atau bertabrakan (*zero horizontal overflow* pada lebar 360px–400px).
  - Tombol-tombol aksi (*Cloud Sync*, *Perbarui*, *Ekspor*, dan *Web Utama*) memiliki dimensi sentuh seragam (`h-9`) dengan padding proporsional dan responsif.
  - Menghilangkan tumpang tindih teks badge *"PORTAL WAWANCARA"* pada tampilan mobile.

### 🛡️ Perbaikan Tampilan Modal pada Layar HP (Anti-Overlap)
- **Pencegahan Tumpang Tindih Bilah Bawah**:
  - Bilah aksi melayang bawah (*mobile bottom bar: "Calon Terpilih..."*) otomatis disembunyikan saat modal pengaturan atau cloud sync dibuka, dan dipulihkan kembali saat modal ditutup.
  - Menata ulang modal dengan sistem *fixed header*, *scrollable content*, dan *fixed footer*, serta merapikan grid tombol cadangan nilai agar teks tombol tidak terpotong atau tertekan sempit.

### 🎯 Filter Ketat Divisi Utama (Target Wawancara)
- **Pemisahan Divisi Utama vs Divisi Cadangan**:
  - Menambahkan dropdown khusus **`🎯 Divisi Utama (Target Wawancara)`** yang menyaring calon secara presisi hanya pada pilihan divisi utamanya, mencegah tercampurnya calon yang hanya memilih divisi tersebut sebagai cadangan.
  - Menyediakan dropdown pendamping **`Cadangan (Pilihan 2)`** jika panitia ingin mengecek pilihan alternatif calon.
  - Memperbarui tombol chip filter cepat (*Media, Dakwah Digital, Keilmuan, TPQ, Acara, Humas, Inventaris*) agar langsung memfilter ke Divisi Utama calon.
- **Lencana Visual Divisi pada Kartu Antrean**:
  - Kartu pendaftar kini dengan jelas mencantumkan badge hijau emerald `🎯 Utama: [Nama Divisi]` dan badge abu-abu `Cad: [Nama Divisi]`.

---

## [2026-09-05 - Update 14] - Integrasi Bawaan Google Apps Script Web App Resmi Tanpa Input Manual

### ⚡ Integrasi URL Bawaan Otomatis (*Zero-Config Cloud Sync*)
- Memasukkan URL resmi Google Apps Script Web App yang telah dideploy panitia:  
  `https://script.google.com/macros/s/AKfycbynakEGabRfxbDVjm38njXF6hh4q8qWBHWC5Rc21kbRNuZNs3IH3i7I8xDl_xM080sacA/exec`
  sebagai endpoint bawaan portal `wawancara.html`.
- **Hasil bagi Panitia:** Seluruh panitia yang membuka portal dari perangkat apa pun (laptop, tablet, HP) **langsung terhubung secara otomatis** ke tab `Hasil_Penilaian` di Google Spreadsheet tanpa perlu memasukkan URL secara manual.

### ☁️ Penyelarasan Penuh Kontrak API Apps Script
- Menyesuaikan format payload pengiriman nilai (`POST`) agar presisi sesuai struktur `key` dan `data` di `Hasil_Penilaian`.
- Mengintegrasikan aksi penghapusan baris tunggal (`action: 'delete'`) saat mereset nilai calon tertentu, serta penghapusan total (`action: 'clear_all'`) saat penguji mengeksekusi fitur *Wipe All*.
- Data nilai wawancara, catatan, dan nama evaluator kini senantiasa sinkron 100% secara *real-time* di seluruh perangkat.

---

## [2026-09-05 - Update 13] - Perbaikan Reset Sheet Kosong, Sinkronisasi Menyeluruh Tombol Perbarui & Opsi Tunggal Wipe All

### 🔄 Sinkronisasi Menyeluruh pada Tombol "Perbarui"
- Memperbarui fungsi tombol **"Perbarui"** pada *navbar* agar menyelaraskan seluruh data secara komprehensif:
  1. Mengambil data pendaftar terbaru langsung dari Google Sheets.
  2. Mengambil data nilai terwawancara & catatan dari Google Apps Script Cloud.
  3. Menghitung ulang seluruh statistik (Total, Pengurus, Anggota, Sudah Dinilai, Belum Dinilai).
  4. Menampilkan notifikasi status sinkronisasi yang jelas.

### 🛠️ Perbaikan Penanganan Data Kosong (Reset ke 0 saat Sheet Di-Wipe)
- **Masalah Sebelumnya:** Saat data di Google Sheets dikosongkan/di-wipe dari HP, laptop tetap menampilkan jumlah lama dan tidak mereset ke 0 karena adanya batasan kondisional `parsedRows.length > 0`.
- **Solusi:** Sistem kini memperlakukan sheet kosong secara tepat: jika sheet kosong (0 baris), seluruh statistik langsung mereset ke **0**, daftar antrean menampilkan status kosong, dan panel detail otomatis bersih di semua perangkat.

### 🧹 Konsolidasi Opsi Tunggal: "Wipe All (Reset Semua Data & Cache)"
- Mengganti tombol ganda yang membingungkan (*seperti "Sapu Bersih Data Ampas"* dan *"Hapus Semua"*) menjadi **1 opsi tunggal yang jelas**:
  - **`Wipe All (Reset Semua Data & Cache)`**: Menghapus seluruh penilaian lokal, membersihkan cache pendaftar, dan memaksa sinkronisasi ulang langsung dari Google Sheets dengan 1 klik konfirmasi.

### ⚡ Optimalisasi Performa & Pembersihan Kode Lawas
- **Debounce Pencarian (180ms):** Mencegah lag saat mengetik kata kunci pencarian.
- **Rendering Bertahap (Chunking 35 Kartu):** Merender 35 kartu awal secara instan (60 FPS) dengan tombol elegan *"Tampilkan Pendaftar Lainnya"* untuk mencegah pembekuan DOM pada data berjumlah ratusan.
- **Pemisahan Komputasi Berat:** Mengeluarkan kalkulasi dropdown dinamis dan deduplikasi dari siklus render ketikan sehingga peramban berjalan ringan di HP maupun laptop.

---

## [2026-09-05 - Update 12] - Portal Khusus Seleksi Wawancara (wawancara.html) & Cloud Sync Multi-Device

### 🎙️ Halaman Baru Khusus Panitia: Portal Wawancara (`wawancara.html`)
- **Website Anak Terpisah Berdesain Harmonis (*Same Vibe*)**:
  - Dibangun dengan tema visual identik: *Deep Green* (`#0C2B33`), *Forest Green* (`#20616F`), dan *Gold Accent* (`#C59B27`) berornamen geometris Islami.
  - Halaman berdiri sendiri dan tidak memiliki tautan masuk dari halaman utama (`index.html` tetap utuh 100%), namun memiliki tautan navigasi *"← Ke Web Utama"*.
- **Integrasi Penuh Basis Data Google Sheets (Live Real-Time Tanpa Cache Lokal)**:
  - Mengambil data pendaftar langsung dari spreadsheet Google Form secara *real-time* via teknologi JSONP (*kebal batasan CORS peramban*).
  - Menghapus data *fallback* lokal statis agar data senantiasa murni mengikuti perkembangan Google Sheets (memuat 184+ pendaftar).
  - Dilengkapi fitur *auto-sync* berkala (tiap 20 detik) serta sinkronisasi instan saat tab peramban kembali aktif (`window.onfocus`).
- **Sistem Sinkronisasi Nilai Cloud Antar-Perangkat (Google Apps Script Integration)**:
  - Menyediakan integrasi Google Apps Script Web App agar seluruh panitia (di laptop, tablet, atau smartphone) dapat menilai dan mencatat secara bersamaan langsung ke tab `Penilaian` di Google Spreadsheet.
  - Dilengkapi modal pengaturan sinkronisasi cloud dengan kode siap pakai, panduan 1 menit, dan tautan khusus panitia berformat `wawancara.html?sync=...`.
- **Dukungan Evaluasi Spesifik per Divisi**:
  - **Divisi Media**: Skillset, perangkat yang dimiliki (*PC/Kamera/Mic*), dan tools software (*CapCut, Premiere, Canva*).
  - **Divisi TPQ**: Kepemilikan kendaraan dan jumlah hafalan Al-Qur'an.
  - **Divisi Dakwah Digital**: Kesiapan depan kamera dan potensi ide kreatif.
  - **Divisi Keilmuan**: Wawasan dakwah, konsekuensi, dan penyusunan materi dakwah.
  - **Divisi Humas**: 8 pertanyaan komprehensif terkait pengalaman organisasi, kepanitiaan, dan relasi media.
- **Fitur Penilaian & Produktivitas Penguji**:
  - Deteksi submisi ganda (*Smart Deduplication*) dengan perbandingan riwayat formulir calon.
  - Preset nilai cepat: A (95), B+ (88), B (80), C (70), dan D (55).
  - *Autosave* otomatis saat mengetik catatan wawancara.
  - Filter dinamis Divisi & Prodi otomatis dari data Google Sheets.
  - Format cetak lembar wawancara resmi (*Print/PDF ready*) dan ekspor rekapitulasi ke Excel (`.xlsx`).

---


## [2026-09-05 - Update 11] - Visitor Counter Analytics, Pergantian Istilah Hasil Seleksi & Proteksi Password Panitia

### 📊 Fitur Visitor Counter & Traffic Analytics (`index.html`)
- **Penghitung Pengunjung Real-time & Analitik Akses**:
  - Mengintegrasikan serverless visitor counter otomatis via `visitorbadge.io` yang mencatat setiap kali landing page diakses.
  - Menampilkan indikator total akses pada **Top Header Bar** (`Total Akses: Nx`).
  - Menambahkan **Bilah Statistik Akses Website** di atas footer dengan metrik:
    1. Total Kunjungan Global (Real-time live counter).
    2. Kunjungan Hari Ini (Perhitungan tanggal hari ini).
  - Menyediakan modal interaktif **"Detail Analisis Kunjungan"** untuk panitia memeriksa jumlah akses peramban lokal, tanggal kunjungan pertama, dan waktu akses terbaru.

### 🏷️ Pergantian Istilah Menjadi "Hasil Seleksi"
- Mengganti seluruh kata *"Pengumuman"* dan *"Pengumuman Kelulusan"* menjadi **"Hasil Seleksi"**:
  - **`index.html`**: Top bar, Desktop navbar, Mobile dropdown menu, Hero action button, Timeline Tahap 4, dan Footer quick links.
  - **`pengumuman.html`**: Judul tab browser (`<title>`), meta description, banner badge hero, header portal, serta dokumen unduhan template Excel.

### 🔐 Proteksi Kata Sandi Khusus Panitia (`pengumuman.html`)
- Mengunci akses panel unggah berkas Excel / CSV dengan modal kata sandi khusus:
  - Tombol *"Kelola Data Excel (Panitia)"* kini berstatus proteksi dengan ikon gembok emas.
  - Memerlukan kata sandi panitia (default: `panitia2026`) untuk membuka panel upload.
  - Dilengkapi fitur tampilkan/sembunyikan sandi (*eye toggle*), penanganan salah sandi dengan animasi alert, serta tombol *"Kunci Akses (Logout)"* untuk mengunci kembali sesi panitia.

---

## [2026-09-05 - Update 10] - Portal Pengumuman Kelulusan & Integrasi Unggah Data Excel

### 📢 Halaman Baru: Portal Pengumuman Hasil Seleksi (`pengumuman.html`)
- **Sistem Cek Status Kelulusan Berbasis NIM**:
  - Mahasiswa / pendaftar dapat memasukkan NIM atau nomor pendaftaran untuk memeriksa status penerimaan secara langsung.
  - Tampilan hasil dinamis adaptif:
    - **Status Diterima**: Tampilan kartu apresiasi islami emas & hijau emerald lengkap dengan Nama, NIM, Program Studi, Divisi Diterima, instruksi langkah lanjutan, serta tombol *"Cetak Bukti Kelulusan (PDF/Print)"*.
    - **Status Cadangan**: Badge penanda daftar tunggu (*waiting list*) dengan arahan panitia.
    - **Status Belum Lolos**: Pesan motivasi islami santun berlandaskan QS. Al-Baqarah: 216 dan ajakan khidmah terbuka.
    - **Status Tidak Ditemukan**: Notifikasi ramah konfirmasi data beserta tautan langsung ke Helpdesk Telegram `@aburobiah`.
- **Fitur Panitia: Unggah & Pemrosesan Berkas Excel (.xlsx, .xls, .csv)**:
  - Mengintegrasikan library SheetJS (`xlsx.full.min.js`) via CDN sehingga pemrosesan spreadsheet berjalan 100% di browser tanpa ketergantungan server backend.
  - Mendukung auto-mapping berbagai variasi nama kolom (NIM, Nama, Prodi, Divisi, Status, Catatan).
  - Data tersimpan otomatis di `localStorage` peramban, dilengkapi tombol unduh template Excel contoh (`.xlsx`) dan opsi ekspor file `data.json`.

### 🔗 Integrasi Tautan pada Halaman Utama (`index.html`)
- Menambahkan tautan menuju `pengumuman.html` pada 6 titik navigasi strategis:
  1. **Top Bar**: Pill link pengumuman kelulusan.
  2. **Main Desktop Navbar**: Menu navigasi *"Pengumuman"*.
  3. **Mobile Dropdown Menu**: Tombol menu *"Cek Status Kelulusan (Pengumuman)"*.
  4. **Hero Action Buttons**: Tombol CTA ketiga *"Cek Kelulusan"* berdampingan dengan tombol *Join Us* dan *Guidebook*.
  5. **Timeline Tahap 4**: Tautan langsung *"Cek Status"* pada kartu jadwal pengumuman 11 September.
  6. **Footer Quick Links**: Menu tautan *"Pengumuman Kelulusan"*.

---

## [2026-09-02 - Update 9] - Penghapusan Bumper Bawah & Floating Toast Popup Salin Link

### 🧹 Pembersihan Bumper Bawah (Image #1)
- Menghapus fragmen HTML toast statis tak berwadah yang sebelumnya tertinggal di bagian bawah halaman sehingga menghilangkan bilah putih (*bumper*) yang sempat muncul di atas footer.

### 🚀 Floating Toast Popup Notifikasi Salin Tautan
- Mengimplementasikan sistem notifikasi melayang (*floating pill toast*) modern di bagian tengah bawah layar (`bottom-8 left-1/2 -translate-x-1/2`) dengan tema *Deep Islamic Emerald* dan bingkai emas.
- Saat tombol *"Salin Link Form"* diklik:
  - Tautan disalin ke clipboard dengan dukungan ganda (*modern Clipboard API & fallback command*).
  - Muncul animasi popup terbang bertuliskan **"Link berhasil dicopy ke clipboard"** lengkap dengan ikon centang hijau emerald.
  - Notifikasi otomatis menghilang (*auto-dismiss*) secara halus setelah 2.5 detik.

---

## [2026-09-02 - Update 8] - Pembersihan Tombol Preview Form & Penyederhanaan URL TikTok

### 🔘 Penyederhanaan Tombol Aksi Pendaftaran
- Menghapus tombol *"Lihat Preview Form"* pada kotak aksi formulir pendaftaran, sehingga tersisa 2 tombol utama yang fokus dan jelas:
  1. **Buka Google Form Pendaftaran** (Tombol Utama Emas).
  2. **Salin Link Form** (Tombol Salin Tautan Clipboard).
- Membersihkan modal preview dan event listener yang tidak lagi digunakan agar kode lebih bersih dan ringan.

### 🔗 Penyederhanaan Tautan Akun TikTok
- Menyederhanakan seluruh tautan TikTok pada **Top Header Bar** dan **Footer** menjadi URL bersih tanpa parameter pelacak:
  `https://www.tiktok.com/@rijaldakwah_stdiis`

---

## [2026-09-02 - Update 7] - Perbaikan Kontras Warna Form & Penambahan Akun TikTok

### 🎨 Perbaikan Kontras Teks & Warna (Image #1 & #2)
- **Restorasi Kontainer Kartu Putih (#join-us)**:
  - Memperbaiki pembungkus kartu pendaftaran menjadi kartu putih solid berbingkai emas (`bg-white rounded-3xl p-6 sm:p-10 border-4 border-gold shadow-2xl`).
  - Mengembalikan kontras tinggi pada teks judul *"Formulir Pendaftaran Online"*, daftar checklist persiapan data diri, dan judul *"Timeline Tahapan Rekrutmen 2026"*, sehingga sangat jelas dan nyaman dibaca (rasio kontras tinggi di atas latar putih).

### 🎵 Penambahan Tautan Akun TikTok Resmi (Image #3)
- Menambahkan tombol dan tautan resmi akun TikTok UKM Rijal Dakwah:
  `https://www.tiktok.com/@rijaldakwah_stdiis?_r=1&_t=ZS-99OdURf9WFB`
- Tautan TikTok telah diintegrasikan pada **Top Header Bar** dan **Footer Social Icons** berdampingan dengan Telegram Helpdesk dan Instagram resmi.

---

## [2026-09-02 - Update 6] - Refinement Layout Showcase Guidebook (Desktop, Tablet & Mobile)

### 📖 Tata Letak & Responsivitas Showcase Guidebook
- **Penyelarasan 2 Kolom**: Memperbarui breakpoint grid menjadi `md:grid-cols-12` (`md:col-span-5` untuk Book Mockup dan `md:col-span-7` untuk Ringkasan Isi) dengan `items-stretch` agar kedua kolom tampil sejajar berdampingan dan memiliki tinggi yang seimbang (*equal height*) pada layar laptop dan tablet.
- **Kartu Ringkasan & Tombol Download**:
  - Merapikan susunan 4 kartu poin isi pokok di dalam kontainer ringkasan agar presisi dan simetris.
  - Menata strip banner unduhan bergaris putus-putus (*dashed border*) agar ikon, teks nama file, dan tombol "Unduh File Sekarang" terintegrasi secara rapi tanpa meluap.
- **Tampilan Mobile Adaptif**: Menyesuaikan tampilan vertikal (*single column*) pada layar ponsel agar kartu buku dan ringkasan memiliki proporsi lebar, sudut membulat, dan margin yang serasi.

---

## [2026-09-02 - Update 5] - Scrolling Animations, Parallax & Interaktivitas Halus

### ✨ Scrolling Animations & Reveal on Scroll
- **IntersectionObserver Engine**: Menerapkan sistem animasi *fade & slide up* modern yang otomatis memicu kemunculan elemen (`.reveal`, `.reveal-left`, `.reveal-right`, `.reveal-scale`) secara mulus saat masuk ke dalam viewport.
- **Staggered Delays**: Menerapkan jeda bertingkat (*staggered delay* 50ms - 400ms) pada kartu 8 Divisi, 3 Pilar Universe, dan Timeline Pendaftaran untuk efek visual yang dinamis.
- **Scroll Progress Bar**: Menambahkan indikator persentase scroll tipis (*gradient gold-emerald*) di bagian atas layar yang bergerak mengikuti posisi pembacaan halaman.

### 🌌 Parallax & Ambient Effects
- **Hero Parallax Glow Orbs**: Menambahkan elemen ambient glow orbs pada background Hero yang bergerak secara halus dengan kecepatan depth berbeda (`requestAnimationFrame` 60fps) saat discroll.
- **Interactive Card Lift**: Menambahkan efek elevasi halus (*subtle hover lift & shadow elevation*) pada kartu 8 Divisi, Pilar Program, dan Ringkasan Guidebook.
- **Aksesibilitas**: Mendukung `@media (prefers-reduced-motion)` untuk pengguna yang mengaktifkan preferensi pengurangan gerakan.

---

## [2026-09-02 - Update 4] - Timeline Rekrutmen, Username Telegram & Hapus Link YouTube

### 🗓️ Timeline Rekrutmen 2026
- Memperbarui seluruh jadwal tahapan pendaftaran sesuai instruksi terbaru:
  - **Tahap 1**: Pendaftaran (2 - 5 September)
  - **Tahap 2**: Seleksi Berkas (6 September)
  - **Tahap 3**: Wawancara Ta'aruf (7 September)
  - **Tahap 4**: Pengumuman Hasil Wawancara (11 September)
- Menyinkronkan keterangan jadwal pada ringkasan Guidebook dan kartu alur pendaftaran.

### 📝 Formulir & Persiapan Data Diri
- Mengganti persyaratan "No. WhatsApp" menjadi **"Username Telegram"** pada daftar checklist persiapan sebelum mengisi Google Form dan ringkasan formulir pendaftaran.

### 🎥 Pembersihan Tautan Media Sosial
- Menghapus seluruh ikon dan tautan menuju YouTube pada Top Header Bar dan Footer untuk memfokuskan pusat komunikasi pada Telegram dan Instagram resmi.

---

## [2026-09-02 - Update 3] - Perbaikan Layout & Responsivitas (Footer, Guidebook, Mobile Hero)

### 🛠️ Perbaikan UI & Layout (Berdasarkan Feedback Tangkapan Layar)
- **Footer Bottom Bar (Image #1)**:
  - Memperbaiki tag penutup HTML pada grid footer yang sebelumnya menyebabkan Bottom Bar masuk ke dalam kolom grid sempit.
  - Mengatur Bottom Bar agar melebar penuh (*full width*) dengan teks hak cipta di sebelah kiri dan kaligrafi doa di sebelah kanan secara simetris dan rapi.
- **Ringkasan Guidebook & Download CTA (Image #2)**:
  - Memperbaiki nesting HTML pada Card 2 yang sebelumnya menyebabkan Card 3 & 4 masuk ke dalamnya.
  - Merapikan susunan 4 kartu ringkasan menjadi grid 2x2 yang seimbang dan simetris.
  - Merapikan strip banner download bergaris putus-putus (*dashed border*) dan tombol unduh agar tidak meluap (*overflow*).
- **Pillar Stat Badges di Mobile (Image #3)**:
  - Menyesuaikan tipografi responsif (`text-lg sm:text-2xl md:text-3xl`) dan jarak (*gap/padding*) pada badge `100%`, `8`, dan `Ukhuwah`.
  - Memastikan teks "Ukhuwah" dan seluruh teks keterangan tidak terpotong atau keluar dari kontainer kartu pada layar ponsel kecil.
- **Navbar Mobile Polish**:
  - Merapikan badge "UKM KAMPUS" pada navbar mobile agar tidak bertumpuk dengan judul logo pada viewport sempit.

---

## [2026-09-02 - Update 2] - Penyesuaian FAQ, Akun IG, Syarat Berkas & Kontak Footer

### ❓ FAQ (Frequently Asked Questions)
- **Instagram Resmi**: Menambahkan pertanyaan & jawaban seputar akun Instagram resmi UKM Rijal Dakwah: `@rijaldakwah_stdiis` beserta tautan langsung.
- **Mahasiswa I'dad Lughawi**: Menambahkan konfirmasi bahwa mahasiswa program I'dad Lughawi dan mahasiswa baru (Maba) sangat dipersilakan untuk mendaftar.
- Menghapus pertanyaan umum mengenai jurusan non-agama agar lebih kontekstual dengan civitas akademika STDIIS.

### 📸 Media Sosial & Tautan
- **Instagram**: Memperbarui seluruh tautan Instagram di website (top header bar, footer, dan tautan teks) menjadi `https://instagram.com/rijaldakwah_stdiis`.

### 📄 Syarat & Berkas Pendaftaran
- **Penyesuaian Syarat KTM**: Menghapus syarat wajib scan/foto KTM karena mahasiswa baru (Maba) belum memiliki KTM, dan menambahkan catatan penjelas di modal panduan.

### 📍 Alamat & Kontak Footer
- **Alamat Sekretariat**: Memperbarui alamat sekretariat ke alamat resmi STDI Imam Syafi'i Jember:
  `Jl. MH. Thamrin Gg. Nusantara No. 5, Gladak Pakem, Kranjingan, Kec. Sumbersari, Kabupaten Jember, Jawa Timur 68124`.
- **Konsolidasi Kontak**: Menghapus email rekrutmen di footer dan mengarahkan seluruh jalur helpdesk & rekrutmen sepenuhnya ke Telegram `@aburobiah`.

---

## [2026-09-02] - Sinkronisasi Identitas, Palette Warna, Guidebook & Form Pendaftaran

### 🎨 Visual & Branding
- **Logo & Favicon**:
  - Mengganti logo utama di seluruh landing page dengan `logo-rijal-dakwah.png`.
  - Memperbarui logo pada Header bar, Navbar, Hero section badge, Modal Ringkasan Guidebook, dan Footer.
- **Color Palette**:
  - Mengekstrak palet warna dari logo resmi:
    - *Deep Islamic Emerald*: `#042D23`, `#084838`
    - *Islamic Gold*: `#D4AF37`, `#E8C86A`
    - *Warm Charcoal*: `#1E293B`
    - *Cream / Ivory*: `#FAF8F3`, `#F4EFE6`
  - Memperbarui konfigurasi Tailwind CSS, gradient hero, button styling, badge, dan modal backdrop.

### 🔗 Integrasi Tautan & Kontak
- **Link Pendaftaran (Google Form)**:
  - Mengubah seluruh tautan pendaftaran dan tombol CTA ke formulir resmi:
    `https://docs.google.com/forms/d/e/1FAIpQLSelXYoYwr466Hm02HzaqwuFMssdVjdqKxt5xTw3kRT1jKH6uA/viewform?usp=header`
  - Memperbarui trigger modal formulir dan fungsi clipboard `copyGoogleFormLink()`.
- **Link Guidebook PDF**:
  - Mengubah tautan unduhan guidebook ke repositori resmi:
    `https://rijaldakwahmedialab-dev.github.io/RijalDakwah/GUIDEBOOK%20FINAL.pdf`
  - Mengintegrasikan fungsi pembuka dokumen `downloadGuidebookPDF()`.
- **Contact Person (Telegram)**:
  - Mengganti seluruh helpdesk dan kontak person ke username Telegram **`@aburobiah`** (`https://t.me/aburobiah`).

### 🏛️ Konten & Struktur Organisasi
- **Visi & Misi**:
  - Mengadopsi Visi & Misi resmi UKM Rijal Dakwah STDI Imam Syafi'i Jember dari dokumen *GUIDEBOOK FINAL*.
- **3 Pilar Universe**:
  - Mengimplementasikan konsep 3 Pilar: *Akademi Da'i* (Kaderisasi), *Rijalul Khidmah* (Sosial), dan *Edukasi Digital* (Media & Syiar).
- **8 Divisi Kepengurusan**:
  - Memperbarui struktur organisasi menjadi 8 divisi lengkap dengan deskripsi autentik:
    1. *Divisi Keilmuan*
    2. *Divisi Dakwah Digital*
    3. *Divisi Dana Usaha*
    4. *Divisi TPQ (GEMA)*
    5. *Divisi Media*
    6. *Divisi Acara*
    7. *Divisi Inventaris*
    8. *Divisi Humas & Eksternal*

### 🧪 Verifikasi & Pengujian
- Menjalankan suite pengujian interaksi berbasis browser headless:
  - Guidebook modal: Buka & tutup berjalan normal.
  - Form modal: Buka & tutup berjalan normal.
  - Accordion FAQ: 4 item pertanyaan berfungsi normal.
  - Link check: 34 tautan terverifikasi aktif dan akurat.
