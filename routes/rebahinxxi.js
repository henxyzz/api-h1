const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const router = express.Router();

router.tags = ["film"];

/**
 * Author: Azatxyz
 * Deskripsi: API untuk mencari film atau mendapatkan detail film di RebahinXXI.
 * Endpoint: /api/rebahinxxi?mode={mode}&query={query} atau /api/rebahinxxi?mode={mode}&urlfilm={url}
 * Parameter:
 *   - mode: Tipe mode ('search' atau 'detail').
 *   - query: Nama film untuk pencarian (hanya untuk mode 'search').
 *   - urlfilm: URL film untuk mendapatkan detail film (hanya untuk mode 'detail').
 * Response:
 *   - status: Status dari request (success/error).
 *   - message: Pesan status.
 *   - results: Hasil pencarian atau detail film.
 */

/**
 * Fungsi untuk mencari film di RebahinXXI berdasarkan query
 */
const fetchMovies = async (searchQuery) => {
    try {
        const url = `https://rebahinxxi.vip/?s=${encodeURIComponent(searchQuery)}`;
        
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36'
            }
        });

        const $ = cheerio.load(data);
        const movies = [];

        $('.ml-item').each((index, element) => {
            const title = $(element).find('h2').text().trim();
            const link = $(element).find('a').attr('href');
            const imgSrc = $(element).find('img').attr('src');
            const rating = $(element).find('.mli-rating').text().trim();
            const duration = $(element).find('.mli-durasi').text().trim();
            const quality = $(element).find('.mli-quality').text().trim();

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
 * Fungsi untuk mendapatkan detail film dari URL yang diberikan
 */
const fetchMovieDetails = async (url) => {
    try {
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36'
            }
        });

        const $ = cheerio.load(data);
        const movieDetails = {};

        // Ambil informasi detail film
        movieDetails.title = $('h3[itemprop="name"]').text().trim();
movieDetails.rating = $('span[itemprop="ratingValue"]').text().trim();
movieDetails.description = $('span[itemprop="reviewBody"]').text().trim();
movieDetails.image = $('.mvic-thumb').css('background-image').replace(/^url['"]?/, '').replace(/['"]?$/, '');

// Gabungkan Genre dan Aktor langsung dalam satu string
movieDetails.genre = '';
$('.mvici-left a[itemprop="genre"]').each((index, element) => {
    if (movieDetails.genre) {
        movieDetails.genre += ', ';  // Tambahkan koma jika genre sudah ada
    }
    movieDetails.genre += $(element).text().trim();
});

// Gabungkan Aktor langsung dalam satu string
movieDetails.actors = '';
$('.mvici-left a[itemprop="actor"]').each((index, element) => {
    if (movieDetails.actors) {
        movieDetails.actors += ', ';  // Tambahkan koma jika aktor sudah ada
    }
    movieDetails.actors += $(element).text().trim();
});

// Ambil Durasi dan Tanggal Rilis
movieDetails.duration = $('.mvici-right p:contains("Duration")').text().split(':')[1].trim();
movieDetails.releaseDate = $('.mvici-right p:contains("Release Date")').text().split(':')[1].trim();

return movieDetails;
} catch (error) {
    console.error('Error fetching movie details: ', error);
    return null;
}
};

/**
 * Endpoint untuk mencari film atau mendapatkan detail film di RebahinXXI
 * URL: /api/rebahinxxi?mode=search&query={query} atau /api/rebahinxxi?mode=detail&urlfilm={url}
 */
router.get('/', async (req, res) => {
    const { mode, query, urlfilm } = req.query;

    if (!mode) {
        return res.status(400).json({
            error: 'Parameter mode diperlukan. Gunakan mode "search" atau "detail".',
            author: 'Azatxyz',
            usage: 'Untuk mencari film, gunakan mode=search&query={query}. Untuk mendapatkan detail film, gunakan mode=detail&urlfilm={url}'
        });
    }

    if (mode === 'search') {
        if (!query) {
            return res.status(400).json({
                error: 'Parameter query diperlukan untuk mode search.',
                author: 'Azatxyz',
                usage: 'Contoh: /api/rebahinxxi?mode=search&query=Marni'
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
                    usage: 'Untuk mencari film, gunakan mode=search&query={query}. Contoh: /api/rebahinxxi?mode=search&query=Marni'
                });
            } else {
                res.status(404).json({
                    error: 'Tidak Ada Hasil Ditemukan.',
                    author: 'Azatxyz',
                    usage: 'Contoh: /api/rebahinxxi?mode=search&query=Marni'
                });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({
                error: 'Terjadi kesalahan pada server.',
                author: 'Azatxyz',
                usage: 'Untuk mencari film, gunakan mode=search&query={query}. Contoh: /api/rebahinxxi?mode=search&query=Marni'
            });
        }
    } else if (mode === 'detail') {
        if (!urlfilm) {
            return res.status(400).json({
                error: 'Parameter urlfilm diperlukan untuk mode detail.',
                author: 'Azatxyz',
                usage: 'Contoh: /api/rebahinxxi?mode=detail&urlfilm={url_film}'
            });
        }
        try {
            const movieDetails = await fetchMovieDetails(urlfilm);
            if (movieDetails) {
                res.json({
                    status: 'success',
                    message: 'Detail film ditemukan',
                    movieDetails: movieDetails,
                    author: 'Azatxyz',
                    usage: 'Untuk mendapatkan detail film, gunakan mode=detail&urlfilm={url_film}. Contoh: /api/rebahinxxi?mode=detail&urlfilm=https://rebahinxxi.vip/nonton-marni-the-story-of-wewe-gombel-2024/'
                });
            } else {
                res.status(404).json({
                    error: 'Detail film tidak ditemukan.',
                    author: 'Azatxyz',
                    usage: 'Untuk mendapatkan detail film, gunakan mode=detail&urlfilm={url_film}. Contoh: /api/rebahinxxi?mode=detail&urlfilm=https://rebahinxxi.vip/nonton-marni-the-story-of-wewe-gombel-2024/'
                });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({
                error: 'Terjadi kesalahan pada server.',
                author: 'Azatxyz',
                usage: 'Untuk mendapatkan detail film, gunakan mode=detail&urlfilm={url_film}. Contoh: /api/rebahinxxi?mode=detail&urlfilm=https://rebahinxxi.vip/nonton-marni-the-story-of-wewe-gombel-2024/'
            });
        }
    } else {
        return res.status(400).json({
            error: 'Mode tidak valid. Gunakan "search" atau "detail".',
            author: 'Azatxyz',
            usage: 'Contoh: /api/rebahinxxi?mode=search&query=Marni atau /api/rebahinxxi?mode=detail&urlfilm={url_film}'
        });
    }
});

module.exports = router;
