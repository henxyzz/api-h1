const express = require('express');
const axios = require('axios');
const router = express.Router();

// Base URL untuk PowerBrain AI
const BASE_URL = 'https://powerbrainai.com/chat/';

// Route untuk mengirim pesan ke AI
router.post('/', async (req, res) => {
    const { message } = req.body;

    if (!message) {
        return res.status(400).json({
            success: false,
            message: 'Parameter "message" diperlukan.',
        });
    }

    try {
        // Mengirim permintaan POST ke server PowerBrain
        const response = await axios.post(BASE_URL, { message });

        // Respon dari AI
        return res.status(200).json({
            success: true,
            reply: response.data.reply, // Sesuaikan dengan struktur data respon sebenarnya
        });
    } catch (error) {
        console.error('Error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat berkomunikasi dengan AI.',
            error: error.message,
        });
    }
});

module.exports = router;
