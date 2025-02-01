const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Mengambil data motivasi dari file motivasi.txt
const motivasiFilePath = path.join(__dirname, '../module/motivasi.txt');

router.get('/', (req, res) => {
  fs.readFile(motivasiFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error membaca file motivasi:', err);
      return res.status(500).json({ message: 'Gagal mengambil motivasi' });
    }

    // Pisahkan file berdasarkan baris
    const motivasiList = data.split('\n').filter(line => line.trim() !== '');

    // Ambil motivasi secara acak
    const randomIndex = Math.floor(Math.random() * motivasiList.length);
    const randomMotivasi = motivasiList[randomIndex];

    // Kirim motivasi acak sebagai response
    res.json({ motivasi: randomMotivasi });
  });
});

module.exports = router;
