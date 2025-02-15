
const express = require('express');
const axios = require('axios');
const router = express.Router();

router.tags = ["ai"];

async function powerbrain(question) {
    const data = `message=${encodeURIComponent(question)}&messageCount=1`;

    const config = {
        method: 'POST',
        url: 'https://powerbrainai.com/chat.php',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Android 10; Mobile; rv:131.0) Gecko/131.0 Firefox/131.0',
            'Content-Type': 'application/x-www-form-urlencoded',
            'accept-language': 'id-ID',
            'referer': 'https://powerbrainai.com/chat.html',
            'origin': 'https://powerbrainai.com',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-origin',
            'priority': 'u=0',
            'te': 'trailers'
        },
        data: data
    };

    try {
        const api = await axios.request(config);
        return api.data.response;
    } catch (error) {
        throw new Error('Error fetching PowerBrain response');
    }
}

router.get('/', async (req, res) => {
    const { question } = req.query;

    if (!question) {
        return res.status(400).json({ error: 'Parameter question diperlukan' });
    }

    try {
        const response = await powerbrain(question);
        res.json({ response });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
