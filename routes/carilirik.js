const express = require('express');
const axios = require('axios');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// Fungsi untuk mengambil lirik lagu
async function fetchLyrics(songTitle) {
    const headers = {
        "Accept": "*/*",
        "User-Agent": "Postify/1.0.0",
        "Content-Encoding": "gzip, deflate, br, zstd",
        "Content-Type": "application/json",
    };

    const payload = {
        query: songTitle,
        search_uuid: uuidv4().replace(/-/g, ''),
        search_options: { langcode: "id-MM" },
        search_video: true,
    };

    try {
        const response = await axios.post("https://api.felo.ai/search/threads", payload, {
            headers,
            timeout: 30000,
            responseType: 'text',
        });

        return processResponse(response.data);
    } catch (error) {
        throw new Error("Gagal mengambil lirik lagu");
    }
}

// Proses data dari API
function processResponse(data) {
    const result = { lirik: '', sumber: [] };

    data.split('\n').forEach(line => {
        if (line.startsWith('data:')) {
            try {
                const parsed = JSON.parse(line.slice(5).trim());
                if (parsed.data) {
                    if (parsed.data.text) {
                        result.lirik = parsed.data.text.replace(/\d+/g, '');
                    }
                    if (parsed.data.sources) {
                        result.sumber = parsed.data.sources.map(src => ({
                            url: src.url || '',
                            title: src.title || ''
                        }));
                    }
                }
            } catch (e) {}
        }
    });

    return result;
}

// Route API
router.get('/', async (req, res) => {
    const { judul } = req.query;

    if (!judul) {
        return res.status(400).json({ error: 'Parameter "judul" diperlukan' });
    }

    const requestText = `Tolong lirik lagu dari ${judul}`;

    try {
        const result = await fetchLyrics(requestText);
        if (!result.lirik) {
            return res.status(404).json({ error: 'Lirik tidak ditemukan' });
        }
        res.json({ judul, ...result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
