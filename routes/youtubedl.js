const express = require('express');
const YTDL = require('@distube/ytdl-core');
const fs = require('fs');
const axios = require('axios');
const router = express.Router();

router.tags = ['downloader'];

const Quals = ["144", "240", "360", "480", "720", "1080"];

function randomKarakter(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

async function FileSize(path) {
    return new Promise((resolve) => {
        const interval = setInterval(() => {
            if (fs.existsSync(path)) {
                const stats = fs.statSync(path);
                if (stats.size > 0) {
                    clearInterval(interval);
                    resolve(stats.size);
                }
            }
        }, 500);
    });
}

async function Ytdl(url, type, qual = null) {
    const info = await YTDL.getInfo(url);
    const video = info.videoDetails;
    const file_id = randomKarakter(8);

    if (type === 'mp3') {
        const file_name = `${video.title}.mp3`;
        const file_path = `./lib/${file_id}.mp3`;
        await YTDL(url, { filter: 'audioonly' }).pipe(fs.createWriteStream(file_path));
        const file_size = await FileSize(file_path);
        return { file_name, file_path, file_size };
    }

    if (!Quals.includes(String(qual))) return { availableQuality: Quals };
    const formats = info.formats.find(f => f.qualityLabel === `${qual}p`);
    if (!formats) return { error: 'Quality not available' };

    const file_name = `${video.title}.mp4`;
    const file_path = `./lib/${file_id}.mp4`;
    await YTDL(url, { quality: formats.itag }).pipe(fs.createWriteStream(file_path));
    const file_size = await FileSize(file_path);
    return { file_name, file_path, file_size };
}

router.get('/', async (req, res) => {
    const { url, type, quality } = req.query;
    if (!url || !type) return res.status(400).json({ error: 'Parameter url dan type diperlukan' });
    const result = await Ytdl(url, type, quality);
    res.json(result);
});

module.exports = router;
