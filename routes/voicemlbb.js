const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');
const router = express.Router();

router.tags = ["search"];

// Fungsi untuk mengambil suara dan judul berdasarkan hero dan bahasa
const getVoiceData = async (hero, language) => {
  try {
    const url = `https://mobile-legends.fandom.com/wiki/${hero}/Audio/${language}`;
    const { data } = await axios.get(url);

    const $ = cheerio.load(data);

    // Ambil semua tag <a> yang memiliki link suara OGG
    const voices = [];
    $('a[href*=".ogg"]').each((index, element) => {
      const href = $(element).attr('href');
      const title = $(element).text().trim();
      voices.push({
        title,
        url: `https://mobile-legends.fandom.com${href}`,
      });
    });

    return voices;
  } catch (error) {
    console.error('Error scraping voice data:', error);
    throw new Error('Gagal mengambil data suara');
  }
};

// Endpoint untuk mendapatkan suara hero dalam bahasa yang dipilih
router.get('/', async (req, res) => {
  const { hero, language } = req.query;

  if (!hero || !language) {
    return res.status(400).json({ message: 'Hero dan bahasa harus diberikan' });
  }

  if (!['id', 'ja', 'zh'].includes(language)) {
    return res.status(400).json({ message: 'Bahasa tidak valid. Gunakan id, ja, atau zh.' });
  }

  try {
    const voices = await getVoiceData(hero, language);

    if (voices.length === 0) {
      return res.status(404).json({ message: 'Suara tidak ditemukan untuk hero ini dalam bahasa yang dipilih' });
    }

    // Kirimkan suara yang ditemukan
    res.json({ hero, language, voices });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
