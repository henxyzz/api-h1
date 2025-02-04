const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

router.tags = ["game"];

// Baca file khodam.txt dan simpan daftar ke dalam array
const khodamFile = path.join(__dirname, '../module/khodam.txt');
let khodamList = [];

fs.readFile(khodamFile, 'utf8', (err, data) => {
  if (!err) {
    khodamList = data.split('\n').map((line) => line.trim()).filter((line) => line);
  } else {
    console.error('Gagal membaca khodam.txt:', err);
  }
});

// Endpoint API
router.get('/', (req, res) => {
  const { nama } = req.query;

  if (!nama) {
    return res.status(400).json({
      success: false,
      message: "Parameter 'nama' wajib diisi!",
    });
  }

  // Ambil khodam secara random dari daftar
  const randomKhodam = khodamList.length ? khodamList[Math.floor(Math.random() * khodamList.length)] : "Tidak ada khodam tersedia";

  res.json({
    success: true,
    nama: nama,
    khodam: randomKhodam,
  });
});

module.exports = router;
