// routes/tiktoksearch.js

const express = require('express');
const axios = require('axios');
const router = express.Router();

// Menetapkan tag untuk router
router.tags = ['search'];

// Fungsi untuk mengambil data TikTok
async function tiktoks(query, count = 10) {
  return new Promise(async (resolve, reject) => {
    try {
      const response = await axios({
        method: 'POST',
        url: 'https://tikwm.com/api/feed/search',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'Cookie': 'current_language=en',
          'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36'
        },
        data: {
          keywords: query,
          count: count, // Menyesuaikan jumlah hasil yang diminta
          cursor: 0,
          HD: 1
        }
      });

      const videos = response.data.data.videos;

      if (!videos || videos.length === 0) {
        reject("Tidak ada video ditemukan.");
      } else {
        // Batasi hasil sesuai dengan parameter jumlah
        resolve(
          videos.slice(0, count).map((video) => ({
            title: video.title,
            cover: video.cover,
            origin_cover: video.origin_cover,
            no_watermark: video.play,
            watermark: video.wmplay,
            music: video.music,
          }))
        );
      }
    } catch (error) {
      reject(error);
    }
  });
}

// Endpoint untuk pencarian video TikTok
router.get('/', async (req, res) => {
  const { keyword, jumlah } = req.query;

  // Validasi parameter
  if (!keyword) {
    return res.status(400).json({
      error: 'Parameter "keyword" diperlukan.',
      message: 'Silakan berikan kata kunci pencarian menggunakan parameter "keyword" di URL. Contoh: /api/tiktoksearch/search?keyword=music&jumlah=2',
    });
  }

  const jumlahHasil = parseInt(jumlah) || 1; // Default 1 jika tidak ada parameter jumlah

  try {
    const videoResults = await tiktoks(keyword, jumlahHasil);

    res.json({
      message: `Hasil pencarian (${jumlahHasil} video) ditemukan.`,
      data: videoResults,
    });
  } catch (error) {
    console.error('Error saat mengambil data dari TikTok:', error);

    res.status(500).json({
      error: 'Terjadi kesalahan saat mengambil data.',
      message: 'Terjadi masalah saat mengakses TikTok. Pastikan server dapat mengakses TikTok dengan baik atau coba lagi nanti.',
    });
  }
});

module.exports = router;
