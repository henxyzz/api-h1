const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const router = express.Router();

/**
 * Author: Azatxyz
 * Deskripsi: API untuk mencari film di RebahinXXI berdasarkan query yang diberikan.
 * Endpoint: /api/rebahinxxi?query={query}
 * Penjelasan: Endpoint ini memungkinkan pengguna untuk mencari film berdasarkan nama yang diberikan dalam parameter query.
 * Parameter:
 *   - query: Nama film yang ingin dicari di RebahinXXI.
 * Response:
 *   - status: Status dari request (success/error).
 *   - message: Pesan status.
 *   - results: Daftar film yang ditemukan (berisi title, link, imgSrc, rating, duration, quality).
 */

/**
 * Fungsi untuk mencari film di RebahinXXI berdasarkan query
 */
const fetchMovies = async (searchQuery) => {
    try {
        const url = `https://rebahinxxi.vip/?s=${encodeURIComponent(searchQuery)}`;

        // Menambahkan User-Agent pada request untuk menghindari pemblokiran
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36'
            }
        });

        const $ = cheerio.load(data);
        const movies = [];

        // Parsing data film dari halaman
        $('.ml-item').each((index, element) => {
            const title = $(element).find('h2').text().trim();
            const link = $(element).find('a').attr('href');
            const imgSrc = $(element).find('img').attr('src');
            const rating = $(element).find('.mli-rating').text().trim();
            const duration = $(element).find('.mli-durasi').text().trim();
            const quality = $(element).find('.mli-quality').text().trim();

            // Menyimpan hasil parsing dalam array
            movies.push({
                title,
                link,
                imgSrc,
                rating,
                duration,
                quality,
            });
        });

        return movies;
    } catch (error) {
        console.error('Error fetching data: ', error);
        return [];
    }
};

/**
 * Endpoint untuk mencari film di RebahinXXI berdasarkan query
 * URL: /api/rebahinxxi?query={query}
 */
router.get('/', async (req, res) => {
    const { query } = req.query;

    if (!query) {
        return res.status(400).json({
            error: 'Parameter query diperlukan.',
            author: 'Azatxyz',
            usage: 'Untuk mencari film, gunakan parameter `query`. Contoh: /api/rebahinxxi?query=avengers'
        });
    }

    try {
        const results = await fetchMovies(query);

        if (results.length > 0) {
            res.json({
                status: 'success',
                message: 'Hasil pencarian film di RebahinXXI',
                results: results,
                author: 'Azatxyz',
                usage: 'Untuk mencari film, gunakan parameter `query`. Contoh: /api/rebahinxxi?query=avengers'
            });
        } else {
            res.status(404).json({
                error: 'Tidak Ada Hasil Ditemukan.',
                author: 'Azatxyz',
                usage: 'Untuk mencari film, gunakan parameter `query`. Contoh: /api/rebahinxxi?query=avengers'
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: 'Terjadi kesalahan pada server.',
            author: 'Azatxyz',
            usage: 'Untuk mencari film, gunakan parameter `query`. Contoh: /api/rebahinxxi?query=avengers'
        });
    }
});

module.exports = router;
