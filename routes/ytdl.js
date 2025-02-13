const express = require('express');
const axios = require('axios');
const ytSearch = require('yt-search');
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/(?:v|e(?:mbed)?)\/|youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})|(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/;

const execPromise = promisify(exec);

async function converter(inputBuffer, inputFormat, outputFormat) {
    if (!Buffer.isBuffer(inputBuffer)) {
        throw new Error('Input must be a Buffer');
    }
    if (typeof inputFormat !== 'string' || typeof outputFormat !== 'string') {
        throw new Error('Input and output formats must be strings');
    }

    const inputFilePath = path.resolve(`./tmp/temp_input.${inputFormat}`);
    const outputFilePath = path.resolve(`./tmp/temp_output.${outputFormat}`);

    try {
        await fs.promises.writeFile(inputFilePath, inputBuffer);
        await execPromise(`ffmpeg -i ${inputFilePath} ${outputFilePath}`);
        const outputBuffer = await fs.promises.readFile(outputFilePath);
        return outputBuffer;
    } catch (error) {
        throw error;
    } finally {
        try {
            if (fs.existsSync(inputFilePath)) await fs.promises.unlink(inputFilePath);
            if (fs.existsSync(outputFilePath)) await fs.promises.unlink(outputFilePath);
        } catch (cleanupError) {
            console.error('Error while cleaning up temp files:', cleanupError);
        }
    }
}

class Youtube {
    mp3 = async function ytmp3(url) {
        const match = url.match(youtubeRegex);
        const videoId = match ? match[1] || match[2] : null;
        if (!videoId) throw new Error('Invalid YouTube URL');
        const { videos } = await ytSearch(videoId);
        if (videos.length === 0) throw new Error('Video not found');
        const videoDetails = videos.find(a => a.videoId === videoId);
        let result = {};

        const response = await axios.post('https://cobalt-api.kwiatekmiki.com', { url }, {
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        }).catch(e => e.response);
        const data = response.data.url;

        if (data) {
            let buffer = await fetch(data).then(async (a) => Buffer.from(await a.arrayBuffer()));
            result = buffer;
        }

        return {
            metadata: {
                title: videoDetails.title,
                seconds: videoDetails.seconds,
                thumbnail: videoDetails.thumbnail,
                views: videoDetails.views.toLocaleString(),
                publish: videoDetails.ago,
                author: videoDetails.author,
                url: videoDetails.url,
                description: videoDetails.description,
            },
            download: result,
        };
    };

    mp4 = async function ytmp4(url) {
        const match = url.match(youtubeRegex);
        const videoId = match ? match[1] || match[2] : null;
        if (!videoId) throw new Error('Invalid YouTube URL');
        const { videos } = await ytSearch(videoId);
        if (videos.length === 0) throw new Error('Video not found');
        const videoDetails = videos.find(a => a.videoId === videoId);
        let result = {};

        const response = await axios.post('https://cobalt-api.kwiatekmiki.com', { url }, {
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        }).catch(e => e.response);
        const data = response.data.url;

        if (data) {
            let buffer = await fetch(data).then(async (a) => Buffer.from(await a.arrayBuffer()));
            result = await converter(buffer, "webm", "mp4");
        }

        return {
            metadata: {
                title: videoDetails.title,
                seconds: videoDetails.seconds,
                thumbnail: videoDetails.thumbnail,
                views: videoDetails.views.toLocaleString(),
                publish: videoDetails.ago,
                author: videoDetails.author,
                url: videoDetails.url,
                description: videoDetails.description,
            },
            download: result,
        };
    };

    playlist = async (url) => {
        const response = await axios.post("https://solyptube.com/findchannelvideo", `url=${url}`, {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                Accept: "application/json, text/javascript, */*; q=0.01",
                "X-Requested-With": "XMLHttpRequest",
                "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36",
                Referer: "https://solyptube.com/youtube-playlist-downloader#searchrResult",
            },
        }).catch(e => e.response);

        let info = response.data;
        if (!info.data.title) return info;
        return {
            metadata: {
                title: info.data.title,
                total: info.data.estimatedItemCount + " Videos",
                views: info.data.views,
                thumbnail: info.data.thumbnails[0].url,
                update: info.data.lastUpdated,
                author: info.data.author.name,
            },
            items: info.data.items.map((a) => ({
                title: a.title,
                duration: a.duration,
                url: a.shortUrl,
                thumbnail: a.thumbnails[0].url,
                author: a.author.name,
            })),
        };
    };
}

const youtube = new Youtube();
const router = express.Router();

// API untuk mengunduh MP3 atau MP4 dari YouTube
router.get('/', async (req, res) => {
    const { url, mode } = req.query;

    if (!url || !mode) {
        return res.status(400).json({
            status: 'error',
            message: 'Parameter "url" dan "mode" diperlukan. Gunakan mode=MP3 atau mode=MP4.',
        });
    }

    if (!['MP3', 'MP4'].includes(mode.toUpperCase())) {
        return res.status(400).json({
            status: 'error',
            message: 'Mode tidak valid. Gunakan mode=MP3 atau mode=MP4.',
        });
    }

    try {
        let result;
        if (mode.toUpperCase() === 'MP3') {
            result = await youtube.mp3(url);
        } else if (mode.toUpperCase() === 'MP4') {
            result = await youtube.mp4(url);
        }

        res.json({
            status: 'success',
            metadata: result.metadata,
            downloadUrl: result.download,
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message,
        });
    }
});

// Menambahkan tag ke router
router.tags = ['downloader'];

module.exports = router;
