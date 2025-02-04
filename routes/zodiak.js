const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

router.tags = ["fun"];

// Fungsi untuk memeriksa zodiak berdasarkan bulan dan tanggal
function getZodiac(month, day) {
  const zodiakPath = path.join(__dirname, '../module/zodiak.txt');
  
  // Membaca file zodiak.txt
  const zodiakData = fs.readFileSync(zodiakPath, 'utf8').split('\n');
  
  const zodiacDates = {
    "aries": { start: "03-21", end: "04-19" },
    "taurus": { start: "04-20", end: "05-20" },
    "gemini": { start: "05-21", end: "06-20" },
    "cancer": { start: "06-21", end: "07-22" },
    "leo": { start: "07-23", end: "08-22" },
    "virgo": { start: "08-23", end: "09-22" },
    "libra": { start: "09-23", end: "10-22" },
    "scorpio": { start: "10-23", end: "11-21" },
    "sagittarius": { start: "11-22", end: "12-21" },
    "capricorn": { start: "12-22", end: "01-19" },
    "aquarius": { start: "01-20", end: "02-18" },
    "pisces": { start: "02-19", end: "03-20" }
  };

  const date = `${month}-${day}`;

  for (const [zodiac, { start, end }] of Object.entries(zodiacDates)) {
    if (date >= start && date <= end) {
      const description = zodiakData.find(line => line.toLowerCase().includes(zodiac));
      return description || `${zodiac} zodiak tidak ditemukan deskripsinya.`;
    }
  }

  return "Zodiak tidak ditemukan.";
}

// Endpoint untuk cek zodiak berdasarkan bulan dan tanggal
router.get('/', (req, res) => {
  const { bulan, tanggal } = req.query;

  if (!bulan || !tanggal) {
    return res.status(400).json({ error: 'Parameter bulan dan tanggal diperlukan. Gunakan format ?bulan=&tanggal=' });
  }

  const zodiacDescription = getZodiac(bulan, tanggal);
  res.json({ zodiac: zodiacDescription });
});

// Endpoint untuk daftar kata (word list) di file zodiak.txt
router.get('/wordlist', (req, res) => {
  const zodiakPath = path.join(__dirname, '../module/zodiak.txt');
  const zodiakData = fs.readFileSync(zodiakPath, 'utf8').split('\n');

  const zodiakWords = zodiakData.map(line => line.split(':')[0].trim());
  res.json({ words: zodiakWords });
});

module.exports = router;
