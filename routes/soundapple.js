const express = require('express');
const router = express.Router();

// Endpoint untuk mencari lagu
router.get('/', async (req, res) => {
    const query = req.query.q;
    if (!query) {
        return res.status(400).json({ error: "Query parameter 'q' is required" });
    }

    try {
        const results = await AppleMusic.search(query);
        res.json({ results });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching data from Apple Music' });
    }
});

// Endpoint untuk mendownload lagu
router.get('/download', async (req, res) => {
    const link = req.query.link;
    if (!link) {
        return res.status(400).json({ error: "Query parameter 'link' is required" });
    }

    try {
        const result = await AppleMusic.download(link);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching download link' });
    }
});

module.exports = router;
