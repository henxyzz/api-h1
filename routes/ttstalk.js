const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const router = express.Router();

router.tags = ["stalker"];

// Scraper TikTok
async function tiktokStalk(username) {
    try {
        const response = await axios.get(`https://www.tiktok.com/@${username}?_t=ZS-8tHANz7ieoS&_r=1`, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36"
            }
        });

        const html = response.data;
        const $ = cheerio.load(html);
        const scriptData = $('#__UNIVERSAL_DATA_FOR_REHYDRATION__').html();
        const parsedData = JSON.parse(scriptData);

        const userDetail = parsedData.__DEFAULT_SCOPE__?.['webapp.user-detail'];
        if (!userDetail) {
            throw new Error('User tidak ditemukan');
        }

        const userInfo = userDetail.userInfo?.user;
        const stats = userDetail.userInfo?.stats;

        return {
            success: true,
            userInfo: {
                id: userInfo?.id || null,
                username: userInfo?.uniqueId || null,
                nama: userInfo?.nickname || null,
                avatar: userInfo?.avatarLarger || null,
                bio: userInfo?.signature || "Tidak ada bio",
                verifikasi: userInfo?.verified || false,
                totalfollowers: stats?.followerCount || 0,
                totalmengikuti: stats?.followingCount || 0,
                totaldisukai: stats?.heart || 0,
                totalvideo: stats?.videoCount || 0,
                totalteman: stats?.friendCount || 0,
            }
        };
    } catch (error) {
        throw new Error(`Gagal mengambil data TikTok: ${error.message}`);
    }
}

// Endpoint API TikTok Stalker
router.get('/', async (req, res) => {
    const { username } = req.query;

    if (!username) {
        return res.status(400).json({
            success: false,
            message: 'Parameter username diperlukan!',
        });
    }

    try {
        const result = await tiktokStalk(username);
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});

module.exports = router;
