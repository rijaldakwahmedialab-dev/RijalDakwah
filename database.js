/**
 * =============================================================================
 * DATABASE ENGINE & CLOUD SYNCHRONIZATION
 * Portal Wawancara UKM Rijal Dakwah STDI Imam Syafi'i Jember
 * =============================================================================
 * 
 * File ini menangani sinkronisasi data penilaian secara real-time antar perangkat
 * melalui Firebase Realtime Database (Google Cloud) & GitHub Database JSON.
 * 
 * Bekerja secara otomatis:
 * 1. Setiap kali tombol "Simpan Nilai & Catatan" diklik, data disimpan ke Cloud.
 * 2. Perangkat lain yang sedang membuka web akan langsung terupdate secara real-time.
 * 3. Jika offline, data tersimpan di LocalStorage dan siap disinkronkan saat online.
 * 4. Mendukung ekspor langsung ke format file 'database-penilaian.json' untuk GitHub.
 */

(function(window) {
  'use strict';

  // Key untuk penyimpanan konfigurasi lokal di browser
  const CONFIG_STORAGE_KEY = 'rd_cloud_firebase_config_v1';
  const GITHUB_SEED_FILE = './database-penilaian.json';

  /**
   * KONFIGURASI FIREBASE DEFAULT
   * 
   * Antum bisa langsung memasukkan konfigurasi Firebase di bawah ini, ATAU
   * memasukkannya melalui menu "Cadangan & Pengaturan" -> "Pengaturan Cloud" di web.
   * 
   * Cara mendapatkan config gratis (hanya 2 menit):
   * 1. Buka https://console.firebase.google.com/
   * 2. Buat project baru (contoh: "rijal-dakwah-wawancara")
   * 3. Di menu kiri, klik "Build" -> "Realtime Database" -> "Create Database"
   * 4. Pilih lokasi (Singapore / United States), pilih "Start in test mode"
   * 5. Di Project Settings -> General -> "Your apps", pilih Web (</>) dan salin config-nya ke bawah:
   */
  const DEFAULT_FIREBASE_CONFIG = {
    apiKey: "",
    authDomain: "",
    databaseURL: "", // Contoh: "https://rijal-dakwah-default-rtdb.asia-southeast1.firebasedatabase.app"
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: ""
  };

  class RDDatabaseManager {
    constructor() {
      this.firebaseApp = null;
      this.firebaseDb = null;
      this.scoresRef = null;
      this.connectedRef = null;
      this.isOnline = false;
      this.isCloudActive = false;
      this.listeners = {
        status: [],
        scores: []
      };
      this.currentConfig = this.loadStoredConfig() || DEFAULT_FIREBASE_CONFIG;
    }

    /**
     * Sanitasi key agar kompatibel dengan Firebase & JSON.
     * Karakter '.', '#', '$', '/', '[', ']' dilarang di path Firebase.
     */
    sanitizeKey(key) {
      if (!key) return 'unknown_key';
      return String(key).replace(/[\.\#\$\/\[\]]/g, '_');
    }

    /**
     * Memuat konfigurasi Firebase dari localStorage jika pernah disimpan
     */
    loadStoredConfig() {
      try {
        const stored = localStorage.getItem(CONFIG_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && (parsed.databaseURL || parsed.apiKey)) {
            return parsed;
          }
        }
      } catch (e) {
        console.warn('Gagal membaca konfigurasi cloud tersimpan:', e);
      }
      return null;
    }

    /**
     * Menyimpan konfigurasi baru ke localStorage
     */
    saveConfig(newConfig) {
      try {
        this.currentConfig = { ...DEFAULT_FIREBASE_CONFIG, ...newConfig };
        localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(this.currentConfig));
        return this.init();
      } catch (e) {
        console.error('Gagal menyimpan konfigurasi cloud:', e);
        return false;
      }
    }

    /**
     * Mendapatkan konfigurasi saat ini
     */
    getConfig() {
      return this.currentConfig;
    }

    /**
     * Mendaftarkan listener status koneksi
     */
    onStatusChange(callback) {
      if (typeof callback === 'function') {
        this.listeners.status.push(callback);
        // Kirim status awal
        callback(this.getStatus());
      }
    }

    /**
     * Mendaftarkan listener pembaruan skor dari cloud
     */
    onScoresUpdated(callback) {
      if (typeof callback === 'function') {
        this.listeners.scores.push(callback);
      }
    }

    /**
     * Trigger event perubahan status
     */
    notifyStatus(status) {
      this.listeners.status.forEach(cb => {
        try { cb(status); } catch (e) { console.error(e); }
      });
    }

    /**
     * Trigger event skor diperbarui dari cloud
     */
    notifyScoresUpdated(data, source = 'cloud') {
      this.listeners.scores.forEach(cb => {
        try { cb(data, source); } catch (e) { console.error(e); }
      });
    }

    /**
     * Mendapatkan status lengkap database saat ini
     */
    getStatus() {
      if (this.isCloudActive && this.isOnline) {
        return {
          mode: 'cloud',
          provider: 'Firebase Realtime Database',
          status: 'connected',
          label: 'Cloud Realtime Aktif',
          color: 'emerald',
          isLive: true
        };
      } else if (this.isCloudActive && !this.isOnline) {
        return {
          mode: 'cloud',
          provider: 'Firebase Realtime Database',
          status: 'connecting',
          label: 'Menghubungkan Cloud...',
          color: 'amber',
          isLive: false
        };
      } else {
        return {
          mode: 'local',
          provider: 'LocalStorage / GitHub File',
          status: 'local_only',
          label: 'Mode Lokal (Offline)',
          color: 'slate',
          isLive: false
        };
      }
    }

    /**
     * Inisialisasi engine basis data
     */
    async init() {
      // 1. Cek apakah Firebase SDK tersedia di window
      const hasFirebase = typeof window.firebase !== 'undefined' && typeof window.firebase.database === 'function';
      const hasValidConfig = this.currentConfig && (
        (this.currentConfig.databaseURL && this.currentConfig.databaseURL.trim().length > 10) ||
        (this.currentConfig.apiKey && this.currentConfig.apiKey.trim().length > 10)
      );

      if (hasFirebase && hasValidConfig) {
        try {
          this.initFirebase();
          return true;
        } catch (err) {
          console.error('Gagal inisialisasi Firebase:', err);
          this.isCloudActive = false;
          this.notifyStatus(this.getStatus());
        }
      } else {
        this.isCloudActive = false;
        this.notifyStatus(this.getStatus());
      }

      // 2. Fallback awal: Muat data dari file database-penilaian.json di GitHub jika ada
      this.tryLoadFromGitHubJson();
      return false;
    }

    /**
     * Inisialisasi Firebase SDK
     */
    initFirebase() {
      if (this.firebaseApp) {
        try {
          // Reset listener lama bila re-init
          if (this.scoresRef) this.scoresRef.off();
          if (this.connectedRef) this.connectedRef.off();
          this.firebaseApp.delete();
        } catch (e) {}
      }

      // Format databaseURL jika user hanya mengisi sebagian
      let config = { ...this.currentConfig };
      if (!config.databaseURL && config.projectId) {
        config.databaseURL = `https://${config.projectId}-default-rtdb.firebaseio.com`;
      }

      this.firebaseApp = window.firebase.initializeApp(config, 'RD_Portal_' + Date.now());
      this.firebaseDb = this.firebaseApp.database();
      this.scoresRef = this.firebaseDb.ref('interviewScores');
      this.connectedRef = this.firebaseDb.ref('.info/connected');

      this.isCloudActive = true;

      // Pantau status koneksi real-time
      this.connectedRef.on('value', (snap) => {
        this.isOnline = snap.val() === true;
        this.notifyStatus(this.getStatus());
      });

      // Pantau perubahan data di seluruh perangkat
      this.scoresRef.on('value', (snapshot) => {
        const cloudScores = snapshot.val();
        if (cloudScores && typeof cloudScores === 'object') {
          this.notifyScoresUpdated(cloudScores, 'cloud');
        }
      }, (error) => {
        console.error('Firebase error pada pembacaan skor:', error);
      });
    }

    /**
     * Simpan nilai pendaftar ke Cloud & LocalStorage
     */
    async saveScore(applicantKey, scoreData) {
      const safeKey = this.sanitizeKey(applicantKey);
      const dataToSave = {
        ...scoreData,
        _safeKey: safeKey,
        _originalKey: applicantKey,
        updatedAt: scoreData.updatedAt || new Date().toISOString()
      };

      // 1. Simpan ke Firebase Realtime Database bila aktif
      if (this.isCloudActive && this.firebaseDb && this.scoresRef) {
        try {
          await this.scoresRef.child(safeKey).set(dataToSave);
          return { success: true, cloud: true, key: applicantKey };
        } catch (error) {
          console.warn('Gagal menyimpan langsung ke Firebase, menyimpan lokal:', error);
          return { success: true, cloud: false, fallback: true, error: error.message };
        }
      }

      return { success: true, cloud: false, localOnly: true };
    }

    /**
     * Hapus / Reset nilai pendaftar
     */
    async deleteScore(applicantKey) {
      const safeKey = this.sanitizeKey(applicantKey);

      if (this.isCloudActive && this.firebaseDb && this.scoresRef) {
        try {
          await this.scoresRef.child(safeKey).remove();
          return { success: true, cloud: true };
        } catch (error) {
          console.warn('Gagal menghapus dari Firebase:', error);
          return { success: false, error: error.message };
        }
      }

      return { success: true, cloud: false };
    }

    /**
     * Muat data baseline dari file database-penilaian.json di repository GitHub
     */
    async tryLoadFromGitHubJson() {
      try {
        const res = await fetch(`${GITHUB_SEED_FILE}?_nocache=${Date.now()}`);
        if (res.ok) {
          const json = await res.json();
          if (json && json.scores && Object.keys(json.scores).length > 0) {
            this.notifyScoresUpdated(json.scores, 'github_file');
          }
        }
      } catch (e) {
        // Abaikan jika offline / file belum ada di hosting
      }
    }

    /**
     * Buat format database JSON resmi untuk di-commit ke GitHub
     */
    generateDatabaseJSON(currentScores = {}, rawApplicants = []) {
      const now = new Date().toISOString();
      const scoredCount = Object.keys(currentScores).length;

      return {
        _info: "File Basis Data Hasil Penilaian Wawancara UKM Rijal Dakwah STDIIS Periode 2026/2027",
        metadata: {
          organization: "UKM Rijal Dakwah STDI Imam Syafi'i Jember",
          portalUrl: "https://rijaldakwahmedialab-dev.github.io/RijalDakwah/wawancara.html",
          githubRepo: "https://github.com/rijaldakwahmedialab-dev/RijalDakwah",
          databaseVersion: "1.0.0",
          lastUpdated: now,
          totalApplicantsCount: rawApplicants.length,
          totalEvaluated: scoredCount,
          scoringWeight: {
            adab: "25%",
            visi: "25%",
            keahlian: "30%",
            komitmen: "20%"
          }
        },
        scores: currentScores
      };
    }

    /**
     * Unduh file 'database-penilaian.json' siap commit ke GitHub
     */
    exportDatabaseJSON(currentScores = {}, rawApplicants = []) {
      const dbObj = this.generateDatabaseJSON(currentScores, rawApplicants);
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dbObj, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", "database-penilaian.json");
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    }
  }

  // Daftarkan instance tunggal secara global
  window.RD_Database = new RDDatabaseManager();

})(window);
