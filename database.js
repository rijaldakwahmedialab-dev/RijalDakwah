/**
 * =============================================================================
 * DATABASE ENGINE & CLOUD SYNCHRONIZATION
 * Portal Wawancara UKM Rijal Dakwah STDI Imam Syafi'i Jember
 * =============================================================================
 * 
 * File ini menangani sinkronisasi data penilaian secara otomatis antar perangkat
 * melalui dua opsi cloud (pilih salah satu atau keduanya):
 * 
 * OPSI 1: Firebase Realtime Database (Sangat direkomendasikan - Realtime <300ms)
 * OPSI 2: Google Apps Script Web App (Tersimpan langsung ke tab Google Sheet panitia)
 */

(function(window) {
  'use strict';

  const CONFIG_STORAGE_KEY = 'rd_cloud_firebase_config_v1';
  const GITHUB_SEED_FILE = './database-penilaian.json';

  /**
   * ===========================================================================
   * KONFIGURASI BASIS DATA CLOUD (PILIH SALAH SATU)
   * ===========================================================================
   * 
   * [PILIHAN 1 - PALING CEPAT]: Firebase Realtime Database (Google Cloud)
   * 1. Buat project gratis di https://console.firebase.google.com/
   * 2. Buka "Build" -> "Realtime Database" -> "Create Database" (Start in test mode)
   * 3. Salin URL database dan tempel pada 'databaseURL' di bawah:
   * 
   * [PILIHAN 2 - LANGSUNG KE GOOGLE SHEET]: Google Apps Script
   * 1. Buka Google Sheet Formulir Rijal Dakwah -> Ekstensi -> Apps Script
   * 2. Salin kode dari file 'google-apps-script.js' -> Terapkan sebagai Aplikasi Web
   * 3. Salin URL Web App dan tempel pada 'appsScriptUrl' di bawah:
   */
  const DEFAULT_CONFIG = {
    // Pilihan 1: Firebase Realtime Database URL
    databaseURL: "", // Contoh: "https://rijal-dakwah-wawancara-default-rtdb.asia-southeast1.firebasedatabase.app"
    
    // Pilihan 2: Google Apps Script Web App URL
    appsScriptUrl: "https://script.google.com/macros/s/AKfycbw7qZCz_tlKyaKL3pV8IlIIEbk6-YNzjNgpUGL_JWFdFboNtP_HGEFKUmNlo_3eQDE/exec",

    apiKey: "",
    authDomain: "",
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
      this.activeProvider = 'none'; // 'firebase' | 'apps_script' | 'none'
      this.pollTimer = null;
      this.deletedKeys = new Set();
      this.clearedAll = false;
      this.listeners = {
        status: [],
        scores: []
      };
      this.currentConfig = this.loadStoredConfig() || DEFAULT_CONFIG;
    }

    sanitizeKey(key) {
      if (!key) return 'unknown_key';
      return String(key).replace(/[\.\#\$\/\[\]]/g, '_');
    }

    loadStoredConfig() {
      try {
        const stored = localStorage.getItem(CONFIG_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && (parsed.databaseURL || parsed.appsScriptUrl || parsed.apiKey)) {
            return { ...DEFAULT_CONFIG, ...parsed };
          }
        }
      } catch (e) {
        console.warn('Gagal membaca konfigurasi cloud tersimpan:', e);
      }
      return null;
    }

    saveConfig(newConfig) {
      try {
        this.currentConfig = { ...DEFAULT_CONFIG, ...this.currentConfig, ...newConfig };
        localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(this.currentConfig));
        return this.init();
      } catch (e) {
        console.error('Gagal menyimpan konfigurasi cloud:', e);
        return false;
      }
    }

    getConfig() {
      return this.currentConfig;
    }

    onStatusChange(callback) {
      if (typeof callback === 'function') {
        this.listeners.status.push(callback);
        callback(this.getStatus());
      }
    }

    onScoresUpdated(callback) {
      if (typeof callback === 'function') {
        this.listeners.scores.push(callback);
      }
    }

    notifyStatus(status) {
      this.listeners.status.forEach(cb => {
        try { cb(status); } catch (e) { console.error(e); }
      });
    }

    notifyScoresUpdated(data, source = 'cloud') {
      if (this.clearedAll) return;
      const filteredData = {};
      for (const k in data) {
        const safeK = this.sanitizeKey(k);
        if (this.deletedKeys.has(k) || this.deletedKeys.has(safeK)) {
          continue;
        }
        filteredData[k] = data[k];
      }

      this.listeners.scores.forEach(cb => {
        try { cb(filteredData, source); } catch (e) { console.error(e); }
      });
    }

    getStatus() {
      if (this.isCloudActive && this.activeProvider === 'firebase') {
        if (this.isOnline) {
          return {
            mode: 'cloud',
            provider: 'Firebase Realtime Database',
            status: 'connected',
            label: 'Cloud: Terhubung (Firebase)',
            color: 'emerald',
            isLive: true
          };
        } else {
          return {
            mode: 'cloud',
            provider: 'Firebase Realtime Database',
            status: 'connecting',
            label: 'Cloud: Menghubungkan...',
            color: 'amber',
            isLive: false
          };
        }
      } else if (this.isCloudActive && this.activeProvider === 'apps_script') {
        return {
          mode: 'cloud',
          provider: 'Google Sheets (Apps Script)',
          status: 'connected',
          label: 'Cloud: Terhubung (Google Sheet)',
          color: 'emerald',
          isLive: true
        };
      } else {
        return {
          mode: 'unconfigured',
          provider: 'LocalStorage (Belum Ada Cloud)',
          status: 'unconfigured',
          label: '⚠️ Cloud Belum Terhubung (Lokal)',
          color: 'amber',
          isLive: false
        };
      }
    }

    async init() {
      // Bersihkan polling lama jika ada
      if (this.pollTimer) {
        clearInterval(this.pollTimer);
        this.pollTimer = null;
      }

      const cfg = this.currentConfig;
      const hasFirebaseUrl = cfg && cfg.databaseURL && cfg.databaseURL.trim().length > 10;
      const hasAppsScriptUrl = cfg && cfg.appsScriptUrl && cfg.appsScriptUrl.trim().length > 15;

      // 1. Cek opsi Firebase
      if (hasFirebaseUrl) {
        try {
          this.initFirebase();
          return true;
        } catch (err) {
          console.error('Inisialisasi Firebase gagal:', err);
        }
      }

      // 2. Cek opsi Google Apps Script
      if (hasAppsScriptUrl) {
        try {
          this.initAppsScript();
          return true;
        } catch (err) {
          console.error('Inisialisasi Apps Script gagal:', err);
        }
      }

      // 3. Jika belum dikonfigurasi sama sekali
      this.isCloudActive = false;
      this.activeProvider = 'none';
      this.notifyStatus(this.getStatus());

      // Muat data baseline dari repository GitHub jika ada
      this.tryLoadFromGitHubJson();
      return false;
    }

    initFirebase() {
      if (typeof window.firebase === 'undefined' || typeof window.firebase.database !== 'function') {
        throw new Error("Firebase SDK belum termuat.");
      }

      if (this.firebaseApp) {
        try {
          if (this.scoresRef) this.scoresRef.off();
          if (this.connectedRef) this.connectedRef.off();
          this.firebaseApp.delete();
        } catch (e) {}
      }

      let config = { ...this.currentConfig };
      if (!config.projectId && config.databaseURL) {
        const match = config.databaseURL.match(/https:\/\/([a-z0-9\-]+)/i);
        if (match) config.projectId = match[1];
      }

      this.firebaseApp = window.firebase.initializeApp(config, 'RD_Portal_' + Date.now());
      this.firebaseDb = this.firebaseApp.database();
      this.scoresRef = this.firebaseDb.ref('interviewScores');
      this.connectedRef = this.firebaseDb.ref('.info/connected');

      this.isCloudActive = true;
      this.activeProvider = 'firebase';

      this.connectedRef.on('value', (snap) => {
        this.isOnline = snap.val() === true;
        this.notifyStatus(this.getStatus());
      });

      this.scoresRef.on('value', (snapshot) => {
        const cloudScores = snapshot.val();
        if (cloudScores && typeof cloudScores === 'object') {
          this.notifyScoresUpdated(cloudScores, 'cloud');
        }
      });
    }

    initAppsScript() {
      this.isCloudActive = true;
      this.activeProvider = 'apps_script';
      this.isOnline = true;
      this.notifyStatus(this.getStatus());

      // Ambil data nilai pertama kali
      this.fetchFromAppsScript();

      // Polling setiap 5 detik agar seluruh perangkat selalu sinkron
      this.pollTimer = setInterval(() => {
        this.fetchFromAppsScript();
      }, 5000);

      // Ambil data langsung saat browser kembali difokuskan / tab dibuka kembali di HP
      if (typeof window !== 'undefined' && !this._hasBoundFocus) {
        this._hasBoundFocus = true;
        window.addEventListener('focus', () => {
          if (this.isCloudActive && this.activeProvider === 'apps_script') {
            this.fetchFromAppsScript();
          }
        });
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible' && this.isCloudActive && this.activeProvider === 'apps_script') {
            this.fetchFromAppsScript();
          }
        });
      }
    }

    async fetchFromAppsScript() {
      if (!this.currentConfig.appsScriptUrl) return;
      try {
        const res = await fetch(`${this.currentConfig.appsScriptUrl}?action=getScores&_t=${Date.now()}`);
        if (res.ok) {
          const json = await res.json();
          if (json && json.scores && typeof json.scores === 'object') {
            const validScores = {};
            for (const k in json.scores) {
              const item = json.scores[k];
              if (!item) continue;
              if (k === 'test_check_connection') continue;
              if (this.deletedKeys.has(k) || this.deletedKeys.has(this.sanitizeKey(k))) continue;
              
              // Filter anti-ampas: abaikan data unscored/deleted atau data kosong tanpa nilai/catatan
              if (item.status === 'unscored' || item.status === 'deleted') continue;
              if (!item.applicantNim && !item.applicantName && Number(item.finalScore) === 0 && !item.notes && !item.recommendation) {
                continue;
              }

              validScores[k] = item;
            }
            this.notifyScoresUpdated(validScores, 'cloud');
          }
        }
      } catch (err) {
        console.warn('Gagal mengambil data dari Google Apps Script:', err);
      }
    }

    async saveScore(applicantKey, scoreData) {
      const safeKey = this.sanitizeKey(applicantKey);
      const dataToSave = {
        ...scoreData,
        _safeKey: safeKey,
        _originalKey: applicantKey,
        updatedAt: scoreData.updatedAt || new Date().toISOString()
      };
      // Hapus dari daftar deletedKeys jika calon dinilai kembali
      this.clearedAll = false;
      this.deletedKeys.delete(applicantKey);
      this.deletedKeys.delete(safeKey);


      // 1. Simpan ke Firebase bila aktif
      if (this.isCloudActive && this.activeProvider === 'firebase' && this.scoresRef) {
        try {
          await this.scoresRef.child(safeKey).set(dataToSave);
          return { success: true, cloud: true, provider: 'firebase', key: applicantKey };
        } catch (error) {
          console.warn('Gagal kirim ke Firebase:', error);
          return { success: true, cloud: false, fallback: true, error: error.message };
        }
      }

      // 2. Simpan ke Google Apps Script bila aktif
      if (this.isCloudActive && this.activeProvider === 'apps_script' && this.currentConfig.appsScriptUrl) {
        try {
          fetch(this.currentConfig.appsScriptUrl, {
            method: 'POST',
            mode: 'no-cors', // Penting untuk bypass CORS Apps Script
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: safeKey, data: dataToSave })
          }).catch(e => console.warn(e));

          return { success: true, cloud: true, provider: 'apps_script', key: applicantKey };
        } catch (error) {
          return { success: true, cloud: false, fallback: true, error: error.message };
        }
      }

      // 3. Jika belum ada cloud
      return { success: true, cloud: false, localOnly: true };
    }

    async deleteScore(applicantKey) {
      const safeKey = this.sanitizeKey(applicantKey);
      this.deletedKeys.add(applicantKey);
      this.deletedKeys.add(safeKey);

      // 1. Hapus di Firebase bila aktif
      if (this.isCloudActive && this.activeProvider === 'firebase' && this.scoresRef) {
        try {
          await this.scoresRef.child(safeKey).remove();
          return { success: true, cloud: true };
        } catch (error) {
          return { success: false, error: error.message };
        }
      }

      // 2. Hapus di Google Apps Script (kirim action delete + fallback status unscored)
      if (this.isCloudActive && this.activeProvider === 'apps_script' && this.currentConfig.appsScriptUrl) {
        try {
          fetch(this.currentConfig.appsScriptUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'delete',
              key: safeKey,
              data: {
                status: 'unscored',
                scoreAdab: 0,
                scoreVisi: 0,
                scoreKeahlian: 0,
                scoreKomitmen: 0,
                finalScore: 0,
                recommendation: '',
                notes: '',
                interviewer: ''
              }
            })
          }).catch(e => console.warn(e));
          return { success: true, cloud: true };
        } catch (e) {
          return { success: false, error: e.message };
        }
      }

      return { success: true, cloud: false };
    }

    async clearAllScores() {
      this.clearedAll = true;
      this.deletedKeys.clear();

      // 1. Hapus semua di Firebase bila aktif
      if (this.isCloudActive && this.activeProvider === 'firebase' && this.scoresRef) {
        try {
          await this.scoresRef.remove();
          return { success: true, cloud: true };
        } catch (e) {}
      }

      // 2. Hapus semua di Google Apps Script (kirim clear_all dan cleanup)
      if (this.isCloudActive && this.activeProvider === 'apps_script' && this.currentConfig.appsScriptUrl) {
        try {
          fetch(this.currentConfig.appsScriptUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'clear_all' })
          }).catch(e => console.warn(e));

          fetch(`${this.currentConfig.appsScriptUrl}?action=cleanup&_t=${Date.now()}`).catch(e => console.warn(e));
          return { success: true, cloud: true };
        } catch (e) {}
      }

      return { success: true, cloud: false };
    }

    async purgeCloudGarbage() {
      if (this.currentConfig.appsScriptUrl) {
        try {
          await fetch(`${this.currentConfig.appsScriptUrl}?action=cleanup&_t=${Date.now()}`);
          this.deletedKeys.clear();
          this.clearedAll = false;
          return true;
        } catch (e) {
          console.error("Gagal membersihkan data sampah cloud:", e);
        }
      }
      return false;
    }

    async tryLoadFromGitHubJson() {
      try {
        const res = await fetch(`${GITHUB_SEED_FILE}?_nocache=${Date.now()}`);
        if (res.ok) {
          const json = await res.json();
          if (json && json.scores && Object.keys(json.scores).length > 0) {
            this.notifyScoresUpdated(json.scores, 'github_file');
          }
        }
      } catch (e) {}
    }

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

  window.RD_Database = new RDDatabaseManager();

})(window);
