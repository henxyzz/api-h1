const express = require('express');
const ytSearch = require('yt-search');
const router = express.Router();

// Endpoint untuk mencari video di YouTube
router.get('/', async (req, res) => {
  const query = req.query.query; // Ambil parameter query dari URL

  if (!query) {
    return res.status(400).json({ error: 'Query pencarian tidak diberikan.' });
  }

  try {
    // Melakukan pencarian video di YouTube
    const result = await ytSearch(query);

    // Mengambil hasil pencarian pertama
    const videos = result.videos.map(video => ({
      title: video.title,
      url: video.url,
      description: video.description,
      views: video.views,
      duration: video.duration,
      thumbnail: video.thumbnail.url,
    }));

    // Mengirimkan hasil pencarian sebagai response
    res.json({
      query: query,
      totalResults: result.videos.length,
      videos: videos,
    });
  } catch (error) {
    console.error('Terjadi kesalahan saat mencari video:', error);
    res.status(500).json({ error: 'Gagal melakukan pencarian.' });
  }
});

module.exports = router;