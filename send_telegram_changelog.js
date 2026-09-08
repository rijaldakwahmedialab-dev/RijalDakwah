import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env if exists
function loadEnv() {
  const envPath = resolve(__dirname, '.env');
  if (existsSync(envPath)) {
    const content = readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        let val = (match[2] || '').trim();
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
        process.env[match[1]] = val;
      }
    });
  }
}

// Helper to extract ONLY the latest update section from CHANGELOG.md
export function extractLatestUpdate(fullContent) {
  const match = fullContent.match(/##\s+\[[\s\S]*?(?=(?:\n##\s+\[)|$)/);
  if (match) {
    let latestSection = match[0].trim();
    if (latestSection.endsWith('---')) {
      latestSection = latestSection.slice(0, -3).trim();
    }
    return `📢 *Update Terbaru Web UKM Rijal Dakwah STDIIS*\n\n${latestSection}`;
  }
  return fullContent;
}

export async function sendTelegramChangelog(customMessage) {
  loadEnv();

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const threadId = process.env.TELEGRAM_THREAD_ID;

  if (!botToken || !chatId) {
    console.error('Error: TELEGRAM_BOT_TOKEN atau TELEGRAM_CHAT_ID belum diset di .env atau environment variable.');
    return false;
  }

  let textToSend = customMessage;
  if (!textToSend) {
    const changelogPath = resolve(__dirname, 'CHANGELOG.md');
    if (existsSync(changelogPath)) {
      const fullContent = readFileSync(changelogPath, 'utf8');
      textToSend = extractLatestUpdate(fullContent);
    } else {
      textToSend = '📢 *Update Terbaru*: Sesi pengerjaan telah selesai.';
    }
  }

  console.log(`Panjang update yang akan dikirim: ${textToSend.length} karakter`);

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const payload = {
    chat_id: chatId,
    text: textToSend,
    parse_mode: 'Markdown'
  };

  if (threadId) {
    payload.message_thread_id = parseInt(threadId, 10);
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!data.ok) {
      console.warn(`Peringatan format Markdown, mencoba kirim tanpa parse_mode...`, data.description);
      delete payload.parse_mode;
      const retryRes = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const retryData = await retryRes.json();
      if (!retryData.ok) {
        console.error('Gagal mengirim ke Telegram:', retryData);
        return false;
      }
    }
    console.log('Update terbaru berhasil dikirim ke Telegram (1 pesan ringkas)!');
    return true;
  } catch (err) {
    console.error('Error jaringan saat mengirim ke Telegram:', err.message);
    return false;
  }
}

// Run if called directly
if (process.argv[1] && (process.argv[1].endsWith('send_telegram_changelog.js') || process.argv[1].includes('send_telegram_changelog'))) {
  sendTelegramChangelog();
}
