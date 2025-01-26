const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const router = express.Router();

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
        const { data } = await axios.get(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36',
            },
        });

        const $ = cheerio.load(data);
        const results = [];

        $('li dl').each((_, element) => {
            const appLink = $(element).find('a.dd').attr('href');
            const appName = $(element).find('p.p1').text().trim();
            const appDeveloper = $(element).find('p.p2').text().trim();
            const appIcon = $(element).find('img').attr('src');
            const appRating = $(element).find('.score-search').attr('title') || 'No rating';

            results.push({
                appName,
                appDeveloper,
                appRating,
                appIcon,
                appLink: appLink ? `https://apkpure.com${appLink}` : null,
            });
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