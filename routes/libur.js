// routes/libur.js
const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const router = express.Router();

// API untuk mendapatkan hari libur berdasarkan tahun
router.get('/', async (req, res) => {
    const { year } = req.query;

    if (!year) {
        return res.status(400).json({
            status: 'error',
            message: 'Parameter "year" diperlukan.',
        });
    }

    try {
        // Mengambil data hari libur
        const holidays = await getHolidays(year);
        res.json({
            status: 'success',
            year: year,
            holidays: holidays,
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Terjadi kesalahan saat mengambil data libur.',
            error: error.message,
        });
    }
});

// Fungsi untuk mengambil hari libur dari website
async function getHolidays(year) {
    return new Promise(async (resolve, reject) => {
        try {
            const response = await axios.get(`https://publicholidays.co.id/id/${year}-dates/`);
            let $ = cheerio.load(response.data);
            let array = []
            $("table.publicholidays").eq(0).find("tbody .even").each((a, i) => {
                array.push({
                    date: $(i).find("td").eq(0).text(),
                    day: $(i).find("td").eq(1).text(),
                    name: $(i).find("td").eq(2).text().trim()
                })
            })
            resolve(array);
        } catch (err) {
            reject(err);
        }
    })
}

module.exports = router;
