const cloudscraper = require('cloudscraper'); // Gunakan cloudscraper untuk melewati proteksi Cloudflare
const cheerio = require('cheerio');
const express = require('express');
const router = express.Router();

router.tags = ["apk"];

// Fungsi untuk memberi delay
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Route pencarian APK Pure
router.get('/', async (req, res) => {
    const { q } = req.query; // Parameter query untuk pencarian
    if (!q) {
        return res.status(400).json({
            success: false,
            message: 'Parameter pencarian (q) diperlukan!',
        });
    }

    const searchUrl = `https://apkpure.com/id/search?q=${encodeURIComponent(q)}`;

    try {
        // Header lengkap untuk menghindari deteksi bot
        const headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9,id;q=0.8",
            "Accept-Encoding": "gzip, deflate, br",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1",
            "Cache-Control": "max-age=0",
            "TE": "Trailers", // Menghindari pemblokiran
        };

        // Menggunakan cloudscraper untuk mengambil data dengan headers lengkap
        const data = await cloudscraper.get(searchUrl, { headers });

        // Tambahkan delay agar tidak terlalu cepat melakukan permintaan
        await sleep(2000); // Delay 2 detik

        const $ = cheerio.load(data);
        const results = [];
        const appLinksSet = new Set(); // Gunakan Set untuk mengecek duplikat

        $('li dl').each((_, element) => {
            const appLink = $(element).find('a.dd').attr('href');
            const appName = $(element).find('p.p1').text().trim();
            const appDeveloper = $(element).find('p.p2').text().trim();
            const appIcon = $(element).find('img').attr('src');
            const appRating = $(element).find('.score-search').attr('title') || 'No rating';

            // Cek apakah appLink sudah ada dalam Set
            if (appLink && !appLinksSet.has(appLink)) {
                appLinksSet.add(appLink); // Tambahkan appLink ke Set jika belum ada

                // Pastikan appLink hanya mengandung satu instance dari "https://apkpure.com"
                const fullAppLink = appLink.startsWith('https://apkpure.com') ? appLink : `https://apkpure.com${appLink}`;

                results.push({
                    appName,
                    appDeveloper,
                    appRating,
                    appIcon,
                    appLink: fullAppLink, // AppLink yang sudah benar
                });
            }
        });

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Tidak ada hasil ditemukan.',
                results: [],
            });
        }

        res.json({
            success: true,
            message: 'Pencarian berhasil.',
            results,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat mengambil data.',
            error: error.message,
        });
    }
});

module.exports = router;
