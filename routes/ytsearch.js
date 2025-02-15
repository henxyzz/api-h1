const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const router = express.Router();

// Endpoint untuk pencarian video YouTube
router.get('/', async (req, res) => {
  const query = req.query.query;  // Ambil parameter query dari URL

  if (!query) {
    return res.status(400).json({ error: 'Query pencarian tidak diberikan.' });
  }

  const searchUrl = `https://www.y2mate.com/search/${encodeURIComponent(query)}`;

  try {
    // Lakukan scraping pada halaman pencarian
    const { data } = await axios.get(searchUrl);
    const $ = cheerio.load(data);

    // Menyimpan hasil video
    const videos = [];
    $('#list-video .tablescraper-selected-row').each((i, element) => {
      const title = $(element).find('.search-info a').text().trim();
      const url = $(element).find('.search-info a').attr('href');
      const thumbnail = $(element).find('.ytthumbnail').attr('data-src');

      if (title && url && thumbnail) {
        videos.push({
          title,
          url: `https://www.y2mate.com${url}`,
          thumbnail,
        });
      }
    });

    // Mengirimkan respons dengan hasil pencarian
    if (videos.length > 0) {
      res.json({
        query: query,
        totalResults: videos.length,
        author: "Azatxyz",
        videos: videos,
      });
    } else {
      res.status(404).json({
        error: 'Tidak ada video yang ditemukan untuk query tersebut.',
      });
    }
  } catch (error) {
    console.error('Terjadi kesalahan saat melakukan scraping:', error);
    res.status(500).json({ error: 'Gagal melakukan pencarian.' });
  }
});

module.exports = router;