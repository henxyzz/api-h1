const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// Tag untuk API
router.tags = ['downloader'];

// Endpoint untuk download video TikTok dengan URL pendek
router.get('/tiktokdl', async (req, res) => {
    const videoUrl = req.query.url;

    if (!videoUrl) {
        return res.status(400).json({ message: 'URL tidak diberikan!' });
    }

    try {
        // Mengikuti pengalihan URL TikTok
        const response = await axios({
            method: 'GET',
            url: videoUrl,
            maxRedirects: 5, // Mengikuti hingga 5 pengalihan
        });

        // Ambil URL video dari pengalihan
        const finalUrl = response.request.res.responseUrl;

        // Mengambil video dari URL asli
        const videoResponse = await axios({
            method: 'GET',
            url: finalUrl,
            responseType: 'stream',
        });

        // Menyimpan video ke file sementara
        const filePath = path.join(__dirname, 'downloaded_video.mp4');
        const writer = fs.createWriteStream(filePath);

        videoResponse.data.pipe(writer);

        writer.on('finish', () => {
            res.download(filePath, 'tiktok_video.mp4', (err) => {
                if (err) {
                    return res.status(500).json({ message: 'Terjadi kesalahan saat mendownload video.' });
                }
                // Hapus file setelah selesai diunduh
                fs.unlink(filePath, (err) => {
                    if (err) console.error('Gagal menghapus file:', err);
                });
            });
        });

        writer.on('error', (err) => {
            console.error('Gagal menulis file:', err);
            return res.status(500).json({ message: 'Terjadi kesalahan saat mendownload video.' });
        });
    } catch (error) {
        console.error('Error saat mengambil video:', error);
        return res.status(500).json({ message: 'Terjadi kesalahan saat mengambil video.' });
    }
});

module.exports = router;
