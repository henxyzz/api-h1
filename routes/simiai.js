const express = require('express'); const fetch = require('node-fetch'); const { URLSearchParams } = require('url'); const router = express.Router();

// Metadata untuk dokumentasi router.tags = ['ai']; router.handler = { description: 'API untuk berinteraksi dengan SimSimi menggunakan metode GET', };

// Endpoint untuk berkomunikasi dengan SimSimi router.get('/simsimi', async (req, res) => { const { text, lang } = req.query;

if (!text) { return res.status(400).json({ error: 'Parameter text diperlukan' }); }

const languageCode = lang || 'id'; const url = 'https://api.simsimi.vn/v1/simtalk'; const headers = { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, seperti Gecko) Chrome/91.0.4472.124 Safari/537.36', };

const data = new URLSearchParams(); data.append('text', text); data.append('lc', languageCode);

try { const response = await fetch(url, { method: 'POST', headers, body: data.toString(), }); const rawResponse = await response.text(); console.log('Raw Response:', rawResponse);

try {
  const jsonResponse = JSON.parse(rawResponse);
  return res.json({ reply: jsonResponse.message });
} catch (error) {
  console.error('Respons bukan JSON:', rawResponse);
  return res.status(500).json({ error: 'Respons dari server bukan JSON yang valid' });
}

} catch (error) { console.error('Error:', error); return res.status(500).json({ error: 'Gagal menghubungi SimSimi API' }); } });

module.exports = router;

